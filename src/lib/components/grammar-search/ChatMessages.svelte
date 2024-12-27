<!-- src/lib/components/grammar-search/ChatMessages.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  import InfoIcon from './InfoIcon.svelte';
  import StreamingText from './StreamingText.svelte';
  import MathMessage from '$lib/components/math-chat/MathMessage.svelte';
  import PromptInfoIcon from '$lib/components/math-chat/PromptInfoIcon.svelte';
  
  const dispatch = createEventDispatcher();
  
  export let messages = [];
  export let chatContainer;
  export let isLoading = false;
  export let isMathChat = false;
  
  function handleStreamComplete(text, index) {
    dispatch('messageComplete', {
      index,
      text
    });
  }

  function handleShowInfo(event) {
    dispatch('showInfo', event.detail);
  }

  function handleShowPrompt(event) {
    dispatch('showPrompt', event.detail);
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
  {#each messages as message, i}
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
                {chatContainer}
                onComplete={(text) => handleStreamComplete(text, i)}
              />
            {:else if isMathChat && message.role === 'assistant' && !message.isError}
              <MathMessage content={message.content} />
            {:else}
              <p class="whitespace-pre-wrap">{message.content}</p>
            {/if}
            <p class="text-xs mt-2 opacity-70">
              {message.timestamp.toLocaleTimeString()}
            </p>
          </div>
          
          {#if message.role === 'user' && message.prompt}
            <PromptInfoIcon
              prompt={message.prompt}
              on:showPrompt={handleShowPrompt}
            />
          {/if}
          
          {#if !isMathChat && message.role === 'assistant' && message.contexts?.length > 0}
            <InfoIcon 
              contexts={message.contexts}
              on:showInfo={handleShowInfo}
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