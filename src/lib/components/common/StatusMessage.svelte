<!-- src/lib/components/common/StatusMessage.svelte -->
<script>
  export let message = '';
  export let type = 'info'; // 'info' 또는 'error'
</script>

{#if message}
  <div class="mb-4 p-4 rounded-md {type === 'error' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}">
    {message}
  </div>
{/if} 