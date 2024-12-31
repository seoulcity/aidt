// src/lib/types/chat.ts
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  isError?: boolean;
  prompt?: string;
  rawContent?: string;
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