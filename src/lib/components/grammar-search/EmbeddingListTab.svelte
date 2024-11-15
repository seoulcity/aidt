<!-- src/lib/components/grammar-search/EmbeddingListTab.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  export let embeddings = [];
  
  function showDetails(embedding) {
    dispatch('showDetails', embedding);
  }
  
  function startEditing(embedding) {
    dispatch('startEditing', embedding);
  }
  
  function deleteEmbedding(filename, event) {
    event.stopPropagation();
    dispatch('delete', { filename });
  }
</script>

<div class="bg-white p-6 rounded-lg shadow-md">
  <div class="grid gap-4">
    {#each embeddings as embedding (embedding.id)}
      <div 
        class="p-4 bg-gray-50 rounded-lg hover:shadow-md transition-shadow"
      >
        <div class="flex justify-between items-start">
          <div class="cursor-pointer" on:click={() => showDetails(embedding)}>
            <h3 class="font-semibold">ID: {embedding.id}</h3>
            <p class="text-sm text-gray-600">교과서: {embedding.textbook}</p>
            <p class="text-sm text-gray-600">단원: {embedding.unit}</p>
            <p class="text-sm text-gray-600">주제: {embedding.topic}</p>
          </div>
          <div class="flex space-x-2">
            <button
              on:click={() => startEditing(embedding)}
              class="text-blue-600 hover:text-blue-800"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              on:click={(e) => deleteEmbedding(embedding.filename, e)}
              class="text-red-600 hover:text-red-800"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  button {
    transition: color 0.2s ease-in-out;
  }
  
  .grid {
    grid-template-columns: 1fr;
  }
  
  @media (min-width: 640px) {
    .grid {
      grid-template-columns: repeat(1, 1fr);
      gap: 1rem;
    }
  }
</style> 