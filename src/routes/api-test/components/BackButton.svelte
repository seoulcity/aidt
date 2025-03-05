<!-- src/routes/api-test/components/BackButton.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let text: string = "목록으로 돌아가기";
  export let customClass: string = "";
  
  const dispatch = createEventDispatcher<{
    click: void;
  }>();
  
  function handleClick() {
    dispatch('click');
  }
</script>

<button
  class="mb-4 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 {customClass}"
  on:click={handleClick}
>
  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
  </svg>
  {text}
</button> 