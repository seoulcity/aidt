// src/routes/api-test/types.ts
export interface FormData {
  query: string;
  group_id: string;
  persona: string;
  user_type: string;
  query_category?: string;
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

export interface ClarioState {
  loading: boolean;
  error: any;
  streamingText: string;
  metadata: Metadata | null;
  formData: FormData;
} 