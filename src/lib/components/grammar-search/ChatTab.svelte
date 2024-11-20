<!-- src/lib/components/grammar-search/ChatTab.svelte -->
<script>
  import { searchRelatedContexts, sendChatMessage } from '$lib/services/chatService';
  import ChatInput from './ChatInput.svelte';
  import ToggleSwitch from './ToggleSwitch.svelte';
  import ContextModal from './ContextModal.svelte';
  import ChatMessages from './ChatMessages.svelte';
  
  let messages = [];
  let chatContainer;
  let isLoading = false;
  let relatedContexts = [];
  let showContextModal = false;
  let selectedContexts = null;
  let useContextSearch = true;
  let autoScroll = true;

  function handleScroll(event) {
    if (!chatContainer) return;
    
    const { scrollTop, scrollHeight, clientHeight } = event.target;
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10;
    
    autoScroll = isAtBottom;
  }

  function handleMessageComplete(event) {
    const { index, text } = event.detail;
    messages = messages.map((msg, i) => {
      if (i === index) {
        return {
          ...msg,
          content: text,
          isStreaming: false
        };
      }
      return msg;
    });
  }

  function handleContextModalClose() {
    showContextModal = false;
    selectedContexts = null;
  }

  function handleShowContextInfo(event) {
    selectedContexts = event.detail.contexts;
    showContextModal = true;
  }

  async function handleSubmit(messageText) {
    if (!messageText.trim()) return;

    const userMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    messages = [...messages, userMessage];
    isLoading = true;
    autoScroll = true;

    try {
        let contexts = useContextSearch ? await searchRelatedContexts(messageText) : [];
        relatedContexts = contexts;

        let systemPrompt = "당신은 영어 문법을 설명하는 선생님입니다. ";
        if (useContextSearch && contexts.length > 0) {
            systemPrompt += "다음 참고 자료를 바탕으로 답변해주세요:\n\n";
            contexts.forEach((ctx, i) => {
                systemPrompt += `참고자료 ${i + 1} (${ctx.textbook} ${ctx.unit}):\n${ctx.context}\n\n`;
            });
        }

        const content = await sendChatMessage(systemPrompt, messageText);

        messages = [...messages, {
            role: 'assistant',
            content,
            timestamp: new Date(),
            contexts,
            isStreaming: true
        }];

    } catch (error) {
        console.error('채팅 처리 오류:', error);
        messages = [...messages, {
            role: 'system',
            content: '죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.',
            timestamp: new Date(),
            isError: true
        }];
    } finally {
        isLoading = false;
    }
  }
</script>

<div class="bg-white rounded-lg shadow-md overflow-hidden max-w-4xl mx-auto">
  <div class="border-b border-gray-200 p-4">
    <ToggleSwitch
      bind:checked={useContextSearch}
      id="context-search"
      label="탐색 자료 사용"
      description="교과서 자료를 참고하여 답변합니다"
    />
  </div>

  <ChatMessages
    {messages}
    bind:chatContainer
    {isLoading}
    {autoScroll}
    onShowContextInfo={handleShowContextInfo}
    on:scroll={handleScroll}
    on:messageComplete={handleMessageComplete}
  />

  <ChatInput 
    onSubmit={handleSubmit}
    {isLoading}
  />

  <ContextModal 
    contexts={selectedContexts}
    bind:showModal={showContextModal}
    on:close={handleContextModalClose}
    on:showInfo={handleShowContextInfo}
  />
</div> 