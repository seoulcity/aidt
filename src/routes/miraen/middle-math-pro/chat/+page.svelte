<!-- src/routes/miraen/middle-math-pro/chat/+page.svelte -->
<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { slide } from 'svelte/transition';
  import { mathProSupabase } from '$lib/mathProSupabaseClient';
  import ChatMessages from '$lib/components/grammar-search/ChatMessages.svelte';
  import ChatInput from '$lib/components/grammar-search/ChatInput.svelte';
  import { parseXML } from '../utils/xmlParser';
  import MathChatGuide from '$lib/components/math-chat/MathChatGuide.svelte';
  import { renderElement } from '../utils/renderElement';
  import 'katex/dist/katex.min.css';
  import BackButton from '$lib/components/common/BackButton.svelte';
  import LoadingSpinner from '$lib/components/common/LoadingSpinner.svelte';
  import LoadingDots from '$lib/components/common/LoadingDots.svelte';
  import ProblemList from '$lib/components/math-chat/ProblemList.svelte';
  import ProblemDetail from '$lib/components/math-chat/ProblemDetail.svelte';
  import ChatArea from '$lib/components/math-chat/ChatArea.svelte';
  import EmptyState from '$lib/components/math-chat/EmptyState.svelte';
  
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
1. 학생의 이해를 돕기 위해 단계적으로 설명해주세요.
2. 필요한 경우 유사한 예시를 들어 설명해주세요.
3. 문제의 핵심 개념을 강조해주세요.
4. 모든 수식은 반드시 KaTeX 문법으로 작성해주세요:
   - 인라인 수식: $수식$ 형태로 작성 (예: $x^2 + 2x + 1$)
   - 디스플레이 수식: $$수식$$ 형태로 작성 (예: $$\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$)
   - 특수 기호: 
     * 곱하기: \\times (×)
     * 나누기: \\div (÷)
     * 플러스마이너스: \\pm (±)
     * 따라서: \\therefore (∴)
     * 근호: \\sqrt{x}
     * n제곱근: \\sqrt[n]{x}
     * 분수: \\frac{분자}{분모}
     * 괄호: (), [], \\{\\}, \\left( \\right)
     * 삼각함수: \\sin x, \\cos x, \\tan x
5. 학생이 이해하기 쉽도록 친근하고 명확한 용어를 사용해주세요.

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
    <BackButton />
  </div>

  <div class="grid grid-cols-12 gap-6">
    <ProblemList
      {loading}
      {problems}
      {selectedProblem}
      {selectedActivityType}
      {activityTypes}
      {visibleProblems}
      {isLoadingMore}
      {hasMoreProblems}
      onActivityTypeSelect={handleActivityTypeSelect}
      onProblemSelect={selectProblem}
      onScroll={handleScroll}
    />

    <!-- ���제 및 채팅 영역 -->
    <div class="col-span-8 h-[calc(100vh-8rem)] flex flex-col">
      {#if selectedProblem}
        <ProblemDetail
          problem={selectedProblem}
          bind:showAnswer
          bind:showExplanation
        />

        <ChatArea
          {messages}
          {isLoading}
          bind:chatContainer
          bind:chatInput
          onExampleClick={handleExampleClick}
          onSubmit={handleSubmit}
          onMessageComplete={handleMessageComplete}
        />
      {:else}
        <EmptyState />
      {/if}
    </div>
  </div>
</div> 

<style>
  :global(.bbox-highlight) {
    @apply border-2 border-black p-0.5 rounded;
  }
</style> 