<!-- src/routes/api-test/components/BatchList.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { BatchSummary } from '../stores/types';
  
  export let batchSummaries: BatchSummary[] = [];
  export let deletingBatchId: string | null = null;
  export let deletingBatchProgress: number = 0;
  export let formatDate: (dateString: string) => string;
  
  const dispatch = createEventDispatcher<{
    select: { batchId: string };
    delete: { batchId: string };
    download: { batchId: string };
  }>();
  
  function handleSelect(batchId: string) {
    if (deletingBatchId) return;
    // Navigate to the detail page
    window.location.href = `/api-test/result/${batchId}`;
  }
  
  function handleDelete(event: MouseEvent, batchId: string) {
    event.stopPropagation();
    dispatch('delete', { batchId });
  }
  
  function handleDownload(event: MouseEvent, batchId: string) {
    event.stopPropagation();
    dispatch('download', { batchId });
  }
</script>

<div class="space-y-4">
  {#each batchSummaries as summary}
    <div
      class="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer relative group"
    >
      <!-- 배치 삭제 진행 중인 경우 프로그레스 바 표시 -->
      {#if deletingBatchId === summary.batch_id}
        <div class="absolute inset-0 bg-gray-100 bg-opacity-75 flex flex-col items-center justify-center z-10 rounded-lg">
          <p class="text-gray-700 mb-2">배치 삭제 중... {deletingBatchProgress}%</p>
          <div class="w-2/3 bg-gray-200 rounded-full h-2.5">
            <div class="bg-red-600 h-2.5 rounded-full" style="width: {deletingBatchProgress}%"></div>
          </div>
        </div>
      {/if}
      
      <div 
        class="flex justify-between items-center"
        on:click={() => handleSelect(summary.batch_id)}
      >
        <div>
          <div class="flex items-center gap-2">
            <p class="text-sm text-gray-500">{formatDate(summary.created_at)}</p>
            {#if summary.is_individual}
              <span class="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">단독 수행</span>
            {:else}
              <span class="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">배치 수행</span>
            {/if}
          </div>
          <p class="font-medium">총 {summary.count}개의 응답</p>
        </div>
        
        <div class="flex items-center">
          <!-- 다운로드 버튼 (호버 시 표시) -->
          <button
            class="text-blue-500 hover:text-blue-700 p-2 rounded-full hover:bg-blue-50 transition-colors opacity-0 group-hover:opacity-100 mr-2"
            on:click={(e) => handleDownload(e, summary.batch_id)}
            disabled={deletingBatchId !== null}
            title="CSV 다운로드"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
          
          <!-- 삭제 버튼 (호버 시 표시) -->
          <button
            class="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 mr-2"
            on:click={(e) => handleDelete(e, summary.batch_id)}
            disabled={deletingBatchId !== null}
            title="배치 삭제"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
          </button>
          
          <!-- 화살표 아이콘 -->
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
          </svg>
        </div>
      </div>
    </div>
  {/each}
</div> 