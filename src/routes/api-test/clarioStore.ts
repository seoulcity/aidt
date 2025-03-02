// src/routes/api-test/lib/stores/clarioStore.ts
import { writable, get } from 'svelte/store';
import type { ClarioState, FormData, Metadata } from './types';
import { saveResponse, saveErrorResponse } from './db';
import { supabase } from '$lib/supabaseClient';

// ClarioState 인터페이스에 saveStatus 추가
interface ExtendedClarioState extends ClarioState {
  saveStatus: {
    saved: boolean;
    error: string | null;
  };
  currentBatchId: string | null;
}

const initialState: ExtendedClarioState = {
  loading: false,
  error: null,
  streamingText: "",
  metadata: null,
  formData: {
    query: "",
    group_id: "",
    persona: "선생님",
    user_type: ""
  },
  saveStatus: {
    saved: false,
    error: null
  },
  currentBatchId: null
};

function generateUUID() {
  // UUID v4 implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function createClarioStore() {
  const { subscribe, set, update } = writable<ExtendedClarioState>(initialState);

  return {
    subscribe,
    setLoading: (loading: boolean) => update(state => ({ ...state, loading })),
    setError: (error: any) => update(state => ({ ...state, error })),
    setStreamingText: (text: string) => update(state => ({ ...state, streamingText: text })),
    appendStreamingText: (text: string) => update(state => ({ ...state, streamingText: state.streamingText + text })),
    setMetadata: async (metadata: Metadata, category?: string) => {
      // Add query_category from the request metadata if it exists
      const currentState = get(clarioStore);
      const updatedMetadata: Metadata = {
        ...metadata,
        query_category: category || '분류 없음',
        // Include the group_id from formData to ensure proper ordering
        order_id: currentState.formData.group_id || undefined
      };
      
      update(state => ({ ...state, metadata: updatedMetadata }));
      
      // Save response with updated metadata
      if (currentState.streamingText && updatedMetadata) {
        try {
          await saveResponse(currentState.streamingText, updatedMetadata, currentState.currentBatchId || undefined);
          clarioStore.setSaveStatus(true);
        } catch (error) {
          clarioStore.setSaveStatus(false, error instanceof Error ? error.message : 'Failed to save response');
          
          // 에러가 발생한 경우에도 쿼리와 카테고리 정보를 저장
          try {
            await saveErrorResponse(
              updatedMetadata.input_text,
              error instanceof Error ? error.message : 'Failed to save response',
              {
                input_text: updatedMetadata.input_text,
                query_category: updatedMetadata.query_category,
                action: updatedMetadata.action,
                sub_action: updatedMetadata.sub_action,
                token_count: updatedMetadata.token_count,
                response_id: updatedMetadata.response_id,
                latency: updatedMetadata.latency,
                order_id: updatedMetadata.order_id
              },
              currentState.currentBatchId || undefined
            );
            console.log('Error response saved successfully');
          } catch (saveError) {
            console.error('Failed to save error response:', saveError);
          }
        }
      }
    },
    updateFormData: (formData: Partial<FormData>) => update(state => ({
      ...state,
      formData: { ...state.formData, ...formData }
    })),
    setSaveStatus: (saved: boolean, error: string | null = null) => 
      update(state => ({
        ...state,
        saveStatus: { saved, error }
      })),
    startBatch: () => {
      const batchId = generateUUID();
      update(state => ({ ...state, currentBatchId: batchId }));
      return batchId;
    },
    endBatch: () => update(state => ({ ...state, currentBatchId: null })),
    reset: () => update(state => ({
      ...state,
      error: null,
      streamingText: "",
      metadata: null,
      saveStatus: {
        saved: false,
        error: null
      }
    }))
  };
}

export const clarioStore = createClarioStore();

export async function handleSubmit(category?: string) {
  clarioStore.reset();
  clarioStore.setLoading(true);

  try {
    const formData = get(clarioStore).formData;
    // Remove metadata from request body
    const requestBody = {
      ...formData,
      query: formData.query,
      group_id: formData.group_id,
      persona: formData.persona,
      user_type: formData.user_type
    };

    const response = await fetch('https://cne-dev-hcx.clabi.co.kr/api/v1/clario/main', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
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
              clarioStore.appendStreamingText(parsedData.text);
            } else if (parsedData.type === 'all') {
              // Pass category to setMetadata for DB storage only
              clarioStore.setMetadata(parsedData, category);
            }
          } catch (e) {
            console.error('Failed to parse response data:', e);
          }
        }
      }
    }
  } catch (e) {
    clarioStore.setError(e);
    console.error('Error:', e);
  } finally {
    clarioStore.setLoading(false);
  }
} 