<script>
  import { createEventDispatcher } from 'svelte';
  import InfoIcon from '../grammar-search/InfoIcon.svelte';
  import StreamingText from '../grammar-search/StreamingText.svelte';
  import katex from 'katex';
  
  const dispatch = createEventDispatcher();
  
  export let messages = [];
  export let chatContainer;
  export let isLoading = false;

  function handleStreamComplete(text, index) {
    dispatch('messageComplete', {
      index,
      text
    });
  }

  function handleShowInfo(event) {
    dispatch('showInfo', event.detail);
  }

  function renderMathInText(text) {
    const regex = /\$\$(.*?)\$\$|\$(.*?)\$/g;
    let lastIndex = 0;
    const parts = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Add text before the math
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      const isDisplayMode = match[1] !== undefined;
      const formula = isDisplayMode ? match[1] : match[2];

      try {
        const html = katex.renderToString(formula, {
          displayMode: isDisplayMode,
          throwOnError: false
        });
        parts.push(html);
      } catch (error) {
        console.error('KaTeX 렌더링 에러:', error);
        parts.push(match[0]);
      }

      lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.join('');
  }
</script>

<div class="space-y-4">
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
            {:else}
              <div class="whitespace-pre-wrap">
                {@html renderMathInText(message.content)}
              </div>
            {/if}
            <p class="text-xs mt-2 opacity-70">
              {message.timestamp.toLocaleTimeString()}
            </p>
          </div>
          
          {#if message.role === 'assistant' && message.contexts?.length > 0}
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