// src/routes/api-test/queryProcessor.ts
import { get } from 'svelte/store';
import { saveResponse, saveErrorResponse } from './db';
import type { Metadata } from './types';
import type { QueryItem } from './queryTypes';

/**
 * Process a single query item by making an API request and handling the response
 */
export async function processQueryItem(
  id: string, 
  item: QueryItem, 
  batchId: string | null,
  updateQueue: (callback: (queue: QueryItem[]) => QueryItem[]) => void
) {
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
    
    console.log(`Starting API request for query ID: ${id}`, formData);
    
    // Make the API request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    let response;
    try {
      response = await fetch('https://cne-dev-hcx.clabi.co.kr/api/v1/clario/main', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId); // Clear the timeout if the request completes
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error(`Fetch error for query ID: ${id}:`, fetchError);
      
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown fetch error';
      const isAborted = errorMessage.includes('abort') || errorMessage.includes('timeout');
      
      throw new Error(isAborted ? `Request timeout after 60 seconds: ${errorMessage}` : errorMessage);
    }
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Failed to get error text');
      console.error(`HTTP error for query ${id}! Status: ${response.status}, Response: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}, Response: ${errorText}`);
    }
    
    console.log(`API response received for query ID: ${id}, Status: ${response.status}`);
    
    const reader = response.body?.getReader();
    if (!reader) {
      console.error(`Response body is not readable for query ID: ${id}`);
      throw new Error('Response body is not readable');
    }
    
    const decoder = new TextDecoder();
    let buffer = '';
    let chunkCount = 0;
    
    while (true) {
      try {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log(`Stream completed for query ID: ${id} after ${chunkCount} chunks`);
          break;
        }
        
        chunkCount++;
        
        if (!value || value.length === 0) {
          console.warn(`Empty chunk received for query ID: ${id}, chunk #${chunkCount}`);
          continue;
        }
        
        buffer += decoder.decode(value, { stream: true });
        
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';
        
        console.log(`Processing ${events.length} events from chunk #${chunkCount} for query ID: ${id}`);
        
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
                updateQueue(queue => {
                  const newQueue = [...queue];
                  const index = newQueue.findIndex(q => q.id === id);
                  if (index !== -1) {
                    newQueue[index] = {
                      ...newQueue[index],
                      responseText: localStore.streamingText
                    };
                  }
                  return newQueue;
                });
              } else if (parsedData.type === 'all') {
                console.log(`Received final metadata for query ID: ${id}`);
                
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
                
                // Save response to database with the batch ID
                try {
                  // Use the store's batchId for all queries in this batch
                  await saveResponse(localStore.streamingText, metadataWithOrderId, batchId || undefined);
                  localStore.saveStatus.saved = true;
                  localStore.saveStatus.error = null;
                  
                  console.log(`Response saved with batch ID: ${batchId} for query ID: ${id}`);
                } catch (error) {
                  localStore.saveStatus.error = error instanceof Error ? error.message : 'Failed to save response';
                  localStore.saveStatus.saved = false;
                  console.error(`Failed to save response with batch ID: ${batchId} for query ID: ${id}`, error);
                  
                  // 에러가 발생한 경우에도 쿼리와 카테고리 정보를 저장
                  try {
                    await saveErrorResponse(
                      item.text,
                      error instanceof Error ? error.message : 'Failed to save response',
                      metadataWithOrderId,
                      batchId || undefined
                    );
                    console.log(`Error response saved successfully for query ID: ${id}`);
                  } catch (saveError) {
                    console.error(`Failed to save error response for query ID: ${id}:`, saveError);
                  }
                }
                
                // Update the queue item with metadata and save status
                updateQueue(queue => {
                  const newQueue = [...queue];
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
                  return newQueue;
                });
              }
            } catch (e) {
              console.error(`Failed to parse response data for query ID: ${id}:`, e, 'Raw data:', eventData.data);
            }
          }
        }
      } catch (streamError) {
        console.error(`Error reading stream for query ID: ${id}, chunk #${chunkCount}:`, streamError);
        
        // If we have some response text already, we can try to save what we have
        if (localStore.streamingText) {
          console.log(`Stream error occurred but we have partial response for query ID: ${id}, length: ${localStore.streamingText.length} chars`);
        }
        
        // Rethrow to be caught by the outer try/catch
        throw streamError;
      }
    }
    
    // Mark as completed if not already
    updateQueue(queue => {
      const newQueue = [...queue];
      const index = newQueue.findIndex(q => q.id === id);
      if (index !== -1 && newQueue[index].status !== 'completed') {
        newQueue[index] = {
          ...newQueue[index],
          status: 'completed',
          loading: false
        };
      }
      return newQueue;
    });
  } catch (error) {
    // Handle error
    console.error(`Error processing query ID: ${id}:`, error);
    
    // Check if it's a network error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isNetworkError = errorMessage.includes('network') || 
                          errorMessage.includes('ERR_INCOMPLETE_CHUNKED_ENCODING') ||
                          errorMessage.includes('fetch') ||
                          errorMessage.includes('connection');
    
    const errorType = isNetworkError ? 'Network error' : 'Processing error';
    
    updateQueue(queue => {
      const newQueue = [...queue];
      const index = newQueue.findIndex(q => q.id === id);
      if (index !== -1) {
        newQueue[index] = {
          ...newQueue[index],
          status: 'error',
          loading: false,
          error: `${errorType}: ${errorMessage}`
        };
        
        // 에러가 발생한 경우에도 쿼리와 카테고리 정보를 저장
        const errorItem = newQueue[index];
        try {
          saveErrorResponse(
            errorItem.text,
            `${errorType}: ${errorMessage}`,
            {
              input_text: errorItem.text,
              query_category: errorItem.category || '분류 없음',
              action: 'error',
              token_count: 0,
              response_id: `error-${errorItem.id}`,
              latency: 0,
              order_id: batchId || undefined
            },
            batchId || undefined
          ).catch(saveError => {
            console.error(`Failed to save error response for query ID: ${id}:`, saveError);
          });
        } catch (saveError) {
          console.error(`Failed to save error response for query ID: ${id}:`, saveError);
        }
      }
      return newQueue;
    });
    
    throw error; // Re-throw to be handled by the caller
  }
} 