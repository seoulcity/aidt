<!-- src/lib/components/grammar-search/ContextModal.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let contexts = null;
  export let showModal = false;

  function closeModal() {
    showModal = false;
    contexts = null;
    dispatch('close');
  }

  function showContextInfo(contexts) {
    showModal = true;
    dispatch('showInfo', { contexts });
  }
</script>

{#if showModal && contexts}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto
                [scrollbar-width:thin] [scrollbar-color:rgba(156,163,175,0.5)_transparent]
                [&::-webkit-scrollbar]:w-[6px]
                [&::-webkit-scrollbar-track]:bg-transparent
                [&::-webkit-scrollbar-thumb]:bg-scrollbar
                [&::-webkit-scrollbar-thumb]:rounded">
      <div class="flex justify-between items-start mb-4">
        <h3 class="text-lg font-semibold">참고한 교과서 자료</h3>
        <button
          class="text-gray-500 hover:text-gray-700"
          on:click={closeModal}
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div class="space-y-4">
        {#each contexts as context, i}
          <div class="border rounded-lg p-4">
            <div class="flex justify-between items-start mb-2">
              <div class="text-sm font-medium text-gray-900">
                {context.textbook} {context.unit}
              </div>
              <div class="text-sm text-gray-500">
                {context.schoolLevel} {context.grade}학년
              </div>
            </div>
            <div class="text-sm text-gray-600 mb-2">
              주제: {context.topic}
            </div>
            <div class="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 p-3 rounded">
              {context.context}
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
{/if} 