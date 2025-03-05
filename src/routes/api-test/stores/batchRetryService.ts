// src/routes/api-test/stores/batchRetryService.ts
import { writable, get } from 'svelte/store';
import type { ResponseData } from './types';
import { supabase } from '$lib/supabaseClient';
import { retryingIdsStore } from './retryStoreUtils';
import { processStreamingResponse } from './retryStreamHandler';

// Store for batch retry state
export const batchRetryStore = writable({
  inProgress: false,
  cancelled: false
});

// Retry all responses in a category
export async function retryBatchByCategory(
  responsesToRetry: ResponseData[],
  batchId: string | null,
  concurrentLimit: number,
  progressCallback: (progress: number, total: number) => void,
  isIndividualMode: boolean = false,
  responseStore: any = null
) {
  // If no responses to retry, return
  if (responsesToRetry.length === 0) {
    return;
  }
  
  // Set batch retry in progress
  batchRetryStore.set({ inProgress: true, cancelled: false });
  
  // Create a new batch ID for the retries
  const newBatchId = `retry_batch_${Date.now()}`;
  
  // Track progress
  let completedCount = 0;
  const totalCount = responsesToRetry.length;
  
  // Create a queue of responses to process
  const queue = [...responsesToRetry];
  
  // Create a set of active retry IDs
  const activeRetryIds = new Set<number>();
  
  // Process the queue
  const processQueue = async () => {
    // If cancelled, stop processing
    if (get(batchRetryStore).cancelled) {
      return;
    }
    
    // If queue is empty, we're done
    if (queue.length === 0) {
      return;
    }
    
    // Get the next batch of responses to process
    const availableSlots = concurrentLimit - activeRetryIds.size;
    if (availableSlots <= 0) {
      return;
    }
    
    const batch = queue.splice(0, availableSlots);
    
    // Process each response in the batch
    const promises = batch.map(async (response) => {
      try {
        // Add to active retry IDs
        activeRetryIds.add(response.id);
        
        // Mark response as retrying
        retryingIdsStore.update(ids => {
          const newIds = new Set(ids);
          newIds.add(response.id);
          return newIds;
        });
        
        // Prepare request data
        const formData = {
          query: response.input_text,
          group_id: `${newBatchId}_${response.id}`,
          persona: "선생님",
          user_type: ""
        };
        
        // Make the API request
        const apiResponse = await fetch('https://cne-dev-hcx.clabi.co.kr/api/v1/clario/main', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
          },
          body: JSON.stringify(formData)
        });
        
        if (!apiResponse.ok) {
          throw new Error(`HTTP error! status: ${apiResponse.status}`);
        }
        
        // Process the streaming response
        const result = await processStreamingResponse(apiResponse, response);
        const streamingText = result.streamingText;
        const metadata = result.metadata;
        
        // If we have a response and not cancelled, update the database
        if (streamingText && metadata && !get(batchRetryStore).cancelled) {
          // If responseStore is provided, use it to delete and save the response
          if (responseStore) {
            // Delete the old response
            await responseStore.deleteResponse(response.id, false);
            
            // Save the new response
            await responseStore.saveResponse(streamingText, metadata, batchId);
          } else {
            // Otherwise, use supabase directly
            // Delete the old response
            await supabase
              .from('clario_responses')
              .delete()
              .eq('id', response.id);
            
            // Save the new response
            await supabase
              .from('clario_responses')
              .insert({
                input_text: metadata.input_text,
                output_text: streamingText,
                query_category: metadata.query_category,
                action: metadata.action,
                token_count: metadata.token_count,
                response_id: metadata.response_id,
                latency: metadata.latency,
                batch_id: batchId,
                is_batch: isIndividualMode,
                error_message: metadata.error_message || null
              });
          }
        }
      } catch (error) {
        console.error(`Error retrying response ${response.id}:`, error);
      } finally {
        // Remove from active retry IDs and retrying IDs
        activeRetryIds.delete(response.id);
        
        retryingIdsStore.update(ids => {
          const newIds = new Set(ids);
          newIds.delete(response.id);
          return newIds;
        });
        
        // Update progress
        completedCount++;
        progressCallback(completedCount, totalCount);
        
        // Process next items if available
        processQueue();
      }
    });
    
    // Wait for all promises to resolve
    await Promise.all(promises);
    
    // Process next items if available
    processQueue();
  };
  
  // Start processing the queue
  await processQueue();
  
  // Wait for all items to be processed
  while (activeRetryIds.size > 0) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Set batch retry as complete
  batchRetryStore.set({ inProgress: false, cancelled: false });
}

// Cancel batch retry
export function cancelBatchRetry() {
  batchRetryStore.set({ inProgress: false, cancelled: true });
} 