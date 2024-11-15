<!-- src/lib/components/pdf-viewer/ExtractedContentList.svelte -->
<script>
  export let extractedContents = [];
  export let isVectorizing = false;
  
  // Events that will be dispatched to parent
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  function removeExtractedContent(index) {
    dispatch('removeContent', { index });
  }

  async function vectorizeContents() {
    if (extractedContents.length === 0) return;
    
    try {
      dispatch('vectorizingStart');
      const combinedText = extractedContents
        .map(content => content.text)
        .join('\n\n');
      
      dispatch('vectorize', { text: combinedText });
    } catch (error) {
      console.error('Vectorization failed:', error);
      dispatch('vectorizingError', { error });
    }
  }
</script>

{#if extractedContents.length > 0}
  <div class="mt-4 bg-white p-4 rounded-lg shadow">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-semibold">추출된 내용 목록</h3>
      <button
        type="button"
        on:click={vectorizeContents}
        class="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
        disabled={isVectorizing}
      >
        {#if isVectorizing}
          <span>벡터화 중...</span>
        {:else}
          <span>벡터화하기</span>
        {/if}
      </button>
    </div>
    
    <div class="space-y-4">
      {#each extractedContents as content, i}
        <div class="p-3 bg-gray-50 rounded-md">
          <div class="flex justify-between items-start mb-2">
            <div class="text-sm text-gray-600">
              페이지 {content.page} - {content.type === 'text' ? '텍스트' : 
                                     content.type === 'tables' ? '표' : '이미지'}
            </div>
            <button
              type="button"
              on:click={() => removeExtractedContent(i)}
              class="text-red-600 hover:text-red-800"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <pre class="whitespace-pre-wrap text-sm">{content.text}</pre>
        </div>
      {/each}
    </div>
  </div>
{/if} 