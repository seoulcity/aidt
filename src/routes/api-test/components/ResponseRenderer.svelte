<!-- src/routes/api-test/components/ResponseRenderer.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Metadata } from '../types';
  import { downloadJSON, downloadCSV } from '../download';
  
  // Props
  export let queryText: string = '';
  export let category: string = '';
  export let responseText: string = '';
  export let metadata: Metadata | null = null;
  export let loading: boolean = false;
  export let error: any = null;
  export let index: number = 0;
  export let saveStatus: { saved: boolean; error: string | null } = { saved: false, error: null };
  
  // Event dispatcher
  const dispatch = createEventDispatcher<{
    complete: { index: number, success: boolean };
    remove: { index: number };
  }>();
  
  // Helper function
  function isValidArray<T>(arr: T[] | undefined): arr is T[] {
    return Array.isArray(arr) && arr.length > 0;
  }
  
  // Notify when response is complete
  $: if (!loading && (responseText || error)) {
    dispatch('complete', { index, success: !error });
  }
</script>

<div class="border rounded-lg p-4 mb-4 bg-white">
  <div class="flex justify-between items-start mb-2">
    <div>
      <h3 class="font-bold text-lg">쿼리 #{index + 1}</h3>
      <p class="text-sm text-gray-600 mb-2 line-clamp-2" title={queryText}>{queryText}</p>
      {#if category}
        <span class="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full mb-2">
          {category}
        </span>
      {/if}
    </div>
    <button 
      on:click={() => dispatch('remove', { index })}
      class="text-gray-500 hover:text-red-500"
      title="Remove"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
      </svg>
    </button>
  </div>
  
  {#if loading}
    <div class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent"></div>
      <span class="ml-2 text-gray-600">응답 생성 중...</span>
    </div>
  {:else if error}
    <div class="bg-red-50 p-4 rounded-md">
      <h4 class="font-bold text-red-700">Error:</h4>
      <pre class="whitespace-pre-wrap break-words text-sm text-red-600">{JSON.stringify(error, null, 2)}</pre>
    </div>
  {:else if responseText}
    <div class="bg-green-50 p-4 rounded-md">
      <h4 class="font-bold mb-2 text-green-800">Response:</h4>
      <div class="prose max-w-none">
        <p class="whitespace-pre-wrap text-sm">{responseText}</p>
      </div>
      
      {#if metadata}
        <div class="flex gap-2 mt-4">
          <button
            on:click={() => downloadJSON(responseText, metadata)}
            class="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
            JSON
          </button>
          <button
            on:click={() => downloadCSV(responseText, metadata)}
            class="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
            CSV
          </button>
          <button
            on:click={() => {
              if (isValidArray(metadata?.reference) || isValidArray(metadata?.recommended_questions) || isValidArray(metadata?.images)) {
                document.getElementById(`metadata-${index}`).classList.toggle('hidden');
              }
            }}
            class="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center gap-1"
            disabled={!isValidArray(metadata?.reference) && !isValidArray(metadata?.recommended_questions) && !isValidArray(metadata?.images)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M5 4a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V5a1 1 0 00-1-1H5zm0-2h10a3 3 0 013 3v10a3 3 0 01-3 3H5a3 3 0 01-3-3V5a3 3 0 013-3z" clip-rule="evenodd" />
            </svg>
            Details
          </button>
        </div>

        {#if saveStatus.saved}
          <div class="mt-2 p-2 bg-green-100 text-green-700 rounded text-sm">
            응답이 성공적으로 저장되었습니다.
          </div>
        {:else if saveStatus.error}
          <div class="mt-2 p-2 bg-red-100 text-red-700 rounded text-sm">
            저장 실패: {saveStatus.error}
          </div>
        {/if}
        
        <div id="metadata-{index}" class="mt-4 space-y-3 hidden">
          {#if isValidArray(metadata.reference)}
            <div class="border rounded-md p-3">
              <h5 class="font-bold mb-1 text-sm">References:</h5>
              <ul class="list-disc pl-5 text-xs">
                {#each metadata.reference as ref}
                  <li>{ref}</li>
                {/each}
              </ul>
            </div>
          {/if}

          {#if isValidArray(metadata.recommended_questions)}
            <div class="border rounded-md p-3">
              <h5 class="font-bold mb-1 text-sm">Recommended Questions:</h5>
              <ul class="list-disc pl-5 text-xs">
                {#each metadata.recommended_questions as question}
                  <li>{question}</li>
                {/each}
              </ul>
            </div>
          {/if}

          {#if isValidArray(metadata.images)}
            <div class="border rounded-md p-3">
              <h5 class="font-bold mb-1 text-sm">Images:</h5>
              <div class="grid grid-cols-2 gap-2">
                {#each metadata.images as image}
                  <img src={image} alt="Response image" class="w-full h-auto rounded" />
                {/each}
              </div>
            </div>
          {/if}

          <div class="border rounded-md p-3">
            <h5 class="font-bold mb-1 text-sm">Additional Information:</h5>
            <dl class="grid grid-cols-2 gap-1 text-xs">
              <dt class="font-semibold">Action:</dt>
              <dd>{metadata.action}</dd>
              {#if metadata.sub_action}
                <dt class="font-semibold">Sub Action:</dt>
                <dd>{metadata.sub_action}</dd>
              {/if}
              <dt class="font-semibold">Token Count:</dt>
              <dd>{metadata.token_count}</dd>
              <dt class="font-semibold">Latency:</dt>
              <dd>{metadata.latency.toFixed(2)}s</dd>
              <dt class="font-semibold">Response ID:</dt>
              <dd class="break-all">{metadata.response_id}</dd>
            </dl>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div> 