<!-- src/lib/components/grammar-search/ChatMessage.svelte -->
<script>
  export let message;
  export let streamingMessage = '';
  export let onShowInfo;

  import InfoIcon from './InfoIcon.svelte';
</script>

<div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
  <div class="relative max-w-[80%] rounded-lg p-3 {
    message.role === 'user' 
      ? 'bg-blue-500 text-white' 
      : message.isError 
        ? 'bg-red-100 text-red-700'
        : 'bg-gray-100 text-gray-800'
  }">
    <div class="flex items-start">
      <div class="flex-grow">
        {#if message.isStreaming}
          <p class="whitespace-pre-wrap">{streamingMessage}</p>
        {:else}
          <p class="whitespace-pre-wrap">{message.content}</p>
        {/if}
        <p class="text-xs mt-2 opacity-70">
          {message.timestamp.toLocaleTimeString()}
        </p>
      </div>
      
      {#if message.role === 'assistant' && message.contexts?.length > 0}
        <InfoIcon 
          contexts={message.contexts}
          onShowInfo={onShowInfo}
        />
      {/if}
    </div>
  </div>
</div> 