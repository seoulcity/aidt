<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
</script>

<div class="flex justify-between items-center mb-4">
  <h2 class="text-xl font-bold">새로운 문제 만들기</h2>
  <button
    class="text-gray-500 hover:text-gray-700"
    on:click={() => dispatch('close')}
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  </button>
</div> 