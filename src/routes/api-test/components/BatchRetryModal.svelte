<!-- src/routes/api-test/components/BatchRetryModal.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let showModal: boolean = false;
  export let selectedCategory: string = '';
  export let retryCount: number = 0;
  export let concurrentLimit: number = 3;
  export let batchRetryInProgress: boolean = false;
  export let batchRetryProgress: number = 0;
  export let batchRetryTotal: number = 0;
  
  const dispatch = createEventDispatcher<{
    close: void;
    start: { concurrentLimit: number };
    cancel: void;
  }>();
  
  function closeModal() {
    dispatch('close');
  }
  
  function startBatchRetry() {
    if (retryCount === 0) {
      closeModal();
      return;
    }
    
    dispatch('start', { concurrentLimit });
  }
  
  function cancelBatchRetry() {
    dispatch('cancel');
  }
</script>

{#if showModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 max-w-md w-full">
      <h2 class="text-xl font-bold mb-4">
        {selectedCategory === '전체' 
          ? '전체 카테고리 다시 시도' 
          : selectedCategory === '에러' 
            ? '에러 카테고리 다시 시도' 
            : `'${selectedCategory}' 카테고리 다시 시도`}
      </h2>
      
      <div class="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
        <p class="mb-2 font-medium text-yellow-800">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          전체 항목 다시 시도 안내
        </p>
        <p class="text-sm text-yellow-700">       
          <span class="font-bold">선택된 '{selectedCategory}' 카테고리의 모든 항목 {retryCount}개</span> API 호출을 다시 시도합니다.
        </p>
      </div>
      
      <p class="mb-4 text-sm text-gray-600">
        <span class="font-medium">총 처리 항목:</span> <span class="font-bold">{retryCount}개</span> 
      </p>
      
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">동시 처리 수</label>
        <input 
          type="number" 
          bind:value={concurrentLimit} 
          min="1" 
          max="10" 
          class="w-full px-3 py-2 border rounded-md"
        />
        <p class="text-xs text-gray-500 mt-1">동시에 처리할 요청 수를 설정합니다. (1-10)</p>
      </div>
      
      {#if batchRetryInProgress}
        <div class="mb-4">
          <p class="text-sm mb-2">진행 중... ({batchRetryProgress}/{batchRetryTotal})</p>
          <div class="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              class="bg-green-600 h-2.5 rounded-full" 
              style="width: {batchRetryProgress / batchRetryTotal * 100}%"
            ></div>
          </div>
        </div>
        
        <div class="flex justify-end">
          <button
            class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            on:click={cancelBatchRetry}
          >
            취소
          </button>
        </div>
      {:else}
        <div class="flex justify-end gap-2">
          <button
            class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            on:click={closeModal}
          >
            취소
          </button>
          <button
            class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            on:click={startBatchRetry}
          >
            시작
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if} 