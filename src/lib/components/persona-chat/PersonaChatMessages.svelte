<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import StreamingText from '../adaptive-chat/StreamingText.svelte';
  import { marked } from 'marked';
  import DOMPurify from 'dompurify';
  import type { PersonaChatMessage, PersonaPrompt } from '$lib/types/persona';
  import { personaMessageStyles } from '$lib/config/persona-message-styles';
  import EmbeddingInfoIcon from '../adaptive-chat/EmbeddingInfoIcon.svelte';
  import PromptInfoIcon from './PromptInfoIcon.svelte';
  import PromptModal from './PromptModal.svelte';
  import { prompts } from '$lib/config/persona-prompts';
  
  const dispatch = createEventDispatcher();
  
  export let messages: PersonaChatMessage[] = [];
  export let chatContainer: HTMLElement;
  export let isLoading = false;
  export let autoScroll = true;

  let showPromptModal = false;
  let selectedPromptType: 'learning_tip' | 'emotional_support' | null = null;
  let selectedPrompts: PersonaPrompt[] = [];
  let currentLevel = '';

  function handleStreamComplete(text: string, index: number) {
    dispatch('messageComplete', {
      index,
      text
    });
  }

  function handleShowInfo(event: CustomEvent) {
    dispatch('showInfo', event.detail);
  }

  function handleShowPrompt(event: CustomEvent<{
    type: 'learning_tip' | 'emotional_support';
    prompts: PersonaPrompt[];
    currentLevel: string;
  }>) {
    selectedPromptType = event.detail.type;
    selectedPrompts = event.detail.prompts;
    currentLevel = event.detail.currentLevel;
    showPromptModal = true;
  }

  function handleClosePrompt() {
    showPromptModal = false;
  }

  function getMessageStyle(message: PersonaChatMessage) {
    if (message.isError) {
      return {
        backgroundColor: 'bg-red-100',
        textColor: 'text-red-700',
        icon: 'error'
      };
    }

    if (message.role === 'user') {
      return {
        backgroundColor: 'bg-blue-500',
        textColor: 'text-white',
        icon: 'person'
      };
    }

    const style = personaMessageStyles.find(s => s.type === message.type);
    if (style) {
      return {
        backgroundColor: style.backgroundColor,
        textColor: style.textColor,
        icon: style.icon
      };
    }

    return {
      backgroundColor: 'bg-gray-100',
      textColor: 'text-gray-800',
      icon: 'chat'
    };
  }

  function renderMarkdown(text: string): string {
    const rawHtml = marked.parse(text);
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
      class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in"
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
                {#if message.role === 'user'}
                  <div class="flex items-start gap-2">
                    <p class="whitespace-pre-wrap">{message.content}</p>
                    <EmbeddingInfoIcon on:showInfo={handleShowInfo} />
                  </div>
                {:else}
                  <div class="flex items-start gap-2">
                    <div class="whitespace-pre-wrap prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-headings:my-2" 
                         style="color: inherit;"
                         >{@html renderMarkdown(message.content)}</div>
                    {#if message.level}
                      <PromptInfoIcon
                        type={message.type || 'normal'}
                        currentLevel={message.level}
                        {prompts}
                        on:showPrompt={handleShowPrompt}
                      />
                    {/if}
                  </div>
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

<PromptModal
  bind:showModal={showPromptModal}
  type={selectedPromptType}
  prompts={selectedPrompts}
  currentLevel={currentLevel}
  on:close={handleClosePrompt}
/>

<style>
  .animate-fade-in {
    animation: fadeIn 0.3s ease-in-out;
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