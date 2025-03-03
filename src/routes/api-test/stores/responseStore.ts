// src/routes/api-test/stores/responseStore.ts
import { writable, get } from 'svelte/store';
import { supabase } from '$lib/supabaseClient';
import { getResponses } from '../db';
import type { ResponseStore, ResponseStoreState } from './types';
import { paginationStore } from './paginationStore';

// Initial state
const initialState: ResponseStoreState = {
  responses: [],
  allResponses: [],
  categories: [],
  selectedCategory: '전체',
  totalCount: 0,
  deletingIds: new Set<number>(),
  loading: false,
  error: null,
  // Add a reference to the current batch ID
  _currentBatchId: null,
  _isIndividualMode: false
};

// Create response store
export function createResponseStore(): ResponseStore {
  const { subscribe, update, set } = writable<ResponseStoreState>(initialState);

  return {
    subscribe,
    update,
    set,

    // Load responses for a batch
    async loadResponses(batchId: string | null, isIndividualMode: boolean) {
      update(state => ({ 
        ...state, 
        loading: true, 
        error: null,
        // Store the batch ID and mode for later use
        _currentBatchId: batchId,
        _isIndividualMode: isIndividualMode
      }));
      
      if (!batchId) {
        update(state => ({
          ...state,
          responses: [],
          allResponses: [],
          categories: [],
          selectedCategory: '전체',
          totalCount: 0,
          loading: false
        }));
        return;
      }
      
      try {
        const currentState = get({ subscribe });
        const itemsPerPage = 20; // Default page size
        
        // Load responses for the selected batch
        let result;
        if (isIndividualMode) {
          result = await getResponses({ 
            isBatch: false, 
            page: 1,
            limit: itemsPerPage
          });
        } else {
          result = await getResponses({ 
            batchId, 
            page: 1,
            limit: itemsPerPage
          });
        }
        
        const responseData = result.data;
        const totalCount = result.count;
        
        // Get all categories for the batch
        let allCategories: string[] = [];
        let hasErrorItems = false;
        
        try {
          // Query to get all categories
          const { data: categoryData } = await supabase
            .from('clario_responses')
            .select('query_category')
            .eq(batchId === 'individual' ? 'is_batch' : 'batch_id', batchId === 'individual' ? false : batchId)
            .order('query_category');
          
          // Remove duplicates and handle nulls
          const categorySet = new Set<string>();
          categoryData?.forEach(item => {
            if (item.query_category && item.query_category !== '전체') {
              categorySet.add(item.query_category);
            } else if (!item.query_category) {
              categorySet.add('분류 없음');
            }
          });
          
          // Check if there are error items
          const { count } = await supabase
            .from('clario_responses')
            .select('id', { count: 'exact' })
            .eq(batchId === 'individual' ? 'is_batch' : 'batch_id', batchId === 'individual' ? false : batchId)
            .not('error_message', 'is', null);
          
          hasErrorItems = count !== null && count > 0;
          
          allCategories = Array.from(categorySet);
        } catch (error) {
          console.error('카테고리 로드 중 오류:', error);
          // Fallback: Extract categories from the first page responses
          const categorySet = new Set<string>();
          responseData.forEach(response => {
            if (response.query_category && response.query_category !== '전체') {
              categorySet.add(response.query_category);
            } else if (!response.query_category) {
              categorySet.add('분류 없음');
            }
            
            // Check for error messages
            if (response.error_message) {
              hasErrorItems = true;
            }
          });
          allCategories = Array.from(categorySet);
        }
        
        // Add 'Error' category if there are error items
        if (hasErrorItems) {
          allCategories.unshift('에러');
        }
        
        // Always add 'All' category at the front
        allCategories.unshift('전체');
        
        update(state => ({
          ...state,
          responses: responseData,
          allResponses: responseData,
          categories: allCategories,
          selectedCategory: '전체',
          totalCount,
          loading: false
        }));
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : '응답을 불러오는데 실패했습니다.';
        update(state => ({ ...state, error: errorMessage, loading: false }));
      }
    },

    // Filter responses by category
    async filterByCategory(category: string) {
      const state = get({ subscribe });
      const paginationState = get(paginationStore);
      
      // Set loading state
      update(state => ({ ...state, loading: true }));
      
      try {
        // Default page size
        const pageSize = 20;
        let responseData: any[] = [];
        let allResponsesData: any[] = [];
        let totalCount = 0;
        
        // Get the batch ID and mode
        const batchId = state._currentBatchId;
        const isIndividualMode = state._isIndividualMode;
        
        if (!batchId) {
          console.error('No batch ID available for filtering');
          update(state => ({ ...state, loading: false }));
          return;
        }
        
        console.log(`Filtering by category: ${category}, batchId: ${batchId}, isIndividualMode: ${isIndividualMode}`);
        
        // Handle different category filtering scenarios
        if (category === '전체') {
          // Get all responses for the first page
          const result = await getResponses({ 
            batchId: isIndividualMode ? undefined : (batchId || undefined),
            isBatch: isIndividualMode ? false : undefined,
            page: 1,
            limit: pageSize
          });
          
          responseData = result.data;
          
          // Get total count for all responses
          const { count, error } = await supabase
            .from('clario_responses')
            .select('*', { count: 'exact', head: true })
            .eq(isIndividualMode ? 'is_batch' : 'batch_id', isIndividualMode ? false : batchId);
          
          if (error) {
            console.error('Error getting total count:', error);
            totalCount = responseData.length;
          } else {
            totalCount = count || 0;
          }
          
          // Load all responses for the batch (up to 1000 items)
          const { data: allData } = await supabase
            .from('clario_responses')
            .select('*')
            .eq(isIndividualMode ? 'is_batch' : 'batch_id', isIndividualMode ? false : batchId)
            .order('created_at', { ascending: false })
            .limit(1000);
            
          allResponsesData = allData || [];
        } else if (category === '에러') {
          // Get error responses for the first page
          const { data, count, error } = await supabase
            .from('clario_responses')
            .select('*', { count: 'exact' })
            .eq(isIndividualMode ? 'is_batch' : 'batch_id', isIndividualMode ? false : batchId)
            .not('error_message', 'is', null)
            .order('created_at', { ascending: false })
            .range(0, pageSize - 1);
          
          responseData = data || [];
          
          if (error) {
            console.error('Error getting error responses:', error);
            totalCount = responseData.length;
          } else {
            totalCount = count || 0;
          }
          
          // Load all error responses (up to 1000 items)
          const { data: allData } = await supabase
            .from('clario_responses')
            .select('*')
            .eq(isIndividualMode ? 'is_batch' : 'batch_id', isIndividualMode ? false : batchId)
            .not('error_message', 'is', null)
            .order('created_at', { ascending: false })
            .limit(1000);
            
          allResponsesData = allData || [];
        } else {
          // Get category responses for the first page
          const { data, count, error } = await supabase
            .from('clario_responses')
            .select('*', { count: 'exact' })
            .eq(isIndividualMode ? 'is_batch' : 'batch_id', isIndividualMode ? false : batchId)
            .eq('query_category', category)
            .order('created_at', { ascending: false })
            .range(0, pageSize - 1);
          
          responseData = data || [];
          
          if (error) {
            console.error('Error getting category responses:', error);
            totalCount = responseData.length;
          } else {
            totalCount = count || 0;
          }
          
          // Load all category responses (up to 1000 items)
          const { data: allData } = await supabase
            .from('clario_responses')
            .select('*')
            .eq(isIndividualMode ? 'is_batch' : 'batch_id', isIndividualMode ? false : batchId)
            .eq('query_category', category)
            .order('created_at', { ascending: false })
            .limit(1000);
            
          allResponsesData = allData || [];
        }
        
        console.log(`Filtered results: ${responseData.length} items, total: ${totalCount}, allResponses: ${allResponsesData.length}`);
        
        // Update state with the filtered responses and total count
        update(state => ({
          ...state,
          responses: responseData,
          allResponses: allResponsesData,
          selectedCategory: category,
          totalCount: totalCount,
          loading: false
        }));
        
        // Update pagination store with the new total count and category
        paginationStore.updateExternalState({ 
          totalCount,
          selectedCategory: category,
          responses: responseData,
          allResponses: allResponsesData
        });
        
        // Reset to page 1 and ensure pagination is updated
        paginationStore.update(state => ({ ...state, currentPage: 1 }));
        
        // Force a re-render of the pagination store
        setTimeout(() => {
          paginationStore.update(state => ({ ...state }));
        }, 0);
      } catch (error) {
        console.error('Error filtering by category:', error);
        // Make sure to set loading to false even if there's an error
        update(state => ({ 
          ...state, 
          loading: false,
          error: error instanceof Error ? error.message : '카테고리 필터링에 실패했습니다.'
        }));
      }
    },

    // Delete a response
    async deleteResponse(id: number, showConfirm = true) {
      if (showConfirm && !confirm('정말 이 응답을 삭제하시겠습니까?')) return;

      update(state => {
        const newDeletingIds = new Set(state.deletingIds);
        newDeletingIds.add(id);
        return { ...state, deletingIds: newDeletingIds };
      });

      try {
        const { error: err } = await supabase
          .from('clario_responses')
          .delete()
          .eq('id', id);

        if (err) throw err;
        
        update(state => {
          const filteredResponses = state.responses.filter(r => r.id !== id);
          const filteredAllResponses = state.allResponses.filter(r => r.id !== id);
          const newTotalCount = state.totalCount - 1;
          
          const newDeletingIds = new Set(state.deletingIds);
          newDeletingIds.delete(id);
          
          return {
            ...state,
            responses: filteredResponses,
            allResponses: filteredAllResponses,
            totalCount: newTotalCount,
            deletingIds: newDeletingIds
          };
        });
      } catch (e) {
        if (showConfirm) {
          alert(e instanceof Error ? e.message : '삭제하는 중 오류가 발생했습니다.');
        }
        update(state => {
          const newDeletingIds = new Set(state.deletingIds);
          newDeletingIds.delete(id);
          return { ...state, deletingIds: newDeletingIds };
        });
      }
    },
    
    // Save a new response
    async saveResponse(responseText: string, metadata: any, batchId?: string) {
      try {
        // Prepare the data for insertion
        const responseData = {
          response_text: responseText,
          input_text: metadata.input_text,
          reference: metadata.reference || null,
          recommended_questions: metadata.recommended_questions || null,
          images: metadata.images || null,
          action: metadata.action || '',
          sub_action: metadata.sub_action || null,
          token_count: metadata.token_count || 0,
          response_id: metadata.response_id || `manual-${Date.now()}`,
          latency: metadata.latency || 0,
          query_category: metadata.query_category || '분류 없음',
          batch_id: batchId || null,
          is_batch: !!batchId
        };
        
        // Insert into database
        const { data, error } = await supabase
          .from('clario_responses')
          .insert(responseData)
          .select();
        
        if (error) throw error;
        
        return data;
      } catch (e) {
        console.error('응답 저장 중 오류:', e);
        throw e;
      }
    },

    // Utility functions
    isValidArray<T>(arr: T[] | null | undefined): arr is T[] {
      return Array.isArray(arr) && arr.length > 0;
    },

    formatDate(dateString: string): string {
      return new Date(dateString).toLocaleString('ko-KR');
    }
  };
}

// Create and export response store instance
export const responseStore = createResponseStore(); 