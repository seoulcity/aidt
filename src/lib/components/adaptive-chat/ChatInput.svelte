<!-- src/lib/components/adaptive-chat/ChatInput.svelte -->
<script>
  export let onSubmit;
  export let isLoading;
  
  let inputElement;
  let newMessage = '';

  function handleSubmit() {
    if (!newMessage.trim()) return;
    onSubmit(newMessage);
    newMessage = '';
  }

  export function setValue(value) {
    newMessage = value;
  }

  export { inputElement as this };
</script>

<div class="border-t border-gray-200 p-4">
  <form on:submit|preventDefault={handleSubmit} class="flex space-x-4">
    <input
      bind:this={inputElement}
      type="text"
      bind:value={newMessage}
      placeholder="메시지를 입력하세요..."
      class="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    <button
      type="submit"
      disabled={isLoading || !newMessage.trim()}
      class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      전송
    </button>
  </form>
</div> 