// src/routes/api-test/stores/types.ts
import type { Writable } from 'svelte/store';

export interface ResponseData {
  id: number;
  response_text: string;
  input_text: string;
  reference: string[] | null;
  recommended_questions: string[] | null;
  images: string[] | null;
  action: string;
  sub_action: string | null;
  token_count: number;
  response_id: string;
  latency: number;
  batch_id: string | null;
  is_batch: boolean;
  created_at: string;
  query_category: string | null;
  error_message?: string | null;
}

export interface BatchSummary {
  batch_id: string;
  created_at: string;
  count: number;
  is_individual?: boolean;
}

// Base store state interface
export interface BaseStoreState {
  loading: boolean;
  error: string | null;
}

// Batch store state
export interface BatchStoreState extends BaseStoreState {
  batchSummaries: BatchSummary[];
  selectedBatchId: string | null;
  isIndividualMode: boolean;
  deletingBatchId: string | null;
  deletingBatchProgress: number;
}

// Response store state
export interface ResponseStoreState extends BaseStoreState {
  responses: ResponseData[];
  allResponses: ResponseData[];
  categories: string[];
  selectedCategory: string;
  totalCount: number;
  deletingIds: Set<number>;
  // Internal properties to track the current batch
  _currentBatchId: string | null;
  _isIndividualMode: boolean;
}

// Pagination store state
export interface PaginationStoreState {
  currentPage: number;
  itemsPerPage: number;
}

// External state for pagination
export interface PaginationExternalState {
  totalCount: number;
  selectedBatchId: string | null;
  isIndividualMode: boolean;
  selectedCategory: string;
  responses: ResponseData[];
  allResponses: ResponseData[];
  setResponses: (responses: ResponseData[]) => void;
}

// Combined result store state
export interface ResultStoreState extends 
  BatchStoreState, 
  ResponseStoreState, 
  PaginationStoreState {
  // Additional properties for result store
  retryingIds: Set<number>;
  // Batch retry properties
  batchRetryInProgress: boolean;
  batchRetryCancelled: boolean;
  // Search properties
  searchQuery: string;
  searchResults: ResponseData[];
  isSearching: boolean;
}

// Store interfaces
export interface BatchStore extends Writable<BatchStoreState> {
  loadBatchSummaries(): Promise<void>;
  selectBatch(batchId: string | null, shouldLoad?: boolean): Promise<void>;
  deleteBatch(batchId: string): Promise<void>;
}

export interface ResponseStore extends Writable<ResponseStoreState> {
  loadResponses(batchId: string | null, isIndividualMode: boolean): Promise<void>;
  filterByCategory(category: string): Promise<void>;
  deleteResponse(id: number, showConfirm?: boolean): Promise<void>;
  saveResponse(responseText: string, metadata: any, batchId?: string): Promise<any>;
  isValidArray<T>(arr: T[] | null | undefined): arr is T[];
  formatDate(dateString: string): string;
}

export interface PaginationStore extends Writable<PaginationStoreState> {
  changePage(page: number): Promise<void>;
  updateExternalState(newState: Partial<PaginationExternalState>): void;
  get totalPages(): number;
  get pageNumbers(): number[];
  get visiblePageNumbers(): number[];
}

export interface ResultStore extends Writable<ResultStoreState> {
  loadData(): Promise<void>;
  selectBatch(batchId: string | null, shouldLoad?: boolean): Promise<void>;
  filterByCategory(category: string): Promise<void>;
  changePage(page: number): Promise<void>;
  deleteResponse(id: number): Promise<void>;
  deleteBatch(batchId: string): Promise<void>;
  retryResponse(response: ResponseData, batchId: string | null): Promise<void>;
  retryBatchByCategory(category: string, concurrentLimit: number, progressCallback: (progress: number, total: number) => void): Promise<void>;
  cancelBatchRetry(): void;
  isRetrying(id: number): boolean;
  isValidArray<T>(arr: T[] | null | undefined): arr is T[];
  formatDate(dateString: string): string;
  get paginatedResponses(): ResponseData[];
  get totalPages(): number;
  get pageNumbers(): number[];
  get visiblePageNumbers(): number[];
  reset(): void;
  // Search methods
  searchResponses(query: string): Promise<void>;
  clearSearch(): void;
} 