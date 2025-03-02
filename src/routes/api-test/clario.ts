// src/routes/api-test/lib/types/clario.ts
export interface FormData {
  query: string;
  group_id: string;
  persona: string;
  user_type: string;
}

export interface Metadata {
  input_text: string;
  reference?: string[];
  recommended_questions?: string[];
  images?: string[];
  action: string;
  sub_action?: string;
  token_count: number;
  response_id: string;
  latency: number;
  query_category?: string;
  order_id?: string;
}

export interface ClarioResponse {
  type: 'response' | 'all';
  text?: string;
} 