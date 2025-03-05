// src/routes/api-test/stores/resultStoreCore.ts
import { writable, derived, get } from 'svelte/store';
import type { ResultStore, ResultStoreState, ResponseData } from './types';
import { batchStore } from './batchStore';
import { responseStore } from './responseStore';
import { paginationStore } from './paginationStore';
import { retryingIdsStore, isRetrying } from './retryStoreUtils';
import { retryResponse } from './singleRetryService';
import { retryBatchByCategory, batchRetryStore, cancelBatchRetry } from './batchRetryService';
import { isValidArray, formatDate } from './resultStoreUtils';
import { searchStore } from './searchService';

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
  batchRetryCancelled: false,
  
  // Search state
  searchQuery: '',
  searchResults: [],
  isSearching: false
};

// Create result store
export function createResultStore(): ResultStore {
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
  
  // Subscribe to search store
  const unsubscribeSearch = searchStore.subscribe(searchState => {
    internalUpdate(state => ({
      ...state,
      searchQuery: searchState.query,
      searchResults: searchState.results,
      isSearching: searchState.isSearching
    }));
  });
  
  // Cleanup function to unsubscribe from all stores
  function cleanup() {
    unsubscribeBatch();
    unsubscribeResponse();
    unsubscribePagination();
    unsubscribeRetryingIds();
    unsubscribeBatchRetry();
    unsubscribeForPagination();
    unsubscribeSearch();
  }
  
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
        // Get batch state to check if it's individual mode
        const batchState = get(batchStore);
        
        // Load responses for the selected batch
        await responseStore.loadResponses(batchId, batchState.isIndividualMode);
        
        // Reset pagination to first page
        await paginationStore.changePage(1);
        
        if (shouldLoad) {
          internalUpdate(state => ({ ...state, loading: false }));
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : '응답을 불러오는데 실패했습니다.';
        internalUpdate(state => ({ ...state, error: errorMessage, loading: false }));
      }
    },
    
    // Filter by category
    async filterByCategory(category: string) {
      internalUpdate(state => ({ ...state, loading: true }));
      
      try {
        // Clear search when changing category
        searchStore.clear();
        
        // Update response store with the new category
        await responseStore.filterByCategory(category);
        
        // Reset pagination to first page
        await paginationStore.changePage(1);
        
        internalUpdate(state => ({ ...state, loading: false }));
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : '카테고리 필터링에 실패했습니다.';
        internalUpdate(state => ({ ...state, error: errorMessage, loading: false }));
      }
    },
    
    // Change page
    async changePage(page: number) {
      try {
        await paginationStore.changePage(page);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : '페이지 변경에 실패했습니다.';
        internalUpdate(state => ({ ...state, error: errorMessage }));
      }
    },
    
    // Delete response
    async deleteResponse(id: number) {
      try {
        await responseStore.deleteResponse(id);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : '응답 삭제에 실패했습니다.';
        internalUpdate(state => ({ ...state, error: errorMessage }));
      }
    },
    
    // Delete batch
    async deleteBatch(batchId: string) {
      try {
        await batchStore.deleteBatch(batchId);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : '배치 삭제에 실패했습니다.';
        internalUpdate(state => ({ ...state, error: errorMessage }));
      }
    },
    
    // Retry response
    async retryResponse(response: ResponseData, batchId: string | null) {
      try {
        await retryResponse(response, batchId);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : '응답 재시도에 실패했습니다.';
        internalUpdate(state => ({ ...state, error: errorMessage }));
      }
    },
    
    // Search responses
    async searchResponses(query: string) {
      internalUpdate(state => ({ ...state, loading: true }));
      
      try {
        const currentState = get({ subscribe });
        const results = await searchStore.search(query, currentState.allResponses);
        
        // Update response store with search results
        responseStore.update(state => ({
          ...state,
          responses: results,
          totalCount: results.length
        }));
        
        // Reset pagination to first page
        await paginationStore.changePage(1);
        
        internalUpdate(state => ({ 
          ...state, 
          loading: false,
          searchQuery: query
        }));
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : '검색에 실패했습니다.';
        internalUpdate(state => ({ ...state, error: errorMessage, loading: false }));
      }
    },
    
    // Clear search
    clearSearch() {
      searchStore.clear();
      
      // Reset to the current category filter
      const currentState = get({ subscribe });
      this.filterByCategory(currentState.selectedCategory);
    },
    
    // Retry batch by category
    async retryBatchByCategory(category: string, concurrentLimit: number, progressCallback: (progress: number, total: number) => void) {
      const currentState = get({ subscribe });
      
      // Get all responses for the category
      let responsesToRetry: ResponseData[] = [];
      
      if (category === '전체') {
        responsesToRetry = [...currentState.allResponses];
      } else if (category === '에러') {
        responsesToRetry = currentState.allResponses.filter(r => !!r.error_message);
      } else {
        responsesToRetry = currentState.allResponses.filter(r => r.query_category === category);
      }
      
      await retryBatchByCategory(
        responsesToRetry, 
        currentState.selectedBatchId, 
        concurrentLimit, 
        progressCallback,
        currentState.isIndividualMode,
        responseStore
      );
    },
    
    // Cancel batch retry
    cancelBatchRetry() {
      cancelBatchRetry();
    },
    
    // Check if a response is being retried
    isRetrying(id: number) {
      return isRetrying(id);
    },
    
    // Reset the store
    reset() {
      internalSet(initialState);
      cleanup();
    },
    
    // Utility functions
    isValidArray,
    formatDate,
    
    // Load all responses for a specific batch
    async loadAllResponsesForBatch(batchId: string): Promise<void> {
      if (!batchId) {
        console.error('No batch ID provided for loading all responses');
        return Promise.reject(new Error('No batch ID provided'));
      }
      
      internalUpdate(state => ({ 
        ...state, 
        loading: true,
        error: null
      }));
      
      try {
        // Use responseStore to load all responses for this batch
        await responseStore.loadAllResponsesForBatch(batchId);
        
        // Get the responses from responseStore
        const responses = get(responseStore).allResponses;
        
        // Update our state with these responses
        internalUpdate(state => ({
          ...state,
          allResponses: responses,
          loading: false
        }));
        
        return Promise.resolve();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '모든 응답을 불러오는데 실패했습니다.';
        console.error('Error loading all responses:', errorMessage);
        
        internalUpdate(state => ({ 
          ...state, 
          error: errorMessage, 
          loading: false 
        }));
        
        return Promise.reject(error);
      }
    }
  };
} 