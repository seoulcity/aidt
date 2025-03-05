<!-- src/routes/api-test/components/LoadingSpinner.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let message: string = "데이터를 불러오는 중...";
  export let size: "small" | "medium" | "large" = "medium";
  export let color: string = "green";
  export let error: string | null = null;
  export let retryLabel: string = "다시 시도";
  
  const dispatch = createEventDispatcher<{
    retry: void;
  }>();
  
  function handleRetry() {
    dispatch('retry');
  }
</script>

{#if error}
  <div class="bg-red-50 p-4 rounded-md mb-4">
    <p class="text-red-700">{error}</p>
    <button 
      class="mt-2 px-4 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-md text-sm"
      on:click={handleRetry}
    >
      {retryLabel}
    </button>
  </div>
{:else}
  <div class="flex justify-center items-center h-64">
    <div 
      class="animate-spin rounded-full border-4 border-t-transparent {
        size === 'small' ? 'h-8 w-8' : 
        size === 'large' ? 'h-16 w-16' : 
        'h-12 w-12'
      }" 
      style="border-color: {color === 'green' ? '#22c55e' : color} transparent {color === 'green' ? '#22c55e' : color} {color === 'green' ? '#22c55e' : color}"
    ></div>
    {#if message}
      <p class="ml-4 text-gray-600">{message}</p>
    {/if}
  </div>
{/if} 