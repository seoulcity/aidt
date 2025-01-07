<!-- src/lib/components/math-chat/SuggestionChips.svelte -->
<script lang="ts">
  export let suggestions: string[] = [];
  export let onChipClick: (suggestion: string) => void;
</script>

<div class="border-t border-gray-100 bg-white px-4 py-3">
  <div class="max-w-3xl mx-auto">
    <div class="flex overflow-x-auto hide-scrollbar gap-2 pb-2">
      {#each suggestions as suggestion}
        <button
          class="flex-none px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium 
                 hover:bg-blue-100 transition-colors duration-200 whitespace-nowrap"
          on:click={() => onChipClick(suggestion)}
        >
          {suggestion}
        </button>
      {/each}
    </div>
  </div>
</div>

<style>
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
</style> 