// src/routes/api-test/stores/batchStore.ts
import { writable, get } from 'svelte/store';
import { supabase } from '$lib/supabaseClient';
import { getBatchSummaries } from '../db';
import type { BatchStore, BatchStoreState } from './types';

// Initial state
const initialState: BatchStoreState = {
  batchSummaries: [],
  selectedBatchId: null,
  isIndividualMode: false,
  loading: false,
  error: null,
  deletingBatchId: null,
  deletingBatchProgress: 0
};

// Create batch store
export function createBatchStore(): BatchStore {
  const { subscribe, update, set } = writable<BatchStoreState>(initialState);

  return {
    subscribe,
    update,
    set,

    // Load batch summaries
    async loadBatchSummaries() {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        // Load batch list (including individual runs)
        const batchData = await getBatchSummaries();
        
        // Load individual results to check if they exist
        const { data: individualData, count: individualCount } = await supabase
          .from('clario_responses')
          .select('created_at', { count: 'exact' })
          .eq('is_batch', false)
          .order('created_at', { ascending: false })
          .limit(1);
        
        let updatedBatchSummaries = [...batchData];
        
        // If individual results exist, add them as a virtual batch
        if (individualCount && individualCount > 0) {
          updatedBatchSummaries = [
            {
              batch_id: 'individual',
              created_at: individualData?.[0]?.created_at || new Date().toISOString(),
              count: individualCount,
              is_individual: true
            },
            ...batchData
          ];
        }
        
        update(state => ({
          ...state,
          batchSummaries: updatedBatchSummaries,
          loading: false
        }));
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : '배치 목록을 불러오는데 실패했습니다.';
        update(state => ({ ...state, error: errorMessage, loading: false }));
      }
    },

    // Select a batch
    async selectBatch(batchId: string | null, shouldLoad = true) {
      if (shouldLoad) {
        update(state => ({ ...state, loading: true }));
      }
      
      const isIndividualMode = batchId === 'individual';
      
      update(state => ({
        ...state,
        selectedBatchId: batchId,
        isIndividualMode
      }));
    },

    // Delete a batch
    async deleteBatch(batchId: string) {
      if (!confirm('정말 이 배치의 모든 응답을 삭제하시겠습니까?')) return;
      
      // Set deletion start state
      update(state => ({
        ...state,
        deletingBatchId: batchId,
        deletingBatchProgress: 0
      }));
      
      try {
        // Check number of responses in the batch
        const { count } = await supabase
          .from('clario_responses')
          .select('id', { count: 'exact' })
          .eq(batchId === 'individual' ? 'is_batch' : 'batch_id', batchId === 'individual' ? false : batchId);
        
        if (count === null || count === 0) {
          throw new Error('삭제할 응답이 없습니다.');
        }
        
        // Decide whether to delete all at once or in chunks based on batch size
        if (count <= 100) {
          // Delete small batches at once
          const { error: err } = await supabase
            .from('clario_responses')
            .delete()
            .eq(batchId === 'individual' ? 'is_batch' : 'batch_id', batchId === 'individual' ? false : batchId);
          
          if (err) throw err;
          
          // Set progress to 100%
          update(state => ({
            ...state,
            deletingBatchProgress: 100
          }));
        } else {
          // Delete large batches in chunks and update progress
          const chunkSize = 50;
          const totalChunks = Math.ceil(count / chunkSize);
          
          // Get all IDs
          const { data: allIds } = await supabase
            .from('clario_responses')
            .select('id')
            .eq(batchId === 'individual' ? 'is_batch' : 'batch_id', batchId === 'individual' ? false : batchId);
          
          if (!allIds) throw new Error('응답 ID를 가져오는데 실패했습니다.');
          
          // Split into chunks
          const chunks = [];
          for (let i = 0; i < allIds.length; i += chunkSize) {
            chunks.push(allIds.slice(i, i + chunkSize));
          }
          
          // Delete each chunk sequentially
          for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const ids = chunk.map(item => item.id);
            
            const { error: err } = await supabase
              .from('clario_responses')
              .delete()
              .in('id', ids);
            
            if (err) throw err;
            
            // Update progress
            const progress = Math.round(((i + 1) / totalChunks) * 100);
            update(state => ({
              ...state,
              deletingBatchProgress: progress
            }));
            
            // Add a short delay to allow UI to update
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        
        // After deletion is complete, reset deletion state
        setTimeout(() => {
          update(state => ({
            ...state,
            deletingBatchId: null,
            deletingBatchProgress: 0
          }));
          
          // Reload batch summaries
          this.loadBatchSummaries();
        }, 500);
      } catch (e) {
        alert(e instanceof Error ? e.message : '배치 삭제 중 오류가 발생했습니다.');
        update(state => ({
          ...state,
          deletingBatchId: null,
          deletingBatchProgress: 0
        }));
      }
    }
  };
}

// Create and export batch store instance
export const batchStore = createBatchStore(); 