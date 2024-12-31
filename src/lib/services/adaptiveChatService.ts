// src/lib/services/adaptiveChatService.ts
import type { ChatMessage, ChatService } from '$lib/types/chat';
import { forbiddenService } from './forbiddenService';
import type { ForbiddenCategoryWithDetails } from '$lib/types/forbidden';

interface MessageAnalysis {
  type: 'normal' | 'unethical' | 'forbidden';
  category?: string;
  reason?: string;
}

export class AdaptiveChatService implements ChatService {
  messages: ChatMessage[];
  isLoading: boolean;
  private forbiddenCategories: ForbiddenCategoryWithDetails[] = [];

  constructor() {
    this.messages = [];
    this.isLoading = false;
    this.loadForbiddenCategories();
  }

  async loadForbiddenCategories() {
    try {
      this.forbiddenCategories = await forbiddenService.getAllCategoriesWithDetails();
    } catch (error) {
      console.error('금칙어 카테고리 로딩 오류:', error);
    }
  }

  getForbiddenCategories(): ForbiddenCategoryWithDetails[] {
    return this.forbiddenCategories;
  }

  async sendMessage(messageText: string) {
    if (!messageText.trim()) return { success: false };

    // 메시지가 이미 있는지 확인
    const lastMessage = this.messages[this.messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user' || lastMessage.content !== messageText) {
      const userMessage: ChatMessage = {
        role: 'user',
        content: messageText,
        timestamp: new Date()
      };
      this.messages = [...this.messages, userMessage];
    }

    this.isLoading = true;

    try {
      // 메시지 분석
      const analysis = await this.analyzeMessage(messageText);

      // 분석 결과에 따른 시스템 프롬프트 선택
      const systemPrompt = this.selectSystemPrompt(analysis);
      
      if (analysis.type === 'forbidden') {
        const warningMessage: ChatMessage = {
          role: 'system',
          content: `죄송합니다. 부적절한 내용이 포함되어 있습니다: ${analysis.reason}`,
          timestamp: new Date(),
          isError: true
        };
        this.messages = [...this.messages, warningMessage];
        this.isLoading = false;
        return { success: false, error: new Error('Forbidden content detected') };
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          systemPrompt,
          userMessage: messageText
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: result.content,
        timestamp: new Date(),
        isStreaming: true
      };

      this.messages = [...this.messages, assistantMessage];
      return { success: true };
    } catch (error) {
      console.error('채팅 처리 오류:', error);
      const errorMessage: ChatMessage = {
        role: 'system',
        content: '죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.',
        timestamp: new Date(),
        isError: true
      };
      this.messages = [...this.messages, errorMessage];
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    } finally {
      this.isLoading = false;
    }
  }

  private async analyzeMessage(messageText: string): Promise<MessageAnalysis> {
    // 금칙어 검사
    for (const category of this.forbiddenCategories) {
      for (const keyword of category.keywords) {
        if (messageText.toLowerCase().includes(keyword.keyword.toLowerCase())) {
          return {
            type: 'forbidden',
            category: category.name,
            reason: `${category.name} 카테고리의 금칙어 "${keyword.keyword}" 포함`
          };
        }
      }
    }

    // 메시지 분석을 위한 API 호출
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        systemPrompt: `
          당신은 학습자의 메시지를 분석하여 적절한 응답 방식을 결정하는 분석가입니다.
          다음 기준에 따라 메시지를 분석하세요.
          
          금칙어 카테고리 목록:
          ${this.forbiddenCategories.map(category => `
          ${category.name} (${category.description}):
          - 키워드: ${category.keywords.map(k => k.keyword).join(', ')}
          - 예시: ${category.examples.map(e => e.example).join(', ')}
          `).join('\n')}

          메시지를 분석하고 다음 형식의 JSON으로만 응답하세요:
          {
            "type": "normal" | "unethical" | "forbidden",
            "category": "분류 (예: ${this.forbiddenCategories.map(c => c.name).join(', ')} 등)",
            "reason": "분류 이유"
          }
        `,
        userMessage: messageText
      })
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error);

    return result;
  }

  private selectSystemPrompt(analysis: MessageAnalysis): string {
    switch (analysis.type) {
      case 'normal':
        return '학습자의 질문에 친절하고 명확하게 답변해주세요.';
      case 'unethical':
        return '학습자의 질문에 윤리적인 관점에서 조언하며 답변해주세요.';
      case 'forbidden':
        return '부적절한 내용이 포함된 질문입니다. 정중하게 거절해주세요.';
      default:
        return '학습자의 질문에 친절하고 명확하게 답변해주세요.';
    }
  }

  updateStreamingMessage(index: number, text: string): void {
    this.messages = this.messages.map((msg, i) => {
      if (i === index) {
        return {
          ...msg,
          content: text,
          isStreaming: false
        };
      }
      return msg;
    });
  }

  getMessages(): ChatMessage[] {
    return this.messages;
  }

  getLoadingState(): boolean {
    return this.isLoading;
  }
} 