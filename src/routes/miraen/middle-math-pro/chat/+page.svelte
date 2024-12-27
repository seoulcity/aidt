<!-- src/routes/miraen/middle-math-pro/chat/+page.svelte -->
<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { slide } from 'svelte/transition';
  import { mathProSupabase } from '$lib/mathProSupabaseClient';
  import ChatInput from '$lib/components/grammar-search/ChatInput.svelte';
  import { parseXML } from '../utils/xmlParser';
  import MathChatGuide from '$lib/components/math-chat/MathChatGuide.svelte';
  import MathChatMessages from '$lib/components/math-chat/MathChatMessages.svelte';
  import { renderElement } from '../utils/renderElement';
  import 'katex/dist/katex.min.css';
  
  let messages = [];
  let chatContainer;
  let isLoading = false;
  let selectedProblem = null;
  let problems = [];
  let loading = true;
  let chatInput;
  let selectedActivityType = '전체';
  let activityTypes = ['전체'];
  let showAnswer = false;
  let showExplanation = false;
  let pageSize = 15;
  let visibleProblems = [];
  let isLoadingMore = false;
  let hasMoreProblems = true;

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
      // 문제 유형 목록 추출
      activityTypes = ['전체', ...new Set(data.map(p => p.activity_category))];
    } catch (err) {
      console.error('문제 로딩 에러:', err);
    } finally {
      loading = false;
    }
  }

  // 필터링된 문제 목록을 반환하는 함수
  $: filteredProblems = selectedActivityType === '전체' 
    ? problems 
    : problems.filter(p => p.activity_category === selectedActivityType);

  $: {
    // 필터가 변경될 때마다 visible problems 초기화
    visibleProblems = filteredProblems.slice(0, pageSize);
    hasMoreProblems = filteredProblems.length > pageSize;
  }

  async function loadMoreProblems() {
    if (isLoadingMore || !hasMoreProblems) return;
    
    isLoadingMore = true;
    await new Promise(resolve => setTimeout(resolve, 300)); // 자연스러운 로딩 효과를 위한 지연

    const currentLength = visibleProblems.length;
    const nextBatch = filteredProblems.slice(currentLength, currentLength + pageSize);
    
    if (nextBatch.length > 0) {
      visibleProblems = [...visibleProblems, ...nextBatch];
      hasMoreProblems = filteredProblems.length > visibleProblems.length;
    } else {
      hasMoreProblems = false;
    }
    
    isLoadingMore = false;
  }

  function handleScroll(event) {
    const target = event.target;
    const threshold = 100; // 스크롤이 바닥에서 100px 떨어진 시점에서 로드 시작
    
    if (target.scrollHeight - (target.scrollTop + target.clientHeight) < threshold) {
      loadMoreProblems();
    }
  }

  function handleActivityTypeSelect(type) {
    selectedActivityType = type;
    visibleProblems = filteredProblems.slice(0, pageSize);
    hasMoreProblems = filteredProblems.length > pageSize;
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
1. 학생의 이해를 돕기 위해 단계적으로 설명��주세요.
2. 필요한 경우 유사한 예시를 들어 설명해주세요.
3. 문제의 핵심 개념을 강조해주세요.
4. 모든 수식은 반드시 KaTeX 문법으로 작성해주세요:
   - 모든 수식은 반드시 $ 또는 $$ 기호로 감싸서 표현해야 합니다
   - 단순한 숫자나 변수도 반드시 $2$, $x$ 와 같이 표현해야 합니다
   - 인라인 수식: $수식$ 형태로 작성 (예: $x^2 + 2x + 1$)
   - 디스플레이 수식: $$수식$$ 형태로 작성 (예: $$\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$)
   - 특수 기호: \\times (×), \\div (÷), \\pm (±), \\therefore (∴) 등
   - 분수: \\frac{분자}{분모}
   - 제곱: x^2, x^n
   - 루트: \\sqrt{x}, \\sqrt[n]{x}
   - 괄호: (), [], \\{\\}, \\left( \\right)
   - 삼각함수: \\sin x, \\cos x, \\tan x
   - 각도: $90^\\circ$, $180^\\circ$ 등
   - 부등호: $\\leq$, $\\geq$, $\\neq$ 등
5. 학생이 이해하기 쉽도록 친근하고 명확한 용어를 사용해주세요.
6. 답변에서 수식이나 숫자를 언급할 때는 반드시 KaTeX 문법을 사용해야 합니다.

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

  function handleExampleClick(question) {
    if (chatInput) {
      chatInput.setValue(question);
    }
  }
</script>

<div class="container mx-auto px-4 py-8 max-w-7xl">
  <div class="mb-4">
    <a href="/miraen/middle-math-pro" class="text-blue-500 hover:underline inline-flex items-center gap-1">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      돌아가기
    </a>
  </div>

  <div class="grid grid-cols-12 gap-6">
    <!-- 문제 목록 패널 -->
    <div class="col-span-4 bg-white rounded-lg shadow-sm border border-gray-100 h-[calc(100vh-8rem)] flex flex-col">
      <div class="p-4 border-b border-gray-100">
        <h2 class="text-lg font-medium text-gray-900">문제 목록</h2>
        <!-- 필터 섹션 추가 -->
        <div class="mt-3 flex flex-wrap gap-2">
          {#each activityTypes as type}
            <button
              class="px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 
                {selectedActivityType === type 
                  ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-500 ring-offset-2' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
              on:click={() => handleActivityTypeSelect(type)}
            >
              {type}
            </button>
          {/each}
        </div>
      </div>
      
      <div class="flex-1 overflow-y-auto p-4" on:scroll={handleScroll}>
        {#if loading}
          <div class="flex justify-center items-center h-32">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        {:else}
          <div class="space-y-3">
            {#each visibleProblems as problem}
              <button
                class="w-full text-left p-3 rounded-lg transition-colors duration-200 border-2
                       {selectedProblem?.id === problem.id ? 
                         'border-blue-500 bg-blue-50' : 
                         'border-transparent hover:bg-gray-50'}"
                on:click={() => selectProblem(problem)}
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium text-gray-900">
                    {problem.episode}
                  </span>
                  <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {problem.activity_category}
                  </span>
                </div>
                <div class="text-sm text-gray-600 line-clamp-2">
                  {#each parseXML(problem.problem)
                    .filter(el => el.type !== 'input')
                    .slice(0, 3) as element}
                    {@html renderElement(element)}
                  {/each}...
                </div>
              </button>
            {/each}

            {#if isLoadingMore}
              <div class="py-4 flex justify-center items-center space-x-2">
                <div class="animate-bounce w-2 h-2 bg-blue-500 rounded-full"></div>
                <div class="animate-bounce w-2 h-2 bg-blue-500 rounded-full" style="animation-delay: 0.2s"></div>
                <div class="animate-bounce w-2 h-2 bg-blue-500 rounded-full" style="animation-delay: 0.4s"></div>
              </div>
            {/if}

            {#if !hasMoreProblems && visibleProblems.length > 0}
              <div class="py-4 text-center text-gray-500 text-sm">
                모든 문제를 모두 로딩했습니다
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>

    <!-- 문제 및 채팅 영역 -->
    <div class="col-span-8 h-[calc(100vh-8rem)] flex flex-col">
      {#if selectedProblem}
        <div class="flex-none mb-4 grid grid-cols-2 gap-4 max-h-[40vh] overflow-y-auto">
          <!-- 문제 영역 -->
          <div>
            <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
              <h3 class="font-medium text-gray-900 mb-3">문제</h3>
              <div class="bg-gray-50 rounded-lg p-4">
                {#each parseXML(selectedProblem.problem) as element}
                  {@html renderElement(element)}
                {/each}
              </div>
            </div>
          </div>
          
          <!-- 정답/해설 영역 -->
          <div class="space-y-4">
            <!-- 정답 섹션 -->
            <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
              <button
                class="w-full flex items-center justify-between text-left mb-3"
                on:click={() => showAnswer = !showAnswer}
                aria-expanded={showAnswer}
              >
                <h3 class="font-medium text-gray-900">정답</h3>
                <svg
                  class="w-5 h-5 text-gray-500 transform transition-transform {showAnswer ? 'rotate-180' : ''}"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {#if showAnswer}
                <div class="bg-gray-50 rounded-lg p-4" transition:slide>
                  {#each parseXML(selectedProblem.correct_answer) as element}
                    {@html renderElement(element)}
                  {/each}
                </div>
              {/if}
            </div>

            <!-- 해설 섹션 -->
            <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
              <button
                class="w-full flex items-center justify-between text-left mb-3"
                on:click={() => showExplanation = !showExplanation}
                aria-expanded={showExplanation}
              >
                <h3 class="font-medium text-gray-900">해설</h3>
                <svg
                  class="w-5 h-5 text-gray-500 transform transition-transform {showExplanation ? 'rotate-180' : ''}"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {#if showExplanation}
                <div class="bg-gray-50 rounded-lg p-4" transition:slide>
                  {#each parseXML(selectedProblem.explanation) as element}
                    {@html renderElement(element)}
                  {/each}
                </div>
              {/if}
            </div>
          </div>
        </div>
        
        <div class="flex-1 bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col min-h-[45vh]">
          <MathChatGuide 
            {messages} 
            onExampleClick={handleExampleClick}
          />
          
          <div class="flex-1 overflow-y-auto px-4 py-2" bind:this={chatContainer}>
            <div class="max-w-3xl mx-auto">
              <MathChatMessages
                {messages}
                {chatContainer}
                {isLoading}
                on:messageComplete={handleMessageComplete}
              />
            </div>
          </div>
          
          <div class="flex-none border-t border-gray-100 sticky bottom-0 bg-white">
            <div class="max-w-3xl mx-auto">
              <ChatInput 
                bind:this={chatInput}
                onSubmit={handleSubmit}
                {isLoading}
              />
            </div>
          </div>
        </div>
      {:else}
        <div class="flex items-center justify-center h-full bg-white rounded-lg shadow-sm border border-gray-100 p-8">
          <div class="text-center">
            <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-lg text-gray-900 font-medium mb-2">문제를 선택해주세요</p>
            <p class="text-sm text-gray-600">왼쪽 목록에서 문제를 선택하면 채팅이 시작됩니다</p>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div> 

<style>
  :global(.bbox-highlight) {
    @apply border-2 border-black p-0.5 rounded;
  }
</style> 