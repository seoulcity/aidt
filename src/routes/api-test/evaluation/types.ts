// src/routes/api-test/evaluation/types.ts
// 배치 요약 정보 인터페이스
export interface BatchSummary {
  batch_id: string;
  created_at: string;
  count: number;
}

// 응답 데이터 인터페이스
export interface ResponseData {
  id: number;
  input_text: string;
  response_text: string;
  human_feedback: number | null;
  human_feedback_note: string | null;
  query_category: string;
  ragas_feedback: any;
  eva_feedback: any;
  evaluated_at: string | null;
  error_message?: string | null;
}

// 배치 통계 인터페이스
export interface CategoryStats {
  total: number;
  passed: number;
  failed: number;
  pending: number;
  // AI 테스트 관련 통계 추가
  ai_evaluated: number;
  ai_pending: number;
  faithfulness_avg: number;
  relevancy_avg: number;
}

export interface BatchStatistics {
  total: CategoryStats;
  byCategory: Record<string, CategoryStats>;
} 