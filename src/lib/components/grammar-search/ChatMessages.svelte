<script>
  import InfoIcon from './InfoIcon.svelte';
  import StreamingText from './StreamingText.svelte';
  
  export let messages = [];
  export let chatContainer;
  export let isLoading = false;
  export let streamingMessage = '';
  export let autoScroll = true;
  export let onShowContextInfo;
  
  function handleStreamComplete(text) {
    messages = messages.map((msg, idx) => {
      if (idx === messages.length - 1) {
        return {
          ...msg,
          content: text,
          isStreaming: false
        };
      }
      return msg;
    });
  }
</script>

<div 
  bind:this={chatContainer}
  class="h-[600px] overflow-y-auto p-4 space-y-4
         [scrollbar-width:thin] [scrollbar-color:rgba(156,163,175,0.5)_transparent]
         [&::-webkit-scrollbar]:w-[6px]
         [&::-webkit-scrollbar-track]:bg-transparent
         [&::-webkit-scrollbar-thumb]:bg-scrollbar
         [&::-webkit-scrollbar-thumb]:rounded"
>
  {#if messages.length === 0}
    <div class="text-center text-gray-500 mt-8">
      <p class="text-lg mb-2">👋 안녕하세요!</p>
      <p class="mb-4">영문법에 대해 궁금한 점을 물어보세요.</p>
      <div class="space-y-2 text-sm">
        <p class="text-gray-400">예시 질문:</p>
        <p>"현재완료와 과거시제의 차이점이 무엇인가요?"</p>
        <p>"가정법 과거의 용법을 설명해주세요."</p>
        <p>"분사구문은 언제 사용하나요?"</p>
      </div>
    </div>
  {/if}
  
  {#each messages as message}
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
              <StreamingText
                text={message.content}
                {autoScroll}
                {chatContainer}
                onComplete={handleStreamComplete}
              />
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
              onShowInfo={onShowContextInfo}
            />
          {/if}
        </div>
      </div>
    </div>
  {/each}
  
  {#if isLoading}
    <div class="flex justify-start">
      <div class="bg-gray-100 rounded-lg p-3 flex items-center space-x-2">
        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0s"></div>
        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
      </div>
    </div>
  {/if}
</div> 