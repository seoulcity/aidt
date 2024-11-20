<!-- src/lib/components/grammar-search/InfoIcon.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let contexts;

  function handleClick() {
    dispatch('showInfo', { contexts });
  }
</script>

<button
  class="flex-shrink-0 ml-3 mt-1 text-gray-400 hover:text-gray-600 transition-colors"
  on:click={handleClick}
  title="참고 자료 보기"
>
  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <circle cx="12" cy="12" r="10" stroke-width="2"/>
    <path d="M12 16v-4" stroke-width="2" stroke-linecap="round"/>
    <circle cx="12" cy="8" r="1" fill="currentColor"/>
  </svg>
</button> 