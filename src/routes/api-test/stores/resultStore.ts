// src/routes/api-test/stores/resultStore.ts
import { writable, derived, get } from 'svelte/store';
import type { ResultStore, ResultStoreState, ResponseData } from './types';
import { batchStore } from './batchStore';
import { responseStore } from './responseStore';
import { paginationStore } from './paginationStore';
import { retryResponse, retryingIdsStore, isRetrying } from './retryService';
import { retryBatchByCategory, batchRetryStore, cancelBatchRetry } from './batchRetryService';
import { isValidArray, formatDate } from './resultStoreUtils';

// Initial state
const initialState: ResultStoreState = {
  // Batch state
  batchSummaries: [],
  selectedBatchId: null,
  isIndividualMode: false,
  deletingBatchId: null,
  deletingBatchProgress: 0,
  
  // Response state
  responses: [],
  allResponses: [],
  categories: [],
  selectedCategory: '전체',
  totalCount: 0,
  deletingIds: new Set<number>(),
  _currentBatchId: null,
  _isIndividualMode: false,
  
  // Pagination state
  currentPage: 1,
  itemsPerPage: 20,
  
  // Common state
  loading: false,
  error: null,
  
  // Retry state
  retryingIds: new Set<number>(),
  
  // Batch retry state
  batchRetryInProgress: false,
  batchRetryCancelled: false
};

// Create result store
function createResultStore(): ResultStore {
  const { subscribe, update: internalUpdate, set: internalSet } = writable<ResultStoreState>(initialState);
  
  // Derived store for paginated responses
  const paginatedResponsesStore = derived(
    [{ subscribe }, responseStore], 
    ([$state, $responseStore]) => {
      // Return the responses from the responseStore to ensure reactivity
      return $responseStore.responses;
    }
  );
  
  // Derived store for total pages
  const totalPagesStore = derived({ subscribe }, ($state) => {
    return Math.ceil($state.totalCount / $state.itemsPerPage);
  });
  
  // Derived store for page numbers
  const pageNumbersStore = derived(totalPagesStore, ($totalPages) => {
    return Array.from({ length: $totalPages }, (_, i) => i + 1);
  });
  
  // Derived store for visible page numbers
  const visiblePageNumbersStore = derived(
    [pageNumbersStore, { subscribe }], 
    ([$pageNumbers, $state]) => {
      return $pageNumbers.filter(
        page => page === 1 || page === $pageNumbers.length || 
        (page >= $state.currentPage - 2 && page <= $state.currentPage + 2)
      );
    }
  );
  
  // Subscribe to changes in the individual stores
  const unsubscribeBatch = batchStore.subscribe(batchState => {
    internalUpdate(state => ({
      ...state,
      batchSummaries: batchState.batchSummaries,
      selectedBatchId: batchState.selectedBatchId,
      isIndividualMode: batchState.isIndividualMode,
      deletingBatchId: batchState.deletingBatchId,
      deletingBatchProgress: batchState.deletingBatchProgress,
      loading: state.loading || batchState.loading,
      error: batchState.error || state.error
    }));
  });
  
  const unsubscribeResponse = responseStore.subscribe(responseState => {
    internalUpdate(state => ({
      ...state,
      responses: responseState.responses,
      allResponses: responseState.allResponses,
      categories: responseState.categories,
      selectedCategory: responseState.selectedCategory,
      totalCount: responseState.totalCount,
      deletingIds: responseState.deletingIds,
      _currentBatchId: responseState._currentBatchId,
      _isIndividualMode: responseState._isIndividualMode,
      loading: state.loading || responseState.loading,
      error: responseState.error || state.error
    }));
  });
  
  const unsubscribePagination = paginationStore.subscribe(paginationState => {
    internalUpdate(state => ({
      ...state,
      currentPage: paginationState.currentPage,
      itemsPerPage: paginationState.itemsPerPage
    }));
  });
  
  // Subscribe to retrying IDs store
  const unsubscribeRetryingIds = retryingIdsStore.subscribe(ids => {
    internalUpdate(state => ({
      ...state,
      retryingIds: ids
    }));
  });
  
  // Subscribe to batch retry store
  const unsubscribeBatchRetry = batchRetryStore.subscribe(state => {
    internalUpdate(s => ({
      ...s,
      batchRetryInProgress: state.inProgress,
      batchRetryCancelled: state.cancelled
    }));
  });
  
  // Update pagination store's external state when relevant state changes
  const unsubscribeForPagination = subscribe(state => {
    paginationStore.updateExternalState({
      totalCount: state.totalCount,
      selectedBatchId: state.selectedBatchId,
      isIndividualMode: state.isIndividualMode,
      selectedCategory: state.selectedCategory,
      responses: state.responses,
      allResponses: state.allResponses,
      setResponses: (responses: ResponseData[]) => {
        console.log('Setting responses in resultStore:', { length: responses.length });
        
        // Update both responses and allResponses to ensure consistency
        responseStore.update(s => ({ 
          ...s, 
          responses,
          // Only update allResponses if we're on the first page and showing all categories
          // Otherwise, keep the existing allResponses
          ...(s.selectedCategory === '전체' && get(paginationStore).currentPage === 1 
            ? { allResponses: responses } 
            : {})
        }));
        
        // Also update the resultStore directly to ensure reactivity
        internalUpdate(s => ({
          ...s,
          responses
        }));
      }
    });
  });
  
  return {
    subscribe,
    
    // Add set and update methods to satisfy the ResultStore interface
    set: (value: ResultStoreState) => {
      internalSet(value);
    },
    
    update: (updater: (state: ResultStoreState) => ResultStoreState) => {
      internalUpdate(updater);
    },
    
    // Derived values as getters
    get paginatedResponses() {
      const responses = get(paginatedResponsesStore);
      console.log('Getting paginatedResponses:', { length: responses.length });
      return responses;
    },
    
    get totalPages() {
      return get(totalPagesStore);
    },
    
    get pageNumbers() {
      return get(pageNumbersStore);
    },
    
    get visiblePageNumbers() {
      return get(visiblePageNumbersStore);
    },
    
    // Load all data
    async loadData() {
      internalUpdate(state => ({ ...state, loading: true, error: null }));
      
      try {
        // Load batch summaries
        await batchStore.loadBatchSummaries();
        
        // Get current state to check if a batch is selected
        const currentState = get({ subscribe });
        
        // If a batch is selected, load its responses
        if (currentState.selectedBatchId) {
          await this.selectBatch(currentState.selectedBatchId, false);
        } else {
          internalUpdate(state => ({ ...state, loading: false }));
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : '결과를 불러오는데 실패했습니다.';
        internalUpdate(state => ({ ...state, error: errorMessage, loading: false }));
      }
    },
    
    // Select a batch
    async selectBatch(batchId: string | null, shouldLoad = true) {
      if (shouldLoad) {
        internalUpdate(state => ({ ...state, loading: true }));
      }
      
      // Update batch store
      await batchStore.selectBatch(batchId, false);
      
      if (!batchId) {
        if (shouldLoad) {
          await this.loadData();
        }
        return;
      }
      
      try {
        const isIndividualMode = batchId === 'individual';
        
        // Load responses for the batch
        await responseStore.loadResponses(batchId, isIndividualMode);
        
        // Reset pagination
        paginationStore.update(state => ({ ...state, currentPage: 1 }));
        
        internalUpdate(state => ({ ...state, loading: false }));
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : '결과를 불러오는데 실패했습니다.';
        internalUpdate(state => ({ ...state, error: errorMessage, loading: false }));
      }
    },
    
    // Filter by category
    async filterByCategory(category: string) {
      // Set loading state first
      internalUpdate(state => ({ ...state, loading: true, error: null }));
      
      try {
        // Call responseStore's filterByCategory method
        await responseStore.filterByCategory(category);
        
        // Reset pagination
        paginationStore.update(state => ({ ...state, currentPage: 1 }));
        
        // Update our internal state to reflect the new category
        internalUpdate(state => ({ 
          ...state, 
          selectedCategory: category,
          loading: false 
        }));
      } catch (error) {
        console.error('Error in resultStore.filterByCategory:', error);
        internalUpdate(state => ({ 
          ...state, 
          error: error instanceof Error ? error.message : '카테고리 필터링 중 오류가 발생했습니다.',
          loading: false 
        }));
      }
    },
    
    // Change page
    async changePage(page: number) {
      await paginationStore.changePage(page);
    },
    
    // Delete a response
    async deleteResponse(id: number) {
      await responseStore.deleteResponse(id);
      
      // Check if we need to change page after deletion
      const state = get({ subscribe });
      if (state.responses.length === 0 && state.currentPage > 1) {
        await this.changePage(state.currentPage - 1);
      }
    },
    
    // Delete a batch
    async deleteBatch(batchId: string) {
      await batchStore.deleteBatch(batchId);
      
      // If the deleted batch was selected, go back to the batch list
      const state = get({ subscribe });
      if (state.selectedBatchId === batchId) {
        this.selectBatch(null);
      }
    },
    
    // Retry a response
    async retryResponse(response: ResponseData, batchId: string | null) {
      const success = await retryResponse(response, batchId, responseStore);
      
      if (success) {
        // Reload the current page
        const state = get({ subscribe });
        await this.changePage(state.currentPage);
      }
    },
    
    // Retry all responses in a category
    async retryBatchByCategory(category: string, concurrentLimit: number, progressCallback: (progress: number, total: number) => void) {
      // Get the current state
      const state = get({ subscribe });
      
      // Get the batch ID
      const batchId = state.selectedBatchId;
      if (!batchId) {
        throw new Error('배치 ID가 없습니다.');
      }
      
      await retryBatchByCategory(
        category, 
        concurrentLimit, 
        batchId, 
        state.isIndividualMode, 
        responseStore, 
        progressCallback
      );
      
      // Reload the current page
      await this.changePage(state.currentPage);
    },
    
    // Cancel batch retry
    cancelBatchRetry() {
      cancelBatchRetry();
    },
    
    // Check if a response is currently being retried
    isRetrying,
    
    // Utility functions
    isValidArray,
    formatDate,
    
    // Reset store
    reset() {
      internalSet(initialState);
      batchStore.set({
        batchSummaries: [],
        selectedBatchId: null,
        isIndividualMode: false,
        deletingBatchId: null,
        deletingBatchProgress: 0,
        loading: false,
        error: null
      });
      responseStore.set({
        responses: [],
        allResponses: [],
        categories: [],
        selectedCategory: '전체',
        totalCount: 0,
        deletingIds: new Set<number>(),
        _currentBatchId: null,
        _isIndividualMode: false,
        loading: false,
        error: null
      });
      paginationStore.set({
        currentPage: 1,
        itemsPerPage: 20
      });
    }
  };
}

// Create and export result store instance
export const resultStore = createResultStore(); 