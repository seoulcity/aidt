// src/routes/api-test/evaluation/evaluationStore.ts
import { writable, derived } from 'svelte/store';
import type { BatchSummary, ResponseData, BatchStatistics } from './types';

// Create stores for the evaluation state
export const batchSummaries = writable<BatchSummary[]>([]);
export const selectedBatchId = writable<string | null>(null);
export const responses = writable<ResponseData[]>([]);
export const loading = writable<boolean>(true);
export const responsesLoading = writable<boolean>(false);
export const error = writable<string | null>(null);
export const expandedResponseId = writable<number | null>(null);
export const batchStats = writable<BatchStatistics | null>(null);

// Category update related state
export const isUpdatingCategory = writable<boolean>(false);
export const updateProgress = writable<number>(0);
export const updateMessage = writable<string>('');
export const isCancelRequested = writable<boolean>(false);
export const isUpdateComplete = writable<boolean>(false);
export const updateCompleteMessage = writable<string>('');

// Batch AI test related state
export const isRunningBatchAiTest = writable<boolean>(false);
export const aiTestProgress = writable<number>(0);
export const aiTestMessage = writable<string>('');
export const aiTestCancelRequested = writable<boolean>(false);
export const isAiTestComplete = writable<boolean>(false);
export const aiTestCompleteMessage = writable<string>('');
export const aiTestMode = writable<'all' | 'pending'>('pending');

// Pagination related state
export const currentPage = writable<number>(1);
export const totalItems = writable<number>(0);
export const pageSize = writable<number>(20);

// Derived store for total pages
export const totalPages = derived(
  [totalItems, pageSize],
  ([$totalItems, $pageSize]) => Math.ceil($totalItems / $pageSize)
);

// Reset state when navigating away from batch details
export function resetBatchSelection() {
  selectedBatchId.set(null);
  responses.set([]);
  batchStats.set(null);
}

// Reset category update state
export function resetCategoryUpdateState() {
  isUpdatingCategory.set(false);
  updateProgress.set(0);
  isUpdateComplete.set(false);
}

// Request cancellation of category update
export function requestCancelCategoryUpdate() {
  isCancelRequested.set(true);
}

// Reset batch AI test state
export function resetBatchAiTestState() {
  isRunningBatchAiTest.set(false);
  aiTestProgress.set(0);
  isAiTestComplete.set(false);
}

// Request cancellation of batch AI test
export function requestCancelBatchAiTest() {
  aiTestCancelRequested.set(true);
}

// Toggle response expansion
export function toggleResponseExpand(id: number) {
  expandedResponseId.update(currentId => currentId === id ? null : id);
} 