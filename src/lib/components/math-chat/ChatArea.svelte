<!-- src/lib/components/math-chat/ChatArea.svelte -->
<script lang="ts">
  import MathChatGuide from './MathChatGuide.svelte';
  import ChatMessages from '../grammar-search/ChatMessages.svelte';
  import ChatInput from '../grammar-search/ChatInput.svelte';
  import SuggestionChips from './SuggestionChips.svelte';

  export let messages: any[] = [];
  export let isLoading: boolean = false;
  export let chatContainer: HTMLElement;
  export let onExampleClick: (question: string) => void;
  export let onSubmit: (message: string) => void;
  export let onMessageComplete: (event: CustomEvent) => void;
  export let chatInput: any;
  export let suggestions: string[] = [];

  $: if (messages.length === 0) {
    suggestions = [
      "이 문제의 핵심 개념이 무엇인가요?",
      "문제 풀이 과정을 단계별로 설명해주세요.",
      "비슷한 유형의 문제를 보여주세요.",
      "이 문제에서 주의해야 할 점은 무엇인가요?",
      "이 개념을 실생활에서는 어떻게 활용할 수 있나요?"
    ];
  }
</script>

<div class="flex-1 bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col min-h-[45vh]">
  {#if messages.length === 0}
    <MathChatGuide 
      {messages} 
      onExampleClick={onExampleClick}
    />
  {/if}
  
  <div class="flex-1 overflow-y-auto px-4 py-2" bind:this={chatContainer}>
    <div class="max-w-3xl mx-auto">
      <ChatMessages
        {messages}
        {chatContainer}
        {isLoading}
        isMathChat={true}
        on:messageComplete={onMessageComplete}
      />
    </div>
  </div>
  
  {#if messages.length > 0 && suggestions.length > 0}
    <SuggestionChips
      {suggestions}
      onChipClick={onExampleClick}
    />
  {/if}
  
  <div class="flex-none border-t border-gray-100 sticky bottom-0 bg-white">
    <div class="max-w-3xl mx-auto">
      <ChatInput 
        bind:this={chatInput}
        onSubmit={onSubmit}
        {isLoading}
      />
    </div>
  </div>
</div> 