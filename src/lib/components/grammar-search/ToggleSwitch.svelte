<!-- src/lib/components/grammar-search/ToggleSwitch.svelte -->
<script>
  export let checked = false;
  export let label = '';
  export let description = '';
  export let id = 'toggle-switch';
</script>

<div class="flex items-center justify-between">
  <label for={id} class="flex items-center cursor-pointer">
    <div class="mr-3 text-sm">
      <span class="font-medium text-gray-900">{label}</span>
      <p class="text-gray-500">{description}</p>
    </div>
    <div class="relative">
      <input 
        type="checkbox" 
        {id}
        class="sr-only" 
        bind:checked
      >
      <div class="block w-14 h-8 rounded-full transition-colors duration-300 ease-in-out
                  {checked ? 'bg-blue-100' : 'bg-gray-200'}">
      </div>
      <div class="absolute left-1 top-1 w-6 h-6 rounded-full transition-all duration-300 ease-in-out
                  {checked 
                    ? 'translate-x-6 bg-blue-600' 
                    : 'translate-x-0 bg-white'}">
      </div>
    </div>
  </label>
  {#if checked}
    <span class="text-sm text-blue-600 font-medium">활성화됨</span>
  {:else}
    <span class="text-sm text-gray-500">비활성화됨</span>
  {/if}
</div> 