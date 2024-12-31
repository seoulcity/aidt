// src/lib/services/adaptiveChatService.ts
import type { ChatMessage, ChatService } from '$lib/types/chat';
import { forbiddenService } from './forbiddenService';
import type { ForbiddenCategoryWithDetails } from '$lib/types/forbidden';

interface MessageAnalysis {
  type: 'normal' | 'forbidden' | 'harmful' | 'distraction' | 'hate';
  category?: string;
  reason?: string;
  isHarmful?: boolean;
  isViolent?: boolean;
  isDistraction?: boolean;
  isHate?: boolean;
  forbiddenInfo?: {
    category: string;
    keyword: string;
  };
  analysisDetails?: {
    distractionScore?: number;
    hateScore?: number;
    detectedKeywords?: string[];
    categories?: string[];
  };
}

export class AdaptiveChatService implements ChatService {
  private _messages: ChatMessage[];
  isLoading: boolean;
  private forbiddenCategories: ForbiddenCategoryWithDetails[] = [];

  constructor() {
    this._messages = [];
    this.isLoading = false;
    this.loadForbiddenCategories();
  }

  get messages(): ChatMessage[] {
    return this._messages;
  }

  set messages(value: ChatMessage[]) {
    this._messages = value;
  }

  private cleanDeletedMessages() {
    // 삭제된 메시지를 실제로 제거
    this._messages = this._messages.filter(msg => !msg.isDeleted);
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

    // 이전 메시지가 처리 중인지 확인
    if (this.isLoading) return { success: false };

    // 새로운 메시지 ID 생성 (타임스탬프 + 랜덤값)
    const messageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 메시지가 이미 있는지 확인
    const lastMessage = this._messages[this._messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user' || lastMessage.content !== messageText) {
      const userMessage: ChatMessage = {
        id: messageId,
        role: 'user',
        content: messageText,
        timestamp: new Date(),
        type: 'normal'
      };
      this._messages = [...this._messages, userMessage];
    }

    this.isLoading = true;

    try {
      // 메시지 분석
      const analysis = await this.analyzeMessage(messageText);

      // 분석 결과에 따른 시스템 프롬프트 선택
      const systemPrompt = this.selectSystemPrompt(analysis);
      
      if (analysis.type === 'forbidden') {
        // 마지막 사용자 메시지에 금칙어 정보 추가
        const userMessageIndex = this._messages.length - 1;
        this._messages[userMessageIndex] = {
          ...this._messages[userMessageIndex],
          type: 'forbidden',
          forbiddenInfo: analysis.forbiddenInfo
        };

        // 경고 메시지 추가 (사용자 메시지와 연결)
        const warningMessage: ChatMessage = {
          id: `${messageId}-warning`,
          role: 'system',
          content: `금칙어가 포함되어 있어 메시지가 삭제됩니다.`,
          timestamp: new Date(),
          isError: true,
          type: 'forbidden',
          forbiddenInfo: analysis.forbiddenInfo,
          relatedMessageId: messageId
        };

        // 경고 메시지를 사용자 메시지 바로 다음에 추가
        this._messages = [...this._messages, warningMessage];

        // 3초 후에 사용자 메시지만 삭제 상태로 변경
        setTimeout(() => {
          const targetMessageIndex = this._messages.findIndex(msg => msg.id === messageId);
          if (targetMessageIndex !== -1) {
            // 사용자 메시지만 삭제 상태로 변경
            this._messages = this._messages.map(msg => 
              msg.id === messageId ? { ...msg, isDeleted: true } : msg
            );
            // 메시지 상태 업데이트를 위해 배열을 새로 할당
            this._messages = [...this._messages];
          }
        }, 3000);

        this.isLoading = false;
        return { success: false, error: new Error('Forbidden content detected') };
      }

      // 마지막 사용자 메시지의 분석 결과 업데이트
      const lastUserMessageIndex = this._messages.length - 1;
      if (analysis.type === 'harmful') {
        this._messages[lastUserMessageIndex] = {
          ...this._messages[lastUserMessageIndex],
          type: 'harmful',
          analysisInfo: {
            isHarmful: analysis.isHarmful,
            isViolent: analysis.isViolent,
            reasons: analysis.reasons || []
          }
        };
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
        id: `${messageId}-response`,
        role: 'assistant',
        content: result.content,
        timestamp: new Date(),
        isStreaming: true,
        type: analysis.type,
        relatedMessageId: messageId
      };

      this._messages = [...this._messages, assistantMessage];
      return { success: true };
    } catch (error) {
      console.error('채팅 처리 오류:', error);
      const errorMessage: ChatMessage = {
        id: `${messageId}-error`,
        role: 'system',
        content: '죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.',
        timestamp: new Date(),
        isError: true,
        type: 'normal',
        relatedMessageId: messageId
      };
      this._messages = [...this._messages, errorMessage];
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    } finally {
      this.isLoading = false;
    }
  }

  private async analyzeMessage(messageText: string): Promise<MessageAnalysis & {
    isHarmful?: boolean;
    isViolent?: boolean;
    reasons?: {
      type: 'harmful' | 'violent' | 'distraction' | 'hate';
      reason: string;
      helpline?: string[];
    }[];
  }> {
    // 금칙어 검사
    for (const category of this.forbiddenCategories) {
      for (const keyword of category.keywords) {
        if (messageText.toLowerCase().includes(keyword.keyword.toLowerCase())) {
          return {
            type: 'forbidden',
            category: category.name,
            reason: `${category.name} 카테고리의 금칙어 "${keyword.keyword}" 포함`,
            forbiddenInfo: {
              category: category.name,
              keyword: keyword.keyword
            }
          };
        }
      }
    }

    // 병렬로 모든 내용 검사 수행
    const [harmfulAnalysis, violentAnalysis, distractionAnalysis, hateAnalysis] = await Promise.all([
      // 자살/자해 내용 검사
      fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          systemPrompt: `당신은 메시지가 자살이나 자해를 암시하는 내용을 포함하고 있는지 판단하는 분석가입니다.
          메시지를 분석하고 자살이나 자해를 암시하는 내용이 있으면 1, 없으면 0으로만 답변하세요.
          
          메시지: ${messageText}
          
          답변:`,
          userMessage: messageText
        })
      }).then(res => res.json()),

      // 반사회적/폭력적 내용 검사
      fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          systemPrompt: `당신은 메시지가 반사회적이거나 폭력적인 내용을 포함하고 있는지 판단하는 분석가입니다.
          메시지를 분석하고 반사회적이거나 폭력적인 내용이 있으면 1, 없으면 0으로만 답변하세요.
          
          메시지: ${messageText}
          
          답변:`,
          userMessage: messageText
        })
      }).then(res => res.json()),

      // 학습 방해 요소 검사 (개선된 버전)
      fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          systemPrompt: `당신은 학습에 방해되는 요소를 감지하는 분석가입니다.
          다음과 같은 내용이 있는지 자세히 분석하세요:
          
          1. 게임 관련:
          - 온라인/모바일 게임 언급
          - PC방, 오락실 등 게임 장소 언급
          - 게임 캐릭터, 아이템, 레벨 등 관련 용어
          
          2. 오락/여가 활동:
          - TV, 영화, 드라마 시청
          - SNS, 유튜브 등 소셜 미디어
          - 놀이, 노는 것에 대한 언급
          
          3. 학습 회피:
          - 공부 거부/회피 표현
          - 다른 활동으로 전환 시도
          - 집중력 저하 요인 언급
          
          메시지를 분석하고 다음 JSON 형식으로 답변하세요:
          {
            "isDistraction": 1 또는 0,
            "score": 0~1 사이의 점수,
            "keywords": [감지된 키워드들],
            "categories": [해당되는 카테고리들]
          }
          
          메시지: ${messageText}`,
          userMessage: messageText
        })
      }).then(res => res.json()),

      // 혐오 표현 검사
      fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          systemPrompt: `당신은 혐오 표현을 감지하는 분석가입니다.
          다음과 같은 혐오 표현이 있는지 분석하세요:
          
          1. 차별적 표현:
          - 성별, 나이, 인종, 출신 등에 대한 차별
          - 외모, 장애, 질병 등에 대한 비하
          - 특정 집단에 대한 편견
          
          2. 모욕적 표현:
          - 비하/멸시하는 표현
          - 모욕적인 별칭/비유
          - 인격 모독
          
          메시지를 분석하고 다음 JSON 형식으로 답변하세요:
          {
            "isHate": 1 또는 0,
            "score": 0~1 사이의 점수,
            "category": "감지된 혐오 표현 카테고리",
            "examples": ["감지된 구체적인 표현들"]
          }
          
          메시지: ${messageText}`,
          userMessage: messageText
        })
      }).then(res => res.json())
    ]);

    const isHarmful = harmfulAnalysis.content.trim() === '1';
    const isViolent = violentAnalysis.content.trim() === '1';
    
    // 학습 방해 요소 분석 결과 파싱
    let distractionResult;
    try {
      distractionResult = typeof distractionAnalysis.content === 'string' 
        ? JSON.parse(distractionAnalysis.content)
        : distractionAnalysis.content;
    } catch (e) {
      distractionResult = { isDistraction: 0, score: 0, keywords: [], categories: [] };
    }
    
    // 혐오 표현 분석 결과 파싱
    let hateResult;
    try {
      hateResult = typeof hateAnalysis.content === 'string'
        ? JSON.parse(hateAnalysis.content)
        : hateAnalysis.content;
    } catch (e) {
      hateResult = { isHate: 0, score: 0, category: '', examples: [] };
    }

    const isDistraction = distractionResult.isDistraction === 1;
    const isHate = hateResult.isHate === 1;

    if (isHarmful || isViolent || isDistraction || isHate) {
      const reasons = [];
      
      if (isHarmful) {
        reasons.push({
          type: 'harmful' as const,
          reason: '자살 또는 자해 관련 내용이 감지되었습니다.',
          helpline: [
            '자살예방상담전화 ☎ 1393',
            '정신건강상담전화 ☎ 1577-0199'
          ]
        });
      }
      
      if (isViolent) {
        reasons.push({
          type: 'violent' as const,
          reason: '반사회적이거나 폭력적인 내용이 감지되었습니다.'
        });
      }

      if (isDistraction) {
        reasons.push({
          type: 'distraction' as const,
          reason: '학습에 방해되는 내용이 감지되었습니다.',
          suggestions: [
            '현재 학습 주제에 집중해주세요.',
            '게임이나 다른 주제는 학습이 끝난 후에 이야기해요.',
            '효과적인 학습을 위해 한 가지 주제에 집중하는 것이 좋습니다.'
          ],
          details: {
            category: distractionResult.categories.join(', '),
            examples: distractionResult.keywords
          }
        });
      }

      if (isHate) {
        reasons.push({
          type: 'hate' as const,
          reason: '혐오 표현이 감지되었습니다.',
          suggestions: [
            '서로를 존중하는 표현을 사용해주세요.',
            '차별적이거나 비하하는 표현은 삼가주세요.',
            '건전한 대화를 위해 적절한 언어를 사용해주세요.'
          ],
          details: {
            category: hateResult.category,
            examples: hateResult.examples
          }
        });
      }

      return {
        type: isHarmful || isViolent ? 'harmful' : isHate ? 'hate' : 'distraction',
        isHarmful,
        isViolent,
        isDistraction,
        isHate,
        reasons,
        analysisDetails: {
          distractionScore: distractionResult.score,
          hateScore: hateResult.score,
          detectedKeywords: [...(distractionResult.keywords || []), ...(hateResult.examples || [])],
          categories: [...(distractionResult.categories || []), hateResult.category].filter(Boolean)
        }
      };
    }

    return {
      type: 'normal'
    };
  }

  private selectSystemPrompt(analysis: MessageAnalysis): string {
    switch (analysis.type) {
      case 'normal':
        return '학습자의 질문에 친절하고 명확하게 답변해주세요.';
      case 'forbidden':
        return '금칙어가 포함된 질문입니다. 정중하게 거절해주세요.';
      case 'harmful':
        return `자살/자해 관련 내용이 감지되었습니다. 다음과 같이 답변해주세요:
        1. 공감과 이해를 표현하되, 자살/자해를 조장하지 않도록 주의하세요.
        2. 전문가 상담을 권유하세요.
        3. 긍정적인 대안과 해결방법을 제시하세요.`;
      case 'distraction':
        return `학습에 방해되는 내용이 감지되었습니다. 다음과 같이 답변해주세요:
        1. 현재 학습 주제로 돌아올 수 있도록 유도하세요.
        2. 학습 집중의 중요성을 설명하세요.
        3. 구체적인 학습 방법이나 전략을 제안하세요.`;
      case 'hate':
        return `혐오 표현이 감지되었습니다. 다음과 같이 답변해주세요:
        1. 혐오 표현의 부적절성을 설명하세요.
        2. 서로 존중하는 표현의 중요성을 강조하세요.
        3. 건전한 대화를 위한 대안적 표현을 제시하세요.`;
      default:
        return '학습자의 질문에 친절하고 명확하게 답변해주세요.';
    }
  }

  updateStreamingMessage(index: number, text: string): void {
    this._messages = this._messages.map((msg, i) => {
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
    // 삭제된 메시지를 제외하고, 원래 순서대로 반환
    return this._messages.filter(msg => !msg.isDeleted);
  }

  getLoadingState(): boolean {
    return this.isLoading;
  }
} 