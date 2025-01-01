<!-- src/lib/components/grammar-search/ChatInput.svelte -->
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

  // 외부에서 값을 설정할 수 있도록 export
  export function setValue(value) {
    newMessage = value;
  }

  // bind:this를 통해 컴포넌트 인스턴스를 외부에서 참조할 수 있게 함
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
      class="px-6 py-2 bg-white text-[#AC4FF0] border-2 border-[#AC4FF0] rounded-lg shadow-sm hover:shadow-md active:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:text-white hover:border-transparent hover:bg-gradient-to-r hover:from-[#FF3B9A] hover:via-[#AC4FF0] hover:to-[#4CC9F0] hover:-translate-y-0.5 active:translate-y-0"
    >
      {#if isLoading}
        <div class="flex items-center justify-center gap-2">
          <div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          <span>전송 중...</span>
        </div>
      {:else}
        <div class="flex items-center justify-center gap-2">
          <span class="material-symbols-rounded text-sm">send</span>
          <span class="font-medium">전송</span>
        </div>
      {/if}
    </button>
  </form>
</div> 