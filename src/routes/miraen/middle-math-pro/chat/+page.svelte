<!-- src/routes/miraen/middle-math-pro/chat/+page.svelte -->
<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { mathProSupabase } from '$lib/mathProSupabaseClient';
  import ProblemCard from '../components/ProblemCard.svelte';
  import ChatMessages from '$lib/components/grammar-search/ChatMessages.svelte';
  import ChatInput from '$lib/components/grammar-search/ChatInput.svelte';
  import { parseXML } from '../utils/xmlParser';
  import MathChatGuide from '$lib/components/math-chat/MathChatGuide.svelte';
  
  let messages = [];
  let chatContainer;
  let isLoading = false;
  let autoScroll = true;
  let selectedProblem = null;
  let problems = [];
  let loading = true;
  let chatInput;

  onMount(async () => {
    console.log('Component mounted');
    const classOrderTitle = $page.url.searchParams.get('class');
    console.log('Class order title:', classOrderTitle);
    
    // Load all problems regardless of class order title
    await loadProblems();
  });

  async function loadProblems(classOrderTitle) {
    try {
      console.log('Loading problems...');
      const { data, error } = await mathProSupabase
        .from('problems')
        .select('*');

      if (error) throw error;
      
      console.log('Loaded problems:', data);
      problems = data;
    } catch (err) {
      console.error('문제 로딩 에러:', err);
    } finally {
      loading = false;
    }
  }

  function selectProblem(problem) {
    selectedProblem = problem;
    // 초기 메시지 제거
    messages = [];
  }

  async function handleSubmit(messageText) {
    if (!messageText.trim() || !selectedProblem) return;

    const userMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    messages = [...messages, userMessage];
    isLoading = true;
    autoScroll = true;

    try {
      // 문제와 해설을 더 구조화된 형태로 컨텍스트에 포함
      const systemPrompt = `
당신은 수학 문제를 설명하는 선생님입니다. 다음 문제와 해설을 참고하여 학생의 질문에 답변해주세요:

[문제 정보]
- 에피소드: ${selectedProblem.episode}
- 활동 유형: ${selectedProblem.activity_category}

[문제 내용]
${parseXML(selectedProblem.problem)
  .filter(el => el.type !== 'input')
  .map(el => el.text || '')
  .join('\n')}

[문제 해설]
${selectedProblem.explanation}

[답변 지침]
1. 학생의 이해를 돕기 위해 단계적으로 설명해주세요.
2. 필요한 경우 유사한 예시를 들어 설명해주세요.
3. 문제의 핵심 개념을 강조해주세요.
4. 수식이 기호가 포함된 경우 LaTeX 형식으로 작성해주세요.
5. 학생이 이해하기 쉽도록 친근하고 명확한 언어를 사용해주세요.

[현재 질문]
${messageText}
`;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          systemPrompt,
          userMessage: messageText
        })
      });

      if (!response.ok) {
        throw new Error('API 응답 오류: ' + response.statusText);
      }

      const data = await response.json();
      
      messages = [...messages, {
        role: 'assistant',
        content: data.content,
        timestamp: new Date(),
        isStreaming: true,
        contexts: [{
          textbook: selectedProblem.textbook || '중등 수학',
          unit: selectedProblem.episode,
          context: selectedProblem.explanation
        }]
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

  function handleScroll(event) {
    if (!chatContainer) return;
    const { scrollTop, scrollHeight, clientHeight } = event.target;
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10;
    autoScroll = isAtBottom;
  }

  function handleExampleClick(question) {
    if (chatInput) {
      chatInput.setValue(question);
    }
  }
</script>

<div class="container mx-auto px-4 py-8 max-w-6xl">
  <div class="mb-8">
    <a href="/miraen/middle-math-pro" class="text-blue-500 hover:underline">
      ← 돌아가기
    </a>
  </div>

  <div class="grid grid-cols-12 gap-6">
    <!-- 문제 목록 -->
    <div class="col-span-4 bg-white rounded-lg shadow-md p-4 h-[calc(100vh-12rem)] overflow-y-auto">
      <h2 class="text-xl font-bold mb-4">문제 목록</h2>
      {#if loading}
        <div class="flex justify-center items-center h-32">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      {:else}
        <div class="space-y-4">
          {#each problems as problem}
            <button
              class="w-full text-left p-4 rounded-lg transition-colors duration-200
                     {selectedProblem?.id === problem.id ? 
                       'bg-blue-100 border-2 border-blue-500' : 
                       'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'}"
              on:click={() => selectProblem(problem)}
            >
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-600">
                  {problem.episode}
                </span>
                <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {problem.activity_category}
                </span>
              </div>
              <div class="text-sm">
                {@html parseXML(problem.problem)
                  .filter(el => el.type !== 'input')
                  .map(el => el.text || '')
                  .join(' ')
                  .substring(0, 100)}...
              </div>
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <!-- 채팅 영역 -->
    <div class="col-span-8">
      {#if selectedProblem}
        <div class="bg-white rounded-lg shadow-md mb-6">
          <ProblemCard problem={selectedProblem} />
        </div>
        
        <div class="bg-white rounded-lg shadow-md">
          <MathChatGuide 
            {messages} 
            onExampleClick={handleExampleClick} 
          />
          
          <ChatMessages
            {messages}
            bind:chatContainer
            {isLoading}
            {autoScroll}
            on:scroll={handleScroll}
            on:messageComplete={handleMessageComplete}
          />
          
          <ChatInput 
            bind:this={chatInput}
            onSubmit={handleSubmit}
            {isLoading}
          />
        </div>
      {:else}
        <div class="bg-white rounded-lg shadow-md p-8 text-center text-gray-600">
          <p class="text-lg mb-4">👈 왼쪽에서 문제를 선택해주세요</p>
          <p class="text-sm">선택한 문제에 대해 질문하고 답변을 받을 수 있습니다.</p>
        </div>
      {/if}
    </div>
  </div>
</div> 