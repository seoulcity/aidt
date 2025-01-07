// src/lib/types/forbidden.ts
export interface ForbiddenCategory {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface ForbiddenKeyword {
  id: number;
  category_id: number;
  keyword: string;
  severity: 'low' | 'medium' | 'high';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ForbiddenExample {
  id: number;
  category_id: number;
  example: string;
  created_at: string;
  updated_at: string;
}

export interface ForbiddenCategoryWithDetails extends ForbiddenCategory {
  keywords: ForbiddenKeyword[];
  examples: ForbiddenExample[];
} 