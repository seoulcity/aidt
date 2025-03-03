// src/routes/api-test/stores/paginationStore.ts
import { writable, derived, get } from 'svelte/store';
import { getResponses } from '../db';
import type { PaginationStore, PaginationStoreState, PaginationExternalState, ResponseData } from './types';
import { supabase } from '$lib/supabaseClient';

// Initial state
const initialState: PaginationStoreState = {
  currentPage: 1,
  itemsPerPage: 20
};

// Create pagination store
export function createPaginationStore(): PaginationStore {
  const { subscribe, update, set } = writable<PaginationStoreState>(initialState);
  
  // Store for external dependencies
  const externalState = writable<PaginationExternalState>({
    totalCount: 0,
    selectedBatchId: null,
    isIndividualMode: false,
    selectedCategory: '전체',
    responses: [],
    allResponses: [],
    setResponses: (responses: ResponseData[]) => {}
  });
  
  // Derived store for total pages
  const totalPagesStore = derived(
    externalState, 
    ($external) => Math.ceil($external.totalCount / get({ subscribe }).itemsPerPage)
  );
  
  // Derived store for page numbers
  const pageNumbersStore = derived(
    totalPagesStore, 
    ($totalPages) => Array.from({ length: $totalPages }, (_, i) => i + 1)
  );
  
  // Derived store for visible page numbers
  const visiblePageNumbersStore = derived(
    [pageNumbersStore, { subscribe }, externalState], 
    ([$pageNumbers, $state, $external]) => {
      return $pageNumbers.filter(
        page => page === 1 || page === $pageNumbers.length || 
        (page >= $state.currentPage - 2 && page <= $state.currentPage + 2)
      );
    }
  );
  
  return {
    subscribe,
    update,
    set,
    
    // Update external state
    updateExternalState(newState: Partial<PaginationExternalState>) {
      externalState.update(state => ({ ...state, ...newState }));
      
      // Force a recalculation of derived stores
      const updatedState = get(externalState);
      const currentState = get({ subscribe });
      
      // If totalCount is updated, we need to recalculate totalPages
      if (newState.totalCount !== undefined || newState.selectedCategory !== undefined) {
        // This will trigger the derived stores to update
        update(state => ({ ...state }));
      }
    },
    
    // Change page
    async changePage(page: number) {
      const state = get({ subscribe });
      const external = get(externalState);
      
      const totalPages = get(totalPagesStore);
      if (page < 1 || page > totalPages || page === state.currentPage) {
        return;
      }
      
      // Get the batch ID and mode
      const batchId = external.selectedBatchId;
      const isIndividualMode = external.isIndividualMode;
      const selectedCategory = external.selectedCategory;
      
      console.log('Changing page:', { page, batchId, isIndividualMode, selectedCategory, totalPages });
      
      if (!batchId) {
        console.error('No batch ID available for pagination');
        return;
      }
      
      // First update the current page to ensure UI reflects the change
      update(state => ({ ...state, currentPage: page }));
      
      // Calculate range for pagination
      const start = (page - 1) * state.itemsPerPage;
      const end = start + state.itemsPerPage - 1;
      
      try {
        let responseData: ResponseData[] = [];
        
        // Handle different category filtering scenarios
        if (selectedCategory === '전체') {
          // Get data for the page from server
          const result = await getResponses({ 
            batchId: isIndividualMode ? undefined : batchId,
            isBatch: isIndividualMode ? false : undefined,
            page: page,
            limit: state.itemsPerPage
          });
          
          responseData = result.data;
          console.log('Fetched "All" category data:', { length: responseData.length, page });
        } else if (selectedCategory === '에러') {
          // Get error responses for the page
          const { data, error } = await supabase
            .from('clario_responses')
            .select('*')
            .eq(isIndividualMode ? 'is_batch' : 'batch_id', isIndividualMode ? false : batchId)
            .not('error_message', 'is', null)
            .order('created_at', { ascending: false })
            .range(start, end);
          
          responseData = data || [];
          console.log('Fetched "Error" category data:', { length: responseData.length, page, error });
        } else {
          // Get category responses for the page
          const { data, error } = await supabase
            .from('clario_responses')
            .select('*')
            .eq(isIndividualMode ? 'is_batch' : 'batch_id', isIndividualMode ? false : batchId)
            .eq('query_category', selectedCategory)
            .order('created_at', { ascending: false })
            .range(start, end);
          
          responseData = data || [];
          console.log('Fetched specific category data:', { category: selectedCategory, length: responseData.length, page, error });
        }
        
        // Then update responses
        console.log('Setting responses:', { length: responseData.length, page });
        if (external.setResponses && typeof external.setResponses === 'function') {
          external.setResponses(responseData);
        } else {
          console.error('setResponses function is not available');
        }
      } catch (error) {
        console.error('페이지 변경 중 오류:', error);
      }
    },
    
    // Getter for total pages
    get totalPages() {
      return get(totalPagesStore);
    },
    
    // Getter for page numbers
    get pageNumbers() {
      return get(pageNumbersStore);
    },
    
    // Getter for visible page numbers
    get visiblePageNumbers() {
      return get(visiblePageNumbersStore);
    }
  };
}

// Create pagination store instance
export const paginationStore = createPaginationStore(); 