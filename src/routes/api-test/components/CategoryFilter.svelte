<!-- src/routes/api-test/components/CategoryFilter.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let categories: string[] = [];
  export let selectedCategory: string = '전체';
  export let loading: boolean = false;
  export let totalCount: number = 0;
  export let getCategoryTotalCount: (category: string) => number;
  
  const dispatch = createEventDispatcher<{
    filter: { category: string };
    retry: { category: string };
  }>();
  
  function handleCategoryFilter(category: string) {
    dispatch('filter', { category });
  }
  
  function handleRetry(category: string) {
    dispatch('retry', { category });
  }
</script>

<div class="mb-6">
  <div class="flex justify-between items-center mb-3">
    <h2 class="text-lg font-semibold">카테고리 필터</h2>
  </div>
  <div class="flex flex-wrap gap-2">
    <button
      class="px-4 py-2 rounded-full text-sm {selectedCategory === '전체' ? 'bg-green-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}"
      on:click={() => handleCategoryFilter('전체')}
      disabled={loading}
    >
      전체
    </button>
    {#each categories as category}
      {#if category !== '전체'}
        <button
          class="px-4 py-2 rounded-full text-sm {
            selectedCategory === category 
              ? category === '에러' 
                ? 'bg-red-500 text-white' 
                : 'bg-green-500 text-white' 
              : category === '에러'
                ? 'bg-red-100 hover:bg-red-200 text-red-800'
                : 'bg-gray-100 hover:bg-gray-200'
          }"
          on:click={() => handleCategoryFilter(category)}
          disabled={loading}
        >
          {category}
        </button>
      {/if}
    {/each}
  </div>
  
  <!-- 현재 선택된 카테고리 다시 시도 버튼 -->
  <div class="mt-4">
    <button
      class="px-4 py-2 rounded-md {
        selectedCategory === '에러'
          ? 'bg-red-100 hover:bg-red-200 text-red-800'
          : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
      } text-sm flex items-center gap-1"
      on:click={() => handleRetry(selectedCategory)}
      disabled={loading || totalCount === 0}
      title="현재 카테고리의 모든 항목을 다시 시도합니다"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
      </svg>
      {selectedCategory === '전체' 
        ? '전체 카테고리 다시 시도' 
        : `'${selectedCategory}' 카테고리 다시 시도`}
      <span class="ml-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-700">
        {getCategoryTotalCount(selectedCategory)}개 전체
      </span>
    </button>
    <p class="text-xs text-gray-500 mt-1 ml-1">
      선택된 카테고리의 모든 항목({getCategoryTotalCount(selectedCategory)}개) API 호출을 다시 시도합니다.
    </p>
  </div>
</div> 