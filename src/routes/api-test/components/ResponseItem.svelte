<!-- src/routes/api-test/components/ResponseItem.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ResponseData } from '../stores/types';
  
  export let response: ResponseData;
  export let batchId: string | null = null;
  export let formatDate: (dateString: string) => string;
  export let isValidArray: <T>(arr: T[] | null | undefined) => arr is T[];
  export let isDeleting: boolean = false;
  export let isDetailView: boolean = false;
  
  const dispatch = createEventDispatcher<{
    delete: { id: number };
    retry: { response: ResponseData, batchId: string | null };
    view: { id: number };
  }>();
  
  function handleDelete() {
    dispatch('delete', { id: response.id });
  }
  
  function handleRetry() {
    dispatch('retry', { response, batchId });
  }
  
  function handleView() {
    if (!isDetailView) {
      dispatch('view', { id: response.id });
    }
  }
  
  // Determine if this is an error response
  $: hasError = !!response.error_message;
</script>

<div 
  class="border rounded-lg p-6 bg-white shadow-sm {hasError ? 'border-red-300' : ''} {!isDetailView ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}"
  on:click={handleView}
>
  <div class="flex justify-between items-start mb-4">
    <div>
      <h3 class="font-bold text-lg mb-2">Query: {response.input_text}</h3>
      <div class="flex items-center gap-2">
        <p class="text-gray-500 text-sm">
          {formatDate(response.created_at)}
        </p>
        {#if response.query_category}
          <span class="px-2 py-1 bg-gray-100 text-xs rounded-full">
            {response.query_category}
          </span>
        {/if}
        {#if hasError}
          <span class="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
            에러
          </span>
        {/if}
      </div>
    </div>
    <div class="flex items-center gap-2">
      <!-- Retry button -->
      <button
        on:click={handleRetry}
        class="text-blue-500 hover:text-blue-700 p-2 rounded-full hover:bg-blue-50 transition-colors"
        title="다시 시도"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
        </svg>
      </button>
      
      <!-- Delete button -->
      <button
        on:click={handleDelete}
        class="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isDeleting}
      >
        {#if isDeleting}
          <div class="animate-spin rounded-full h-5 w-5 border-2 border-red-500 border-t-transparent"></div>
        {:else}
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        {/if}
      </button>
    </div>
  </div>

  <!-- 에러 메시지 표시 -->
  {#if hasError}
    <div class="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
      <h4 class="font-semibold text-red-800 mb-2">에러 발생</h4>
      <p class="text-red-700 whitespace-pre-wrap">{response.error_message}</p>
      <button 
        on:click={handleRetry}
        class="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
        </svg>
        다시 시도하기
      </button>
    </div>
  {/if}

  <div class="prose max-w-none mb-4">
    <p class="whitespace-pre-wrap">{response.response_text}</p>
  </div>

  <div class="grid grid-cols-2 gap-4 text-sm">
    <div>
      <h4 class="font-semibold mb-2">Action:</h4>
      <p>{response.action}</p>
      {#if response.sub_action}
        <h4 class="font-semibold mt-2 mb-2">Sub Action:</h4>
        <p>{response.sub_action}</p>
      {/if}
    </div>
    <div>
      <h4 class="font-semibold mb-2">Token Count:</h4>
      <p>{response.token_count}</p>
      <h4 class="font-semibold mt-2 mb-2">Latency:</h4>
      <p>{response.latency.toFixed(2)}s</p>
    </div>
  </div>

  {#if isValidArray(response.reference)}
    <div class="mt-4">
      <h4 class="font-semibold mb-2">References:</h4>
      <ul class="list-disc pl-5">
        {#each response.reference as ref}
          <li>{ref}</li>
        {/each}
      </ul>
    </div>
  {/if}

  {#if isValidArray(response.recommended_questions)}
    <div class="mt-4">
      <h4 class="font-semibold mb-2">Recommended Questions:</h4>
      <ul class="list-disc pl-5">
        {#each response.recommended_questions as question}
          <li>{question}</li>
        {/each}
      </ul>
    </div>
  {/if}

  {#if isValidArray(response.images)}
    <div class="mt-4">
      <h4 class="font-semibold mb-2">Images:</h4>
      <div class="grid grid-cols-2 gap-4">
        {#each response.images as image}
          <img src={image} alt="Response image" class="w-full h-auto rounded" />
        {/each}
      </div>
    </div>
  {/if}
</div> 