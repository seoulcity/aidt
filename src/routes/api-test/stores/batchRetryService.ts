// src/routes/api-test/stores/batchRetryService.ts
import { writable, get } from 'svelte/store';
import type { ResponseData } from './types';
import { supabase } from '$lib/supabaseClient';
import { retryingIdsStore } from './retryService';

// Store for batch retry state
export const batchRetryStore = writable({
  inProgress: false,
  cancelled: false
});

// Retry all responses in a category
export async function retryBatchByCategory(
  category: string, 
  concurrentLimit: number, 
  batchId: string | null,
  isIndividualMode: boolean,
  responseStore: any,
  progressCallback: (progress: number, total: number) => void
) {
  // Get all responses for the category
  let responsesToRetry: ResponseData[] = [];
  
  if (category === '전체') {
    // Get all responses for the batch
    const { data, error } = await supabase
      .from('clario_responses')
      .select('*')
      .eq(isIndividualMode ? 'is_batch' : 'batch_id', isIndividualMode ? false : batchId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error('응답을 불러오는데 실패했습니다.');
    }
    
    responsesToRetry = data || [];
  } else if (category === '에러') {
    // Get error responses
    const { data, error } = await supabase
      .from('clario_responses')
      .select('*')
      .eq(isIndividualMode ? 'is_batch' : 'batch_id', isIndividualMode ? false : batchId)
      .not('error_message', 'is', null)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error('에러 응답을 불러오는데 실패했습니다.');
    }
    
    responsesToRetry = data || [];
  } else {
    // Get responses for the specific category
    const { data, error } = await supabase
      .from('clario_responses')
      .select('*')
      .eq(isIndividualMode ? 'is_batch' : 'batch_id', isIndividualMode ? false : batchId)
      .eq('query_category', category)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`${category} 카테고리의 응답을 불러오는데 실패했습니다.`);
    }
    
    responsesToRetry = data || [];
  }
  
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
          },
          body: JSON.stringify(formData)
        });
        
        if (!apiResponse.ok) {
          throw new Error(`HTTP error! status: ${apiResponse.status}`);
        }
        
        const reader = apiResponse.body?.getReader();
        if (!reader) throw new Error('Response body is not readable');
        
        const decoder = new TextDecoder();
        let buffer = '';
        let streamingText = '';
        let metadata: any = null;
        
        while (true) {
          // If cancelled, stop processing
          if (get(batchRetryStore).cancelled) {
            reader.cancel();
            break;
          }
          
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
                  streamingText += parsedData.text;
                } else if (parsedData.type === 'all') {
                  metadata = {
                    ...parsedData,
                    input_text: response.input_text,
                    query_category: response.query_category || '분류 없음',
                    action: parsedData.action || '',
                    token_count: parsedData.token_count || 0,
                    response_id: parsedData.response_id || '',
                    latency: parsedData.latency || 0
                  };
                }
              } catch (e) {
                console.error('Failed to parse response data:', e);
              }
            }
          }
        }
        
        // If we have a response and not cancelled, update the database
        if (streamingText && metadata && !get(batchRetryStore).cancelled) {
          // Delete the old response
          await responseStore.deleteResponse(response.id, false);
          
          // Save the new response
          await responseStore.saveResponse(streamingText, metadata, batchId);
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
  batchRetryStore.update(state => ({ ...state, cancelled: true }));
} 