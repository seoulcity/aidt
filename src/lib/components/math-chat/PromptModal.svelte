<!-- src/lib/components/math-chat/PromptModal.svelte -->
<script lang="ts">
  export let isOpen: boolean = false;
  export let prompt: string = '';
  export let onClose: () => void;
</script>

{#if isOpen}
  <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-lg max-w-3xl w-full max-h-[80vh] flex flex-col">
      <div class="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 class="text-lg font-medium">프롬프트 내용</h2>
        <button 
          class="text-gray-500 hover:text-gray-700"
          on:click={onClose}
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="p-4 overflow-y-auto flex-1">
        <pre class="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded">{prompt}</pre>
      </div>
    </div>
  </div>
{/if} 