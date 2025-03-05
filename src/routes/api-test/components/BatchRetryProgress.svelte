<!-- src/routes/api-test/components/BatchRetryProgress.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let batchRetryInProgress: boolean = false;
  export let batchRetryProgress: number = 0;
  export let batchRetryTotal: number = 0;
  
  const dispatch = createEventDispatcher<{
    showModal: void;
    cancel: void;
  }>();
  
  function showModal() {
    dispatch('showModal');
  }
  
  function cancelBatchRetry() {
    dispatch('cancel');
  }
</script>

{#if batchRetryInProgress}
  <div class="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 z-40 w-80">
    <div class="flex justify-between items-center mb-2">
      <h3 class="font-semibold">다시 시도 진행 중</h3>
      <button 
        class="text-gray-500 hover:text-gray-700"
        on:click={showModal}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
          <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
    
    <p class="text-sm mb-2">{batchRetryProgress}/{batchRetryTotal} 완료</p>
    <div class="w-full bg-gray-200 rounded-full h-2.5 mb-2">
      <div 
        class="bg-green-600 h-2.5 rounded-full" 
        style="width: {batchRetryProgress / batchRetryTotal * 100}%"
      ></div>
    </div>
    
    <button
      class="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
      on:click={cancelBatchRetry}
    >
      취소
    </button>
  </div>
{/if} 