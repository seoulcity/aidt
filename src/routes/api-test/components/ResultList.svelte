<!-- src/routes/api-test/components/ResultList.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ResponseData } from '../stores/types';
  import ResponseItem from './ResponseItem.svelte';
  
  export let responses: ResponseData[] = [];
  export let batchId: string | null = null;
  export let formatDate: (dateString: string) => string;
  export let isValidArray: <T>(arr: T[] | null | undefined) => arr is T[];
  export let deletingIds: Set<number> = new Set();
  export let retryingIds: Set<number> = new Set();
  export let totalCount: number = 0;
  export let currentPage: number = 1;
  export let itemsPerPage: number = 10;
  export let totalPages: number = 1;
  export let visiblePageNumbers: number[] = [];
  export let loading: boolean = false;
  export let isSearching: boolean = false;
  export let searchQuery: string = '';
  export let isDetailView: boolean = false;
  
  const dispatch = createEventDispatcher<{
    delete: { id: number };
    retry: { response: ResponseData, batchId: string | null };
    changePage: { page: number };
    clearSearch: void;
    view: { id: number };
  }>();
  
  function handleDelete(event: CustomEvent<{ id: number }>) {
    dispatch('delete', event.detail);
  }
  
  function handleRetry(event: CustomEvent<{ response: ResponseData, batchId: string | null }>) {
    dispatch('retry', event.detail);
  }
  
  function handleView(event: CustomEvent<{ id: number }>) {
    dispatch('view', event.detail);
  }
  
  function changePage(page: number) {
    dispatch('changePage', { page });
  }
  
  function clearSearch() {
    dispatch('clearSearch');
  }
</script>

<div class="space-y-6">
  {#if responses.length === 0}
    <div class="p-8 text-center bg-gray-50 rounded-lg border">
      {#if searchQuery}
        <p class="text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline-block mr-1 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
          </svg>
          "<span class="font-medium">{searchQuery}</span>"에 대한 검색 결과가 없습니다.
          <button 
            class="ml-2 text-blue-500 hover:text-blue-700 underline"
            on:click={clearSearch}
          >
            검색 초기화
          </button>
        </p>
      {:else}
        <p class="text-gray-500">표시할 결과가 없습니다.</p>
      {/if}
    </div>
  {:else}
    
    {#each responses as response}
      <ResponseItem 
        {response} 
        {batchId}
        {formatDate}
        {isValidArray}
        isDeleting={deletingIds.has(response.id) || retryingIds.has(response.id)}
        {isDetailView}
        on:delete={handleDelete}
        on:retry={handleRetry}
        on:view={handleView}
      />
    {/each}
    
    <!-- 페이지네이션 UI -->
    {#if totalPages > 1}
      <div class="flex justify-center items-center gap-2 mt-8">
        <button
          on:click={() => changePage(1)}
          disabled={currentPage === 1 || loading || isSearching}
          class="px-3 py-1 rounded border {currentPage === 1 || loading || isSearching ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'}"
        >
          &laquo;
        </button>
        
        <button
          on:click={() => changePage(currentPage - 1)}
          disabled={currentPage === 1 || loading || isSearching}
          class="px-3 py-1 rounded border {currentPage === 1 || loading || isSearching ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'}"
        >
          이전
        </button>
        
        {#each visiblePageNumbers as page}
          {#if page === 1 && currentPage > 3}
            <button
              on:click={() => changePage(page)}
              disabled={loading || isSearching}
              class="px-3 py-1 rounded border {page === currentPage ? 'bg-green-500 text-white' : loading || isSearching ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'}"
            >
              {page}
            </button>
            {#if currentPage > 4}
              <span class="px-1">...</span>
            {/if}
          {:else if page === totalPages && currentPage < totalPages - 2}
            {#if currentPage < totalPages - 3}
              <span class="px-1">...</span>
            {/if}
            <button
              on:click={() => changePage(page)}
              disabled={loading || isSearching}
              class="px-3 py-1 rounded border {page === currentPage ? 'bg-green-500 text-white' : loading || isSearching ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'}"
            >
              {page}
            </button>
          {:else}
            <button
              on:click={() => changePage(page)}
              disabled={loading || isSearching}
              class="px-3 py-1 rounded border {page === currentPage ? 'bg-green-500 text-white' : loading || isSearching ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'}"
            >
              {page}
            </button>
          {/if}
        {/each}
        
        <button
          on:click={() => changePage(currentPage + 1)}
          disabled={currentPage === totalPages || loading || isSearching}
          class="px-3 py-1 rounded border {currentPage === totalPages || loading || isSearching ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'}"
        >
          다음
        </button>
        
        <button
          on:click={() => changePage(totalPages)}
          disabled={currentPage === totalPages || loading || isSearching}
          class="px-3 py-1 rounded border {currentPage === totalPages || loading || isSearching ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'}"
        >
          &raquo;
        </button>
      </div>
    {/if}
  {/if}
</div> 