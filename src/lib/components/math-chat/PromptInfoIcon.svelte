<!-- src/lib/components/math-chat/PromptInfoIcon.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let prompt: string;
  const dispatch = createEventDispatcher();

  function handleClick() {
    dispatch('showPrompt', { prompt });
  }
</script>

<button
  class="ml-2 p-1 text-blue-500 hover:text-blue-600 transition-colors"
  on:click={handleClick}
  title="프롬프트 보기"
>
  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
</button> 