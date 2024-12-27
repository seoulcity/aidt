<!-- src/lib/components/math-chat/ChatArea.svelte -->
<script lang="ts">
  import MathChatGuide from './MathChatGuide.svelte';
  import ChatMessages from '../grammar-search/ChatMessages.svelte';
  import ChatInput from '../grammar-search/ChatInput.svelte';

  export let messages: any[] = [];
  export let isLoading: boolean = false;
  export let chatContainer: HTMLElement;
  export let onExampleClick: (question: string) => void;
  export let onSubmit: (message: string) => void;
  export let onMessageComplete: (event: CustomEvent) => void;
  export let chatInput: any;
</script>

<div class="flex-1 bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col min-h-[45vh]">
  <MathChatGuide 
    {messages} 
    onExampleClick={onExampleClick}
  />
  
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