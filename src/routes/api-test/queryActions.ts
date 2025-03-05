// src/routes/api-test/queryActions.ts
import type { QueryItem, QueryQueueState } from './queryTypes';
import { generateUUID } from './queryTypes';
import { processQueryItem } from './queryProcessor';
import { saveErrorResponse } from './db';

/**
 * Add queries to the queue
 */
export function addQueries(
  queries: Array<{ text: string; category: string }>,
  state: QueryQueueState,
  updateState: (newState: Partial<QueryQueueState>) => void,
  updateQueue: (callback: (queue: QueryItem[]) => QueryItem[]) => void
) {
  // Generate a single batch ID for all queries in this batch
  const batchId = generateUUID();
  console.log(`Generated batch ID: ${batchId} for ${queries.length} queries`);
  
  const newQueries = queries.map((query, index) => ({
    id: `query_${Date.now()}_${index}`,
    text: query.text,
    category: query.category,
    status: 'queued' as const,
    responseText: '',
    metadata: null,
    loading: false,
    error: null,
    saveStatus: {
      saved: false,
      error: null
    }
  }));
  
  updateQueue(queue => [...queue, ...newQueries]);
  updateState({ batchId });
}

/**
 * Cancel batch processing
 */
export function cancelBatchProcess(
  state: QueryQueueState,
  updateState: (newState: Partial<QueryQueueState>) => void,
  updateQueue: (callback: (queue: QueryItem[]) => QueryItem[]) => void
) {
  // Mark all queued items as error with cancellation message
  updateQueue(queue => {
    return queue.map(item => {
      if (item.status === 'queued') {
        return {
          ...item,
          status: 'error' as const,
          error: '사용자에 의해 취소됨',
          loading: false
        };
      }
      return item;
    });
  });
  
  // Return updated state with processing set to false if no active queries
  const hasActiveQueries = state.activeQueries.length > 0;
  const hasQueuedItems = state.queue.some(item => item.status === 'queued');
  
  updateState({
    processing: hasActiveQueries && hasQueuedItems // Only keep processing if there are active queries and queued items
  });
  
  console.log('Batch processing cancelled by user');
}

/**
 * Remove a query from the queue
 */
export function removeQuery(
  id: string,
  state: QueryQueueState,
  updateState: (newState: Partial<QueryQueueState>) => void,
  updateQueue: (callback: (queue: QueryItem[]) => QueryItem[]) => void
) {
  // Check if it's an active query
  const isActive = state.activeQueries.includes(id);
  
  // Remove from active queries if needed
  const activeQueries = isActive 
    ? state.activeQueries.filter(qId => qId !== id)
    : state.activeQueries;
  
  // Remove from queue
  updateQueue(queue => queue.filter(q => q.id !== id));
  updateState({ activeQueries });
}

/**
 * Process the next items in the queue
 */
export async function processQueue(
  state: QueryQueueState,
  updateState: (newState: Partial<QueryQueueState>) => void,
  updateQueue: (callback: (queue: QueryItem[]) => QueryItem[]) => void,
  processItem: (id: string) => void
) {
  // If already at max concurrent or no more items to process, return
  if (state.activeQueries.length >= state.maxConcurrent || !state.queue.some(q => q.status === 'queued')) {
    return;
  }
  
  updateState({ processing: true });
  
  // Find queued items that can be processed
  const availableSlots = state.maxConcurrent - state.activeQueries.length;
  if (availableSlots <= 0) return;
  
  const queuedItems = state.queue
    .filter(q => q.status === 'queued')
    .slice(0, availableSlots);
  
  if (queuedItems.length === 0) {
    updateState({ processing: false });
    return;
  }
  
  // Mark items as processing and add to active queries
  const newActiveQueries = [...state.activeQueries];
  
  updateQueue(queue => {
    const newQueue = [...queue];
    
    queuedItems.forEach(item => {
      const index = newQueue.findIndex(q => q.id === item.id);
      if (index !== -1) {
        newQueue[index] = {
          ...newQueue[index],
          status: 'processing',
          loading: true
        };
        newActiveQueries.push(item.id);
      }
    });
    
    return newQueue;
  });
  
  updateState({ activeQueries: newActiveQueries });
  
  // Process each item
  for (const item of queuedItems) {
    processItem(item.id);
  }
}

/**
 * Mark a query as completed
 */
export function markCompleted(
  id: string,
  success: boolean = true,
  updateQueue: (callback: (queue: QueryItem[]) => QueryItem[]) => void
) {
  updateQueue(queue => {
    const newQueue = [...queue];
    const index = newQueue.findIndex(q => q.id === id);
    
    if (index !== -1) {
      newQueue[index] = {
        ...newQueue[index],
        status: success ? 'completed' : 'error',
        loading: false
      };
    }
    
    return newQueue;
  });
}

/**
 * Clear all completed and error items
 */
export function clearCompleted(
  updateQueue: (callback: (queue: QueryItem[]) => QueryItem[]) => void
) {
  updateQueue(queue => {
    return queue.filter(q => 
      q.status !== 'completed' && q.status !== 'error'
    );
  });
}

/**
 * Handle completion of a query item
 */
export function handleQueryCompletion(
  id: string,
  state: QueryQueueState,
  updateState: (newState: Partial<QueryQueueState>) => void
) {
  // Remove from active queries
  const activeQueries = state.activeQueries.filter(qId => qId !== id);
  const processing = activeQueries.length > 0 || state.queue.some(q => q.status === 'queued');
  
  updateState({
    activeQueries,
    processing
  });
} 