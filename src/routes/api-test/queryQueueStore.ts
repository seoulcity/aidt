// src/routes/api-test/queryQueueStore.ts
import { writable, get } from 'svelte/store';
import type { QueryItem, QueryQueueState } from './queryTypes';
import { processQueryItem } from './queryProcessor';
import * as actions from './queryActions';

// Create the store
function createQueryQueueStore() {
  const initialState: QueryQueueState = {
    queue: [],
    activeQueries: [],
    maxConcurrent: 3,
    processing: false,
    batchId: null
  };

  const { subscribe, update, set } = writable<QueryQueueState>(initialState);

  // Helper function to update queue
  const updateQueue = (callback: (queue: QueryItem[]) => QueryItem[]) => {
    update(state => ({
      ...state,
      queue: callback(state.queue)
    }));
  };

  // Helper function to update state
  const updateState = (newState: Partial<QueryQueueState>) => {
    update(state => ({
      ...state,
      ...newState
    }));
  };

  // Process a single item
  const processItem = async (id: string) => {
    const state = get(store);
    const item = state.queue.find(q => q.id === id);
    
    if (!item) return;
    
    try {
      await processQueryItem(id, item, state.batchId, updateQueue);
    } catch (error) {
      console.error(`Error in processItem for ${id}:`, error);
    } finally {
      actions.handleQueryCompletion(id, get(store), updateState);
      store.processQueue(); // Process next items if any
    }
  };

  const store = {
    subscribe,
    
    // Add queries to the queue
    addQueries: (queries: Array<{ text: string; category: string }>) => {
      actions.addQueries(queries, get(store), updateState, updateQueue);
      store.processQueue();
    },
    
    // Cancel batch processing
    cancelBatchProcess: () => {
      actions.cancelBatchProcess(get(store), updateState, updateQueue);
    },
    
    // Remove a query from the queue
    removeQuery: (id: string) => {
      actions.removeQuery(id, get(store), updateState, updateQueue);
      store.processQueue();
    },
    
    // Process the next items in the queue
    processQueue: () => {
      actions.processQueue(get(store), updateState, updateQueue, processItem);
    },
    
    // Mark a query as completed
    markCompleted: (id: string, success: boolean = true) => {
      actions.markCompleted(id, success, updateQueue);
    },
    
    // Clear all completed and error items
    clearCompleted: () => {
      actions.clearCompleted(updateQueue);
    },
    
    // Clear all items
    clearAll: () => {
      set(initialState);
    },
    
    // Set max concurrent
    setMaxConcurrent: (max: number) => {
      update(state => ({ ...state, maxConcurrent: max }));
      store.processQueue();
    }
  };

  return store;
}

export const queryQueueStore = createQueryQueueStore();
export type { QueryItem } from './queryTypes'; 