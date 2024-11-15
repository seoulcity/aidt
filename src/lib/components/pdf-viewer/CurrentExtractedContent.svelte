<script>
  export let currentContent = null;
  
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  function confirmExtraction() {
    dispatch('confirm');
  }

  function cancelExtraction() {
    dispatch('cancel');
  }
</script>

{#if currentContent}
  <div class="bg-white p-4 rounded-lg shadow mb-4">
    <h3 class="text-lg font-semibold mb-2">새로 추출된 내용</h3>
    <div class="mb-4">
      <div class="text-sm text-gray-600 mb-2">
        페이지 {currentContent.page}에서 추출된 {currentContent.type === 'text' ? '텍스트' : 
                                                currentContent.type === 'tables' ? '표' : '이미지'}
      </div>
      <div class="p-3 bg-gray-50 rounded-md max-h-60 overflow-y-auto">
        <pre class="whitespace-pre-wrap text-sm">{currentContent.text}</pre>
      </div>
    </div>
    
    <div class="flex justify-end space-x-3">
      <button
        type="button"
        on:click={cancelExtraction}
        class="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
      >
        취소
      </button>
      <button
        type="button"
        on:click={confirmExtraction}
        class="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
      >
        추가하기
      </button>
    </div>
  </div>
{/if} 