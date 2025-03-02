// src/routes/api-test/queryQueueStore.ts
import { writable, get } from 'svelte/store';
import { saveResponse, saveErrorResponse } from './db';
import type { Metadata } from './types';

// Define the query item interface
export interface QueryItem {
  id: string;
  text: string;
  category: string;
  status: 'queued' | 'processing' | 'completed' | 'error';
  responseText: string;
  metadata: Metadata | null;
  loading: boolean;
  error: any;
  saveStatus: {
    saved: boolean;
    error: string | null;
  };
}

// Define the store state interface
interface QueryQueueState {
  queue: QueryItem[];
  activeQueries: string[];
  maxConcurrent: number;
  processing: boolean;
  batchId: string | null;
}

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

  return {
    subscribe,
    
    // Add queries to the queue
    addQueries: (queries: Array<{ text: string; category: string }>) => {
      // Generate a single batch ID for all queries in this batch
      const batchId = generateUUID();
      console.log(`Generated batch ID: ${batchId} for ${queries.length} queries`);
      
      update(state => {
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
        
        return {
          ...state,
          queue: [...state.queue, ...newQueries],
          batchId: batchId // Store the batch ID at the store level so all queries share it
        };
      });
      
      // Start processing if not already
      queryQueueStore.processQueue();
    },
    
    // Cancel batch processing
    cancelBatchProcess: () => {
      update(state => {
        // Mark all queued items as error with cancellation message
        const newQueue = state.queue.map(item => {
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
        
        // Return updated state with processing set to false if no active queries
        const hasActiveQueries = state.activeQueries.length > 0;
        const hasQueuedItems = newQueue.some(item => item.status === 'queued');
        
        return {
          ...state,
          queue: newQueue,
          processing: hasActiveQueries && hasQueuedItems // Only keep processing if there are active queries and queued items
        };
      });
      
      console.log('Batch processing cancelled by user');
    },
    
    // Remove a query from the queue
    removeQuery: (id: string) => {
      update(state => {
        // Check if it's an active query
        const isActive = state.activeQueries.includes(id);
        
        // Remove from active queries if needed
        const activeQueries = isActive 
          ? state.activeQueries.filter(qId => qId !== id)
          : state.activeQueries;
        
        // Remove from queue
        const queue = state.queue.filter(q => q.id !== id);
        
        return {
          ...state,
          queue,
          activeQueries
        };
      });
      
      // Process next items if needed
      queryQueueStore.processQueue();
    },
    
    // Process the next items in the queue
    processQueue: async () => {
      const state = get(queryQueueStore);
      
      // If already at max concurrent or no more items to process, return
      if (state.activeQueries.length >= state.maxConcurrent || !state.queue.some(q => q.status === 'queued')) {
        return;
      }
      
      update(state => ({ ...state, processing: true }));
      
      // Find queued items that can be processed
      const availableSlots = state.maxConcurrent - state.activeQueries.length;
      if (availableSlots <= 0) return;
      
      const queuedItems = state.queue
        .filter(q => q.status === 'queued')
        .slice(0, availableSlots);
      
      if (queuedItems.length === 0) {
        update(state => ({ ...state, processing: false }));
        return;
      }
      
      // Mark items as processing and add to active queries
      update(state => {
        const newQueue = [...state.queue];
        const newActiveQueries = [...state.activeQueries];
        
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
        
        return {
          ...state,
          queue: newQueue,
          activeQueries: newActiveQueries
        };
      });
      
      // Process each item
      for (const item of queuedItems) {
        queryQueueStore.processItem(item.id);
      }
    },
    
    // Process a single item
    processItem: async (id: string) => {
      const state = get(queryQueueStore);
      const item = state.queue.find(q => q.id === id);
      
      if (!item || item.status !== 'processing') return;
      
      try {
        // Create a local store for this query
        const localStore = {
          streamingText: '',
          metadata: null as Metadata | null,
          error: null,
          saveStatus: {
            saved: false,
            error: null as string | null
          }
        };
        
        // Prepare request data
        const formData = {
          query: item.text,
          group_id: id,
          persona: "선생님",
          user_type: ""
        };
        
        // Make the API request
        const response = await fetch('https://cne-dev-hcx.clabi.co.kr/api/v1/clario/main', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const reader = response.body?.getReader();
        if (!reader) throw new Error('Response body is not readable');
        
        const decoder = new TextDecoder();
        let buffer = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          
          const events = buffer.split('\n\n');
          buffer = events.pop() || '';
          
          for (const event of events) {
            if (!event.trim()) continue;
            
            const lines = event.split('\n');
            const eventData: { [key: string]: string } = {};
            
            for (const line of lines) {
              if (line.startsWith('event: ')) {
                eventData.event = line.slice(7);
              } else if (line.startsWith('data: ')) {
                eventData.data = line.slice(6);
              }
            }
            
            if (eventData.event === 'ClarioResponse') {
              try {
                const parsedData = JSON.parse(eventData.data);
                if (parsedData.type === 'response') {
                  localStore.streamingText += parsedData.text;
                  
                  // Update the queue item with the streaming text
                  update(state => {
                    const newQueue = [...state.queue];
                    const index = newQueue.findIndex(q => q.id === id);
                    if (index !== -1) {
                      newQueue[index] = {
                        ...newQueue[index],
                        responseText: localStore.streamingText
                      };
                    }
                    return { ...state, queue: newQueue };
                  });
                } else if (parsedData.type === 'all') {
                  // Create a properly typed metadata object
                  const metadataWithOrderId: Metadata = {
                    ...parsedData,
                    input_text: item.text,
                    query_category: item.category || '분류 없음',
                    order_id: id,
                    action: parsedData.action || '',
                    token_count: parsedData.token_count || 0,
                    response_id: parsedData.response_id || '',
                    latency: parsedData.latency || 0
                  };
                  
                  localStore.metadata = metadataWithOrderId;
                  
                  // Get the current state to access the batchId
                  const currentState = get(queryQueueStore);
                  
                  // Save response to database with the batch ID
                  try {
                    // Use the store's batchId for all queries in this batch
                    await saveResponse(localStore.streamingText, metadataWithOrderId, currentState.batchId || undefined);
                    localStore.saveStatus.saved = true;
                    localStore.saveStatus.error = null;
                    
                    console.log(`Response saved with batch ID: ${currentState.batchId}`);
                  } catch (error) {
                    localStore.saveStatus.error = error instanceof Error ? error.message : 'Failed to save response';
                    localStore.saveStatus.saved = false;
                    console.error(`Failed to save response with batch ID: ${currentState.batchId}`, error);
                    
                    // 에러가 발생한 경우에도 쿼리와 카테고리 정보를 저장
                    try {
                      await saveErrorResponse(
                        item.text,
                        error instanceof Error ? error.message : 'Failed to save response',
                        metadataWithOrderId,
                        currentState.batchId || undefined
                      );
                      console.log('Error response saved successfully');
                    } catch (saveError) {
                      console.error('Failed to save error response:', saveError);
                    }
                  }
                  
                  // Update the queue item with metadata and save status
                  update(state => {
                    const newQueue = [...state.queue];
                    const index = newQueue.findIndex(q => q.id === id);
                    if (index !== -1) {
                      newQueue[index] = {
                        ...newQueue[index],
                        metadata: localStore.metadata,
                        saveStatus: localStore.saveStatus,
                        status: 'completed',
                        loading: false
                      };
                    }
                    return { ...state, queue: newQueue };
                  });
                }
              } catch (e) {
                console.error('Failed to parse response data:', e);
              }
            }
          }
        }
        
        // Mark as completed if not already
        update(state => {
          const newQueue = [...state.queue];
          const index = newQueue.findIndex(q => q.id === id);
          if (index !== -1 && newQueue[index].status !== 'completed') {
            newQueue[index] = {
              ...newQueue[index],
              status: 'completed',
              loading: false
            };
          }
          return { ...state, queue: newQueue };
        });
      } catch (error) {
        // Handle error
        update(state => {
          const newQueue = [...state.queue];
          const index = newQueue.findIndex(q => q.id === id);
          if (index !== -1) {
            newQueue[index] = {
              ...newQueue[index],
              status: 'error',
              loading: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
            
            // 에러가 발생한 경우에도 쿼리와 카테고리 정보를 저장
            const errorItem = newQueue[index];
            try {
              saveErrorResponse(
                errorItem.text,
                error instanceof Error ? error.message : 'Unknown error',
                {
                  input_text: errorItem.text,
                  query_category: errorItem.category || '분류 없음',
                  action: 'error',
                  token_count: 0,
                  response_id: `error-${errorItem.id}`,
                  latency: 0,
                  order_id: get(queryQueueStore).batchId || undefined
                },
                get(queryQueueStore).batchId || undefined
              ).catch(saveError => {
                console.error('Failed to save error response:', saveError);
              });
            } catch (saveError) {
              console.error('Failed to save error response:', saveError);
            }
          }
          return { ...state, queue: newQueue };
        });
      } finally {
        // Remove from active queries
        update(state => {
          const activeQueries = state.activeQueries.filter(qId => qId !== id);
          const processing = activeQueries.length > 0 || state.queue.some(q => q.status === 'queued');
          
          return {
            ...state,
            activeQueries,
            processing
          };
        });
        
        // Process next items if any
        queryQueueStore.processQueue();
      }
    },
    
    // Mark a query as completed
    markCompleted: (id: string, success: boolean = true) => {
      update(state => {
        const newQueue = [...state.queue];
        const index = newQueue.findIndex(q => q.id === id);
        
        if (index !== -1) {
          newQueue[index] = {
            ...newQueue[index],
            status: success ? 'completed' : 'error',
            loading: false
          };
        }
        
        return { ...state, queue: newQueue };
      });
    },
    
    // Clear all completed and error items
    clearCompleted: () => {
      update(state => {
        const newQueue = state.queue.filter(q => 
          q.status !== 'completed' && q.status !== 'error'
        );
        
        return { ...state, queue: newQueue };
      });
    },
    
    // Clear all items
    clearAll: () => {
      set(initialState);
    },
    
    // Set max concurrent
    setMaxConcurrent: (max: number) => {
      update(state => ({ ...state, maxConcurrent: max }));
      queryQueueStore.processQueue();
    }
  };
}

// Helper function to generate UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export const queryQueueStore = createQueryQueueStore(); 