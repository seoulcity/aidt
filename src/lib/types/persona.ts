export type PerformanceLevel = '상' | '중' | '하';

export interface StudentPerformance {
  [concept: string]: PerformanceLevel;
}

export interface StudentPersona {
  id: number;
  name: string;
  performances: StudentPerformance;
  averageLevel?: PerformanceLevel;
}

export interface PersonaPrompt {
  level: PerformanceLevel;
  type: 'learning_tip' | 'emotional_support';
  prompt: string;
}

export interface PersonaChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  type: 'learning_tip' | 'emotional_support';
  level?: PerformanceLevel;
  isError?: boolean;
  isDeleted?: boolean;
} 