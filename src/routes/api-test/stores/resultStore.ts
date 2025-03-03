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
  batchRetryCancelled: false,
  
  // Search state
  searchQuery: '',
  searchResults: [],
  isSearching: false
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
  
  // Helper function to filter responses by search query
  function filterResponsesBySearch(responses: ResponseData[], query: string): ResponseData[] {
    if (!query) return responses;
    
    const lowerQuery = query.toLowerCase();
    return responses.filter(response => 
      response.input_text.toLowerCase().includes(lowerQuery) || 
      response.response_text.toLowerCase().includes(lowerQuery)
    );
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
        const isIndividualMode = batchId === 'individual';
        
        // Load responses for the batch
        await responseStore.loadResponses(batchId, isIndividualMode);
        
        // Reset pagination
        paginationStore.update(state => ({ ...state, currentPage: 1 }));
        
        // Clear search when selecting a new batch
        internalUpdate(state => ({ 
          ...state, 
          loading: false,
          searchQuery: '',
          searchResults: []
        }));
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : '결과를 불러오는데 실패했습니다.';
        internalUpdate(state => ({ ...state, error: errorMessage, loading: false }));
      }
    },
    
    // Filter by category
    async filterByCategory(category: string) {
      internalUpdate(state => ({ ...state, loading: true }));
      
      try {
        // Update response store
        await responseStore.filterByCategory(category);
        
        // Reset pagination
        paginationStore.update(state => ({ ...state, currentPage: 1 }));
        
        // Clear search when changing category
        internalUpdate(state => ({ 
          ...state, 
          loading: false,
          searchQuery: '',
          searchResults: [],
          isSearching: false // Reset isSearching flag
        }));
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : '카테고리 필터링에 실패했습니다.';
        internalUpdate(state => ({ ...state, error: errorMessage, loading: false }));
      }
    },
    
    // Change page
    async changePage(page: number) {
      // Get current state
      const state = get({ subscribe });
      
      // If we have search results, we need to update the responses
      if (state.searchQuery && state.searchResults.length > 0) {
        // Calculate the start and end indices for the current page
        const startIndex = (page - 1) * state.itemsPerPage;
        const endIndex = Math.min(startIndex + state.itemsPerPage, state.searchResults.length);
        
        // Get the responses for the current page
        const pagedResponses = state.searchResults.slice(startIndex, endIndex);
        
        // Update the responses
        responseStore.update(s => ({
          ...s,
          responses: pagedResponses,
          totalCount: state.searchResults.length // Ensure totalCount is updated with search results length
        }));
        
        // Update pagination store
        paginationStore.update(s => ({
          ...s,
          currentPage: page
        }));
        
        // Also update pagination's external state
        paginationStore.updateExternalState({
          totalCount: state.searchResults.length,
          responses: pagedResponses
        });
        
        // Update our internal state to reflect the new page
        internalUpdate(s => ({
          ...s,
          currentPage: page
        }));
        
        // Force a re-render by updating the store again
        // This ensures that derived stores like totalPages are recalculated
        internalUpdate(state => ({ ...state }));
        
        return;
      }
      
      // For non-search pagination, use the pagination store
      await paginationStore.changePage(page);
    },
    
    // Delete response
    async deleteResponse(id: number) {
      await responseStore.deleteResponse(id);
    },
    
    // Delete batch
    async deleteBatch(batchId: string) {
      await batchStore.deleteBatch(batchId);
    },
    
    // Retry response
    async retryResponse(response: ResponseData, batchId: string | null) {
      await retryResponse(response, batchId);
    },
    
    // Search responses
    async searchResponses(query: string) {
      internalUpdate(state => ({ 
        ...state, 
        isSearching: true,
        searchQuery: query
      }));
      
      try {
        // If search query is empty, clear search results
        if (!query.trim()) {
          internalUpdate(state => ({ 
            ...state, 
            isSearching: false,
            searchResults: [],
            searchQuery: ''
          }));
          
          // Reset to original responses based on category
          await this.filterByCategory(get({ subscribe }).selectedCategory);
          return;
        }
        
        // Get current state
        const currentState = get({ subscribe });
        
        // Filter responses by search query
        const filteredResponses = filterResponsesBySearch(currentState.allResponses, query);
        
        // Calculate the total count of search results
        const searchResultsCount = filteredResponses.length;
        
        // Update state with search results
        internalUpdate(state => ({ 
          ...state, 
          isSearching: false,
          searchResults: filteredResponses,
          totalCount: searchResultsCount // Ensure totalCount is updated here
        }));
        
        // Update response store with filtered responses
        responseStore.update(state => ({ 
          ...state, 
          responses: filteredResponses.slice(0, currentState.itemsPerPage), // Only show first page
          totalCount: searchResultsCount
        }));
        
        // Reset pagination to first page and update external state with new total count
        paginationStore.update(state => ({ 
          ...state, 
          currentPage: 1 
        }));
        
        // Update pagination store's external state with the new search results count
        paginationStore.updateExternalState({
          totalCount: searchResultsCount,
          responses: filteredResponses.slice(0, currentState.itemsPerPage),
          allResponses: filteredResponses
        });
        
        // Force a re-render by updating the store again
        // This ensures that derived stores like totalPages are recalculated
        internalUpdate(state => ({ ...state }));
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : '검색에 실패했습니다.';
        internalUpdate(state => ({ 
          ...state, 
          error: errorMessage, 
          isSearching: false
        }));
      }
    },
    
    // Clear search
    clearSearch() {
      const currentCategory = get({ subscribe }).selectedCategory;
      
      internalUpdate(state => ({ 
        ...state, 
        searchQuery: '',
        searchResults: [],
        isSearching: false
      }));
      
      // Reset to original responses based on category
      this.filterByCategory(currentCategory);
      
      // Force a re-render by updating the store again
      // This ensures that derived stores like totalPages are recalculated
      setTimeout(() => {
        internalUpdate(state => ({ ...state }));
      }, 0);
    },
    
    // Retry batch by category
    async retryBatchByCategory(category: string, concurrentLimit: number, progressCallback: (progress: number, total: number) => void) {
      // Get the current state
      const state = get({ subscribe });
      
      // Get the batch ID
      const batchId = state.selectedBatchId;
      
      return retryBatchByCategory(
        category, 
        concurrentLimit, 
        batchId, 
        state.isIndividualMode, 
        responseStore, 
        progressCallback
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
    
    // Utility functions
    isValidArray,
    formatDate,
    
    // Reset store
    reset() {
      internalSet(initialState);
    }
  };
}

// Create and export the store
export const resultStore = createResultStore(); 