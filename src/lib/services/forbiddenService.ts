// src/lib/services/forbiddenService.ts
import { mathProSupabase } from '$lib/mathProSupabaseClient';
import type { ForbiddenCategory, ForbiddenKeyword, ForbiddenExample, ForbiddenCategoryWithDetails } from '$lib/types/forbidden';

class ForbiddenService {
  async getCategories(): Promise<ForbiddenCategory[]> {
    const { data, error } = await mathProSupabase
      .from('forbidden_categories')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  }

  async getCategoryWithDetails(categoryId: number): Promise<ForbiddenCategoryWithDetails | null> {
    const { data, error } = await mathProSupabase
      .from('forbidden_categories')
      .select(`
        *,
        keywords:forbidden_keywords(*),
        examples:forbidden_examples(*)
      `)
      .eq('id', categoryId)
      .single();
    
    if (error) throw error;
    return data;
  }

  async getAllCategoriesWithDetails(): Promise<ForbiddenCategoryWithDetails[]> {
    const { data, error } = await mathProSupabase
      .from('forbidden_categories')
      .select(`
        *,
        keywords:forbidden_keywords(*),
        examples:forbidden_examples(*)
      `)
      .order('name');
    
    if (error) throw error;
    return data;
  }

  async addKeyword(keyword: Omit<ForbiddenKeyword, 'id' | 'created_at' | 'updated_at'>): Promise<ForbiddenKeyword> {
    const { data, error } = await mathProSupabase
      .from('forbidden_keywords')
      .insert([keyword])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateKeyword(id: number, keyword: Partial<ForbiddenKeyword>): Promise<ForbiddenKeyword> {
    try {
      const updateData = {
        is_active: keyword.is_active,
        updated_at: new Date().toISOString()
      };
      
      const { data: updatedData, error: updateError } = await mathProSupabase
        .from('forbidden_keywords')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      if (!updatedData) throw new Error('Failed to update keyword');

      return updatedData;
    } catch (error) {
      console.error('키워드 업데이트 중 오류 발생:', error);
      throw error;
    }
  }

  async addExample(example: Omit<ForbiddenExample, 'id' | 'created_at' | 'updated_at'>): Promise<ForbiddenExample> {
    const { data, error } = await mathProSupabase
      .from('forbidden_examples')
      .insert([example])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteKeyword(id: number): Promise<void> {
    const { error } = await mathProSupabase
      .from('forbidden_keywords')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
}

export const forbiddenService = new ForbiddenService(); 