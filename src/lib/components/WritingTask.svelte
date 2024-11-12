<!-- src/lib/components/WritingTask.svelte -->
<script>
  import { chatCompletion } from '$lib/clovaStudioService';
  import { modelAnswers } from '$lib/examples/modelAnswers';
  
  export let title = '';
  export let description = '';
  export let examples = [];
  export let systemPrompt = '';
  export let taskPrompt = '';
  export let problem = '';
  export let taskType = 'sentence';
  export let activeTab = '';
  export let evaluationAreas = [];
  
  let userInput = '';
  let result = '';
  let isLoading = false;
  let showPrompt = false;
  let currentExample = null;
  let showCorrected = false;
  let correctedResult = '';
  let isLoadingCorrection = false;
  let lastEvaluatedInput = '';

  function setExample(example) {
    userInput = example.answer;
    currentExample = example;
    result = '';  // 평가 결과 초기화
    showCorrected = false;
    correctedResult = '';
    lastEvaluatedInput = '';
  }

  async function handleSubmit() {
    if (!userInput.trim()) return;
    
    isLoading = true;
    try {
      const response = await chatCompletion(systemPrompt, 
        `${taskPrompt}\n\n학생 안: ${userInput}`);
      result = response;
      lastEvaluatedInput = userInput;
    } catch (error) {
      console.error('Error:', error);
      result = '죄송합니다. 오류가 발생했습니다.';
    } finally {
      isLoading = false;
    }
  }

  $: inputChanged = userInput !== lastEvaluatedInput;

  async function showCorrectedSentence() {
    if (!userInput.trim() || !result) return;
    
    isLoadingCorrection = true;
    showCorrected = true;
    
    try {
      const correctionSystemPrompt = `당신은 영어 문장 교정 전문가입니다.
학생의 답안과 모범답안을 비교하여 HTML 형식으로 차이점을 시각적으로 표시해주세요.

출력 형식:
1. 수정이 필요한 부분은 <del> 태그로 표시
2. 수정된/추가된 부분은 <ins> 태그로 표시
3. 원본과 수정본을 구분하여 표시
4. 수정 사항에 대한 설명 포함

예시:
<div class="original">
  입력 답안: I <del>go</del> to school.
</div>
<div class="corrected">
  수정된 답안: I <ins>went</ins> to school.
</div>
<div class="explanation">
  과거 시제로 수정되었습니다.
</div>`;

      let modelAnswer = '';
      if (taskType === 'elementary') {
        modelAnswer = modelAnswers.elementary[activeTab]?.join(' 또는 ') || '모범 답안이 준비되지 않았습니다';
      } else {
        modelAnswer = modelAnswers[taskType]?.join(' 또는 ') || '모범 답안이 준비되지 않았습니다';
      }

      const correctionPrompt = `
학생 답안: ${userInput}

평가 결과: ${result}

모범 답안: ${modelAnswer}

위 내용을 바탕으로 학생 답안과 모범 답안을 비교하여 수정이 필요한 부분을 표시하고, 
수정된 답안과 함께 수정 사항에 대한 설명을 제공해주세요.

응답은 반드시 HTML 태그를 사용하여 다음 형식으로 작성해주세요:
<div class="original">
  입력 답안: [원래 답안을 del과 ins 태그를 사용하여 표시]
</div>
<div class="corrected">
  수정된 답안: [완전한 수정 답안]
</div>
<div class="explanation">
  [수정 사항에 대한 설명]
</div>`;

      const response = await chatCompletion(correctionSystemPrompt, correctionPrompt);
      correctedResult = response;
    } catch (error) {
      console.error('Error:', error);
      correctedResult = '죄송합니다. 수정된 문장을 생성하는 중 오류가 발생했습니다.';
    } finally {
      isLoadingCorrection = false;
    }
  }

  // result가 변경될 때마다 수정된 문장 보기 상태 초기화
  $: if (result) {
    showCorrected = false;
    correctedResult = '';
  }
</script>

<div class="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6 mb-6">
  <h2 class="text-2xl font-bold mb-4">{title}</h2>
  <p class="mb-6 text-gray-600">{description}</p>

  {#if problem}
    <div class="mb-6 p-4 bg-blue-50 rounded">
      <h3 class="font-bold mb-2">문제</h3>
      <pre class="whitespace-pre-wrap">{problem}</pre>
    </div>
  {/if}

  <div class="mb-6">
    <button
      class="text-sm text-gray-500 hover:text-gray-700"
      on:click={() => showPrompt = !showPrompt}
    >
      {showPrompt ? '프롬프트 설명 숨기기' : '프롬프트 설명 보기'}
    </button>
    
    {#if showPrompt}
      <div class="mt-2 p-4 bg-gray-50 rounded text-sm">
        <p class="font-bold">System Prompt:</p>
        <pre class="whitespace-pre-wrap">{systemPrompt}</pre>
        <p class="font-bold mt-2">Task Prompt:</p>
        <pre class="whitespace-pre-wrap">{taskPrompt}</pre>
      </div>
    {/if}
  </div>

  <div class="mb-6">
    <label class="block mb-2 font-bold">예시 답안:</label>
    <div class="flex flex-wrap gap-2">
      {#each examples as example}
        <button
          on:click={() => setExample(example)}
          class="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded text-sm"
        >
          예시 {example.id}
          <span class="text-gray-400 text-xs">
            ({example.evaluation})
          </span>
        </button>
      {/each}
    </div>
  </div>

  <div class="mb-6">
    <label for="userInput" class="block mb-2 font-bold">답안 작성:</label>
    <textarea
      id="userInput"
      bind:value={userInput}
      class="w-full p-2 border rounded h-40"
      placeholder="답안을 입력하세요..."
    ></textarea>
  </div>

  {#if currentExample && userInput === currentExample.answer}
    <div class="mb-6 p-4 bg-gray-50 rounded">
      <h4 class="font-bold mb-2">예시 답안의 채점 기준 부합 여부</h4>
      <div class="text-gray-600 mb-2">{currentExample.evaluation}</div>
      <div class="text-sm text-gray-500 mt-2">
        <p class="italic">* 이는 예시 {currentExample.id}번 답안에 대해 사전에 정의된 평가 결과입니다</p>
      </div>
    </div>
  {:else if currentExample}
    <div class="mb-6 p-4 bg-yellow-50 rounded">
      <div class="text-sm text-yellow-700">
        <p>* 예시 답안이 수정되어 사전 정의된 평가 결과를 확인할 수 없습니다</p>
        <p>* 평가하기 버튼을 눌러 AI 평가를 받아보세요</p>
      </div>
    </div>
  {/if}

  <button
    on:click={handleSubmit}
    class={`w-full px-4 py-2 rounded flex items-center justify-center ${
      isLoading || (!inputChanged && result)
        ? 'bg-gray-400 cursor-not-allowed'
        : 'bg-blue-500 hover:bg-blue-600'
    } text-white`}
    disabled={isLoading || (!inputChanged && result)}
  >
    {#if isLoading}
      <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      평가 중...
    {:else if !inputChanged && result}
      평가 완료
    {:else}
      평가하기
    {/if}
  </button>

  {#if isLoading}
    <div class="mt-4 text-center text-gray-600">
      AI가 답안을 평가하고 있습니다. 잠시만 기다려주세요...
    </div>
  {:else if result}
    <div class="mt-6">
      <h4 class="font-bold mb-4 text-xl text-blue-700">평가 결과</h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- AI 평가 결과 -->
        <div class="space-y-4">
          <h5 class="font-semibold text-blue-800 mb-2">AI 평가</h5>
          {#if result.includes('평가:')}
            {@const [beforeEval, ...rest] = result.split('평가:')}
            {@const [evaluation, ...remaining] = rest.join('평가:').split('피드백:')}
            
            {#if beforeEval.trim()}
              <div class="bg-gray-50 p-4 rounded whitespace-pre-wrap">
                {beforeEval}
              </div>
            {/if}
            
            <div class="bg-blue-50 p-4 rounded">
              <h6 class="font-semibold text-blue-800 mb-2">평가</h6>
              <div class="whitespace-pre-wrap">{evaluation}</div>
            </div>
            
            {#if remaining.length > 0}
              <div class="bg-green-50 p-4 rounded">
                <h6 class="font-semibold text-green-800 mb-2">피드백</h6>
                <div class="whitespace-pre-wrap">{remaining.join('피드백:')}</div>
              </div>
            {/if}
          {:else}
            <div class="bg-gray-50 p-4 rounded whitespace-pre-wrap">
              {result}
            </div>
          {/if}
        </div>

        <!-- 희망 피드백 -->
        {#if currentExample?.feedback}
          <div class="space-y-4">
            <h5 class="font-semibold text-purple-800 mb-2">희망 피드백</h5>
            <div class="bg-purple-50 p-4 rounded whitespace-pre-wrap border-l-4 border-purple-300">
              <div class="mb-2 text-sm text-purple-600">
                예시 {currentExample.id}번 답안에 대한 희망 피드백
              </div>
              <div class="text-purple-900">
                {currentExample.feedback}
              </div>
            </div>
            <div class="text-sm text-gray-500">
              <p class="italic mb-1">* 이는 사전에 준비된 예시 답안에 대한 희망 피드백입니다</p>
              <p>* AI 평가와 비교하여 참고해 주세요</p>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <div class="mt-6">
      {#if currentExample?.id === 1}
        <div class="text-gray-500 text-center mb-2">
          이미 정답인 예시입니다. 다른 예시를 선택하여 수정된 문장을 확인해보세요.
        </div>
        <button
          class="bg-gray-400 text-white px-4 py-2 rounded w-full cursor-not-allowed"
          disabled
        >
          수정된 문장 보기
        </button>
      {:else}
        <button
          class={`w-full px-4 py-2 rounded ${
            showCorrected || isLoadingCorrection
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-600'
          } text-white`}
          on:click={showCorrectedSentence}
          disabled={showCorrected || isLoadingCorrection}
        >
          {#if isLoadingCorrection}
            <div class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              수정된 문장 생성 중...
            </div>
          {:else if showCorrected}
            수정 완료
          {:else}
            수정된 문장 보기
          {/if}
        </button>
      {/if}
      
      {#if isLoadingCorrection}
        <p class="mt-4">수정된 문장을 생성하는 중입니다...</p>
      {:else if showCorrected && correctedResult}
        <div class="mt-4 p-4 bg-green-50 rounded">
          <h4 class="font-bold mb-4">수정 사항 비교:</h4>
          {@html correctedResult}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  :global(del) {
    color: #ef4444;
    background-color: #fee2e2;
    text-decoration: line-through;
  }

  :global(ins) {
    color: #22c55e;
    background-color: #dcfce7;
    text-decoration: none;
  }

  :global(.original), :global(.corrected) {
    margin: 1rem 0;
    padding: 0.5rem;
    border-radius: 0.25rem;
  }

  :global(.original) {
    background-color: #fef3c7;
  }

  :global(.corrected) {
    background-color: #ecfdf5;
  }

  :global(.explanation) {
    margin-top: 1rem;
    padding: 0.5rem;
    background-color: #e0f2fe;
    border-radius: 0.25rem;
    color: #0369a1;
  }
</style> 