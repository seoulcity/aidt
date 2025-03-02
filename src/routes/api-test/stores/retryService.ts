import { writable, get } from 'svelte/store';
import type { ResponseData } from './types';
import { supabase } from '$lib/supabaseClient';

// Store for tracking retrying IDs
export const retryingIdsStore = writable<Set<number>>(new Set());

// Retry a single response
export async function retryResponse(
  response: ResponseData, 
  batchId: string | null, 
  responseStore: any
) {
  // Mark response as retrying
  retryingIdsStore.update(ids => {
    const newIds = new Set(ids);
    newIds.add(response.id);
    return newIds;
  });
  
  try {
    // Prepare request data
    const formData = {
      query: response.input_text,
      group_id: `retry_${response.id}_${Date.now()}`,
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
    
    // If we have a response, update the database
    if (streamingText && metadata) {
      // Delete the old response
      await responseStore.deleteResponse(response.id, false);
      
      // Save the new response
      await responseStore.saveResponse(streamingText, metadata, batchId || undefined);
      
      return true;
    } else {
      throw new Error('응답을 받지 못했습니다.');
    }
  } catch (error) {
    alert(error instanceof Error ? error.message : '재시도 중 오류가 발생했습니다.');
    return false;
  } finally {
    // Remove from retrying IDs
    retryingIdsStore.update(ids => {
      const newIds = new Set(ids);
      newIds.delete(response.id);
      return newIds;
    });
  }
}

// Check if a response is currently being retried
export function isRetrying(id: number): boolean {
  return get(retryingIdsStore).has(id);
} 