<!-- src/routes/miraen/middle-math-pro/adaptive-chat/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import ChatMessages from '$lib/components/adaptive-chat/ChatMessages.svelte';
  import ChatInput from '$lib/components/adaptive-chat/ChatInput.svelte';
  import ChatGuide from '$lib/components/adaptive-chat/ChatGuide.svelte';
  import MessageClassificationGuide from '$lib/components/adaptive-chat/MessageClassificationGuide.svelte';
  import ForbiddenManagement from '$lib/components/adaptive-chat/ForbiddenManagement.svelte';
  import { AdaptiveChatService } from '$lib/services/adaptiveChatService';
  import type { ChatMessage, ScrollEvent, MessageCompleteEvent } from '$lib/types/chat';
  
  let chatService: AdaptiveChatService;
  let messages: ChatMessage[] = [];
  let chatContainer: HTMLElement;
  let isLoading = false;
  let autoScroll = true;
  let showManagement = false;
  let messageClassificationGuide: MessageClassificationGuide;

  onMount(() => {
    chatService = new AdaptiveChatService();
  });

  function handleForbiddenUpdate() {
    if (messageClassificationGuide) {
      messageClassificationGuide.refreshCategories();
    }
  }

  function handleScroll(event: ScrollEvent) {
    if (!chatContainer) return;
    
    const { scrollTop, scrollHeight, clientHeight } = event.target;
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10;
    
    autoScroll = isAtBottom;
  }

  function handleMessageComplete(event: MessageCompleteEvent) {
    const { index, text } = event.detail;
    chatService.updateStreamingMessage(index, text);
    messages = chatService.getMessages();
  }

  async function handleSubmit(messageText: string) {
    if (!messageText.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };
    messages = [...messages, userMessage];
    
    isLoading = true;
    await chatService.sendMessage(messageText);
    messages = chatService.getMessages();
    isLoading = chatService.getLoadingState();
    autoScroll = true;
  }

  function handleExampleClick(text: string) {
    handleSubmit(text);
  }

  $: messages = chatService?.getMessages() || [];
  $: isLoading = chatService?.getLoadingState() || false;
</script>

<div class="flex h-[100vh]">
  <div class="flex-1 flex flex-col">
    <header class="flex-none py-4 px-4 bg-white border-b border-gray-200">
      <div class="flex items-center justify-between">
        <h1 class="text-3xl font-bold">맞춤형 답변 챗봇</h1>
        <div class="flex items-center gap-4">
          <a href="/" class="text-blue-500 hover:underline">← 돌아가기</a>
          <button
            class="flex items-center gap-1 text-gray-600 hover:text-gray-800"
            on:click={() => showManagement = !showManagement}
          >
            <span class="material-symbols-rounded">settings</span>
            금칙어 관리
          </button>
        </div>
      </div>
    </header>

    <main class="flex-1 container mx-auto px-4 py-4 overflow-hidden">
      <div class="h-full bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
        <MessageClassificationGuide bind:this={messageClassificationGuide} />
        
        <ChatGuide {messages} onExampleClick={handleExampleClick} />
        
        <div class="flex-1 min-h-0">
          <ChatMessages
            {messages}
            bind:chatContainer
            {isLoading}
            {autoScroll}
            on:scroll={handleScroll}
            on:messageComplete={handleMessageComplete}
          />
        </div>

        <ChatInput 
          onSubmit={handleSubmit}
          {isLoading}
        />
      </div>
    </main>
  </div>

  {#if showManagement}
    <ForbiddenManagement 
      {chatService} 
      on:update={handleForbiddenUpdate}
    />
  {/if}
</div> 