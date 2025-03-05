<!-- src/routes/api-test/evaluation/ProgressModal.svelte -->
<script lang="ts">
  export let title: string = "작업 진행 중";
  export let message: string = "작업이 진행 중입니다...";
  export let progress: number = 0; // 0-100 사이의 값
  export let isOpen: boolean = false;
  export let onCancel: () => void;
  export let isCancelable: boolean = true;
  export let isComplete: boolean = false;
  export let completeMessage: string = "작업이 완료되었습니다.";
  export let onClose: () => void;
</script>

{#if isOpen}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 w-full max-w-md">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">{isComplete ? "작업 완료" : title}</h3>
        {#if isComplete || !isCancelable}
          <button 
            class="text-gray-500 hover:text-gray-700" 
            on:click={onClose}
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        {/if}
      </div>
      
      {#if isComplete}
        <p class="mb-4">{completeMessage}</p>
        <div class="flex justify-end">
          <button 
            class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            on:click={onClose}
          >
            확인
          </button>
        </div>
      {:else}
        <p class="mb-4">{message}</p>
        
        <div class="w-full bg-gray-200 rounded-full h-2.5 mb-4">
          <div class="bg-blue-600 h-2.5 rounded-full" style="width: {progress}%"></div>
        </div>
        
        <div class="text-right text-sm text-gray-500 mb-4">
          {Math.round(progress)}%
        </div>
        
        {#if isCancelable}
          <div class="flex justify-end">
            <button 
              class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              on:click={onCancel}
            >
              취소
            </button>
          </div>
        {/if}
      {/if}
    </div>
  </div>
{/if} 