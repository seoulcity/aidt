// src/lib/types/chat.ts
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  type?: 'normal' | 'forbidden' | 'harmful' | 'distraction' | 'hate' | 'learning_strategy' | 'motivation' | 'learning_distraction';
  isStreaming?: boolean;
  isError?: boolean;
  isDeleted?: boolean;
  prompt?: string;
  rawContent?: string;
  relatedMessageId?: string;
  forbiddenInfo?: {
    category: string;
    keyword: string;
  };
  analysisInfo?: {
    isHarmful?: boolean;
    isViolent?: boolean;
    isDistraction?: boolean;
    isHate?: boolean;
    reasons: {
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
  };
}

export interface ScrollEvent extends Event {
  target: HTMLElement & {
    scrollTop: number;
    scrollHeight: number;
    clientHeight: number;
  };
}

export interface MessageCompleteEvent {
  detail: {
    index: number;
    text: string;
  };
}

export interface ChatService {
  messages: ChatMessage[];
  isLoading: boolean;
  sendMessage(messageText: string): Promise<{ success: boolean; error?: Error }>;
  updateStreamingMessage(index: number, text: string): void;
  getMessages(): ChatMessage[];
  getLoadingState(): boolean;
} 