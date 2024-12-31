<!-- src/lib/components/adaptive-chat/ChatMessages.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import StreamingText from './StreamingText.svelte';
  import { messageStyles } from '$lib/config/message-styles';
  import { marked } from 'marked';
  import DOMPurify from 'dompurify';
  import type { ChatMessage } from '$lib/types/chat';
  import InfoIcon from '../grammar-search/InfoIcon.svelte';
  
  const dispatch = createEventDispatcher();
  
  export let messages: ChatMessage[] = [];
  export let chatContainer: HTMLElement;
  export let isLoading = false;
  export let autoScroll = true;
  
  let messageToExplode: number | null = null;

  function handleStreamComplete(text: string, index: number) {
    dispatch('messageComplete', {
      index,
      text
    });
  }

  function handleShowInfo(event: CustomEvent) {
    dispatch('showInfo', event.detail);
  }

  function handleForbiddenMessage(index: number) {
    if (messages[index]?.forbiddenInfo) {
      setTimeout(() => {
        messageToExplode = index;
      }, 3000);
    }
  }

  $: {
    if (messages.length > 0) {
      const lastIndex = messages.length - 1;
      const lastMessage = messages[lastIndex];
      if (lastMessage.forbiddenInfo && !lastMessage.isDeleted) {
        handleForbiddenMessage(lastIndex - 1);
      }
      if (autoScroll && chatContainer) {
        setTimeout(() => {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }, 0);
      }
    }
  }

  function handleScroll(event: CustomEvent<{ target: HTMLElement }>) {
    const target = event.detail.target;
    const isAtBottom = Math.abs(target.scrollHeight - target.clientHeight - target.scrollTop) < 10;
    autoScroll = isAtBottom;
  }

  function getMessageStyle(message: ChatMessage) {
    if (message.role === 'user') {
      return {
        backgroundColor: 'bg-blue-500',
        textColor: 'text-white'
      };
    }

    if (message.isError) {
      return {
        backgroundColor: 'bg-red-100',
        textColor: 'text-red-700'
      };
    }

    const style = messageStyles.find(s => s.type === message.type) || messageStyles[0];
    return {
      backgroundColor: style.backgroundColor,
      textColor: style.textColor,
      icon: style.icon
    };
  }

  function renderMarkdown(text: string): string {
    const rawHtml = marked(text);
    return DOMPurify.sanitize(rawHtml);
  }
</script>

<div 
  bind:this={chatContainer}
  class="h-full overflow-y-auto p-4 space-y-4
         [scrollbar-width:thin] [scrollbar-color:rgba(156,163,175,0.5)_transparent]
         [&::-webkit-scrollbar]:w-[6px]
         [&::-webkit-scrollbar-track]:bg-transparent
         [&::-webkit-scrollbar-thumb]:bg-scrollbar
         [&::-webkit-scrollbar-thumb]:rounded"
  on:scroll
>
  {#each messages as message, i}
    {@const style = getMessageStyle(message)}
    <div 
      class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in
             {messageToExplode === i ? 'animate-explode' : ''}"
    >
      <div class="relative max-w-[80%] rounded-lg p-3 {style.backgroundColor} {style.textColor}">
        <div class="flex items-start">
          {#if message.role === 'assistant' && !message.isError && style.icon}
            <span class="material-symbols-rounded mr-2 text-sm">{style.icon}</span>
          {/if}
          <div class="flex-grow">
            {#if message.isStreaming}
              <StreamingText
                text={message.content}
                {chatContainer}
                {autoScroll}
                onComplete={(text) => handleStreamComplete(text, i)}
              />
            {:else}
              <div class="flex items-start">
                {#if message.role === 'assistant'}
                  <div class="whitespace-pre-wrap prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-headings:my-2" 
                       style="color: inherit;"
                       >{@html renderMarkdown(message.content)}</div>
                {:else}
                  <div class="flex items-start gap-2">
                    <p class="whitespace-pre-wrap">{message.content}</p>
                    {#if message.analysisInfo}
                      <InfoIcon
                        contexts={message.analysisInfo.reasons.map(reason => ({
                          category: reason.type === 'harmful' ? '자살/자해 감지' : 
                                   reason.type === 'violent' ? '반사회적/폭력적 내용 감지' :
                                   reason.type === 'distraction' ? '학습 방해 요소 감지' :
                                   reason.type === 'hate' ? '혐오 표현 감지' : '',
                          keyword: reason.reason,
                          details: reason.helpline || reason.suggestions
                        }))}
                        on:showInfo={handleShowInfo}
                      />
                    {/if}
                  </div>
                {/if}
                {#if message.forbiddenInfo}
                  <InfoIcon
                    contexts={[{
                      category: message.forbiddenInfo.category,
                      keyword: message.forbiddenInfo.keyword
                    }]}
                    on:showInfo={handleShowInfo}
                  />
                {/if}
              </div>
            {/if}
            <p class="text-xs mt-2 opacity-70">
              {message.timestamp.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  {/each}
  
  {#if isLoading}
    <div class="flex justify-start">
      <div class="relative max-w-[80%] rounded-lg p-3 bg-gray-100">
        <div class="flex items-center space-x-2">
          <span class="material-symbols-rounded text-gray-600">smart_toy</span>
          <div class="flex space-x-1">
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0s"></div>
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .animate-fade-in {
    animation: fadeIn 0.3s ease-in-out;
  }

  .animate-explode {
    animation: explode 0.5s ease-out forwards;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes explode {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.2);
    }
    100% {
      transform: scale(0);
      opacity: 0;
    }
  }

  :global(.prose) {
    color: inherit;
  }

  :global(.prose strong) {
    color: inherit;
    font-weight: 600;
  }

  :global(.prose code) {
    color: inherit;
    background-color: rgba(0, 0, 0, 0.1);
    padding: 0.2em 0.4em;
    border-radius: 0.25em;
  }
</style> 