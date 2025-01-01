// src/lib/services/adaptiveChatService.ts
import type { ChatMessage, ChatService } from '$lib/types/chat';
import { forbiddenService } from './forbiddenService';
import type { ForbiddenCategoryWithDetails } from '$lib/types/forbidden';
import { EmbeddingService } from './embeddingService';

interface MessageAnalysis {
  type: 'normal' | 'forbidden' | 'harmful' | 'distraction' | 'hate' | 'learning_strategy' | 'motivation' | 'learning_distraction';
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
  reasons?: {
    type: 'harmful' | 'violent' | 'distraction' | 'hate';
    reason: string;
    helpline?: string[];
    suggestions?: string[];
    details?: {
      category: string;
      examples: string[];
    };
  }[];
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
    console.log('=== sendMessage 시작 ===');
    console.log('입력된 메시지:', messageText);

    if (!messageText.trim()) return { success: false };
    if (this.isLoading) return { success: false };

    const messageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log('생성된 메시지 ID:', messageId);

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
      console.log('새 사용자 메시지 생성:', userMessage);
      this._messages = [...this._messages, userMessage];
    }

    this.isLoading = true;

    try {
      console.log('메시지 분석 시작...');
      const analysis = await this.analyzeMessage(messageText);
      console.log('메시지 분석 결과:', analysis);

      const systemPrompt = this.selectSystemPrompt(analysis);
      console.log('선택된 시스템 프롬프트:', systemPrompt);
      
      if (analysis.type === 'forbidden') {
        console.log('금칙어 감지됨');
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
        console.log('유해 콘텐츠 감지됨');
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

      console.log('API 요청 시작...');
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
      console.log('API 응답 결과:', result);

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
      console.log('생성된 어시스턴트 메시지:', assistantMessage);

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

  private async analyzeMessage(messageText: string): Promise<MessageAnalysis> {
    console.log('=== analyzeMessage 시작 ===');
    // 초기 분석 결과를 'normal'로 설정
    let analysis: MessageAnalysis = {
      type: 'normal'
    };
    console.log('초기 분석 상태:', analysis);

    // 임베딩 유사도 계산을 먼저 수행
    try {
      console.log('임베딩 유사도 계산 시작...');
      const embeddingResult = await EmbeddingService.calculateSimilarities(messageText);
      console.log('임베딩 분석 결과:', embeddingResult);
      
      // 최고 유사도 값 확인 (상위 5개 중 첫 번째)
      const maxSimilarity = embeddingResult.similarities[0]?.similarity || 0;
      console.log('최고 유사도:', maxSimilarity);

      // 유사도가 0.6(60%) 이상인 경우에만 카테고리 설정
      if (maxSimilarity >= 0.6) {
        if (embeddingResult.category === '학습 방법/전략') {
          analysis.type = 'learning_strategy';
          console.log('카테고리가 학습 방법/전략으로 설정됨');
        } else if (embeddingResult.category === '동기부여/정서') {
          analysis.type = 'motivation';
          console.log('카테고리가 동기부여/정서로 설정됨');
        } else if (embeddingResult.category === '학습 방해 활동') {
          analysis.type = 'learning_distraction';
          console.log('카테고리가 학습 방해 활동으로 설정됨');
        }
      } else {
        console.log('유사도가 60% 미만이므로 일반 타입으로 유지');
      }
      console.log('임베딩 분석 후 상태:', analysis);
    } catch (error) {
      console.error('임베딩 유사도 계산 중 오류:', error);
    }

    // 금칙어 검사
    for (const category of this.forbiddenCategories) {
      for (const keyword of category.keywords) {
        if (messageText.toLowerCase().includes(keyword.keyword.toLowerCase())) {
          analysis = {
            type: 'forbidden',
            category: category.name,
            reason: `${category.name} 카테고리의 금칙어 "${keyword.keyword}" 포함`,
            forbiddenInfo: {
              category: category.name,
              keyword: keyword.keyword
            }
          };
          return analysis;
        }
      }
    }

    // 유해성 검사 수행
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
          systemPrompt: `당신은 메시지가 학습에 방해되는 요소를 포함하고 있는지 판단하는 분석가입니다.
          다음과 같은 내용이 있는지 분석하세요:
          - 게임, 오락 관련 내용
          - 학습 회피/거부 표현
          - 집중력 저하 요인
          
          메시지를 분석하고 학습 방해 요소가 있으면 1, 없으면 0으로만 답변하세요.
          
          메시지: ${messageText}
          
          답변:`,
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
          systemPrompt: `당신은 메시지가 혐오 표현이나 차별적 내용을 포함하고 있는지 판단하는 분석가입니다.
          다음과 같은 혐오 표현이 있는지 분석하세요:
          - 성별, 나이, 인종, 출신 등에 대한 차별
          - 외모, 장애, 질병 등에 대한 비하
          - 특정 집단에 대한 편견이나 모욕
          
          메시지를 분석하고 혐오 표현이 있으면 1, 없으면 0으로만 답변하세요.
          
          메시지: ${messageText}
          
          답변:`,
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

      // 유해성이 발견된 경우에만 type을 변경
      if (isHarmful || isViolent) {
        analysis.type = 'harmful';
      } else if (isHate) {
        analysis.type = 'hate';
      } else if (isDistraction) {
        analysis.type = 'distraction';
      }

      // 기존 분석 결과에 유해성 정보 추가
      analysis = {
        ...analysis,
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
    
    console.log('=== analyzeMessage 최종 결과 ===');
    console.log('최종 분석 결과:', analysis);
    return analysis;
  }

  private selectSystemPrompt(analysis: MessageAnalysis): string {
    console.log('=== selectSystemPrompt 시작 ===');
    console.log('입력된 분석 타입:', analysis.type);
    
    let prompt: string;
    switch (analysis.type) {
      case 'normal':
        prompt = '학습자의 질문에 친절하고 명확하게 답변해주세요.';
        break;
      case 'forbidden':
        prompt = '금칙어가 포함된 질문입니다. 정중하게 거절해주세요.';
        break;
      case 'harmful':
        prompt = `자살/자해 관련 내용이 감지되었습니다. 다음과 같이 답변해주세요:
        1. 공감과 이해를 표현하되, 자살/자해를 조장하지 않도록 주의하세요.
        2. 전문가 상담을 권유하세요.
        3. 긍정적인 대안과 해결방법을 제시하세요.`;
        break;
      case 'distraction':
        prompt = `학습에 방해되는 내용이 감지되었습니다. 다음과 같이 답변해주세요:
        1. 현재 학습 주제로 돌아올 수 있도록 유도하세요.
        2. 학습 집중의 중요성을 설명하세요.
        3. 구체적인 학습 방법이나 전략을 제안하세요.`;
        break;
      case 'hate':
        prompt = `혐오 표현이 감지되었습니다. 다음과 같이 답변해주세요:
        1. 혐오 표현의 부적절성을 설명하세요.
        2. 서로 존중하는 표현의 중요성을 강조하세요.
        3. 건전한 대화를 위한 대안적 표현을 제시하세요.`;
        break;
      case 'learning_strategy':
        prompt = `학습 방법과 전략에 대한 질문입니다. 다음과 같이 답변해주세요:
        1. 구체적이고 실천 가능한 학습 방법을 제시하세요.
        2. 단계별로 명확한 설명을 제공하세요.
        3. 학습 효과를 높일 수 있는 팁을 추가하세요.`;
        break;
      case 'motivation':
        prompt = `동기부여와 심리 관리에 대한 질문입니다. 다음과 같이 답변해주세요:
        1. 공감과 이해를 바탕으로 답변하세요.
        2. 긍정적인 마인드셋을 강조하세요.
        3. 실천 가능한 동기부여 방법을 제안하세요.`;
        break;
      case 'learning_distraction':
        prompt = `학습 방해 활동에 대한 질문입니다. 다음과 같이 답변해주세요:
        1. 해당 활동이 학습에 미치는 부정적 영향을 설명하세요.
        2. 학습 집중력 향상을 위한 대안적 방법을 제시하세요.
        3. 시간 관리와 자기 통제의 중요성을 강조하세요.
        4. 건전한 휴식과 여가 활동을 추천하세요.`;
        break;
      default:
        prompt = '학습자의 질문에 친절하고 명확하게 답변해주세요.';
    }
    
    console.log('선택된 프롬프트:', prompt);
    return prompt;
  }

  updateStreamingMessage(index: number, text: string): void {
    console.log('=== updateStreamingMessage 시작 ===');
    console.log('업데이트할 메시지 인덱스:', index);
    console.log('새로운 텍스트:', text);
    
    this._messages = this._messages.map((msg, i) => {
      if (i === index) {
        const updatedMsg = {
          ...msg,
          content: text,
          isStreaming: false
        };
        console.log('업데이트된 메시지:', updatedMsg);
        return updatedMsg;
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