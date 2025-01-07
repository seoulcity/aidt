<script>
  import { createEventDispatcher } from 'svelte';
  import { embeddingResults } from '$lib/stores/embeddingStore';
  
  export let showModal = false;
  
  const dispatch = createEventDispatcher();
  
  function handleClose() {
    dispatch('close');
  }

  function getCategoryColor(category) {
    return category === '학습팁' ? 'text-blue-600' : 'text-purple-600';
  }
  
  $: similarities = $embeddingResults.similarities;
  $: category = $embeddingResults.category;
  $: isLoading = $embeddingResults.isLoading;
  $: error = $embeddingResults.error;
</script>

{#if showModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold">질문 분석 결과</h2>
        <button
          class="text-gray-500 hover:text-gray-700"
          on:click={handleClose}
        >
          <span class="material-symbols-rounded">close</span>
        </button>
      </div>
      
      {#if isLoading}
        <div class="flex justify-center items-center py-8">
          <div class="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      {:else if error}
        <div class="text-red-500 py-4">
          오류가 발생했습니다: {error}
        </div>
      {:else if similarities.length > 0}
        <div class="space-y-6">
          <div class="border-b pb-4">
            <h3 class="text-lg font-semibold mb-2">예측된 카테고리</h3>
            <div class="flex items-center gap-2">
              <span class="text-lg font-medium {getCategoryColor(category)}">
                {category}
              </span>
              <span class="text-sm text-gray-500">
                (상위 5개 유사 질문 기준)
              </span>
            </div>
          </div>

          <div>
            <h3 class="text-lg font-semibold mb-3">유사한 질문들</h3>
            <div class="space-y-4">
              {#each similarities as { query, category, keywords, similarity }}
                <div class="border rounded p-3">
                  <div class="flex items-start justify-between gap-4 mb-2">
                    <div class="font-medium">{query}</div>
                    <span class="flex-shrink-0 text-sm font-medium {getCategoryColor(category)}">
                      {category}
                    </span>
                  </div>
                  <div class="text-sm text-gray-600 mb-2">
                    키워드: {keywords.join(', ')}
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="flex-1 h-2 bg-gray-200 rounded">
                      <div
                        class="h-full bg-blue-500 rounded"
                        style="width: {similarity * 100}%"
                      ></div>
                    </div>
                    <span class="text-sm text-gray-600">
                      {(similarity * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      {:else}
        <div class="text-gray-500 py-4">
          유사도 결과가 없습니다.
        </div>
      {/if}
    </div>
  </div>
{/if} 