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
  
  let userInput = '';
  let result = '';
  let isLoading = false;
  let showPrompt = false;
  let currentExample = null;
  let showCorrected = false;
  let correctedResult = '';
  let isLoadingCorrection = false;

  function setExample(example) {
    userInput = example.answer;
    currentExample = example;
    result = '';  // 평가 결과 초기화
  }

  async function handleSubmit() {
    if (!userInput.trim()) return;
    
    isLoading = true;
    try {
      const response = await chatCompletion(systemPrompt, 
        `${taskPrompt}\n\n학생 답안: ${userInput}`);
      result = response;
    } catch (error) {
      console.error('Error:', error);
      result = '죄송합니다. 오류가 발생했습니다.';
    } finally {
      isLoading = false;
    }
  }

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

      const correctionPrompt = `
학생 답안: ${userInput}

평가 결과: ${result}

모범 답안: ${modelAnswers[taskType].join(' 또는 ')}

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

  {#if currentExample}
    <div class="mb-6 p-4 bg-gray-50 rounded">
      <h4 class="font-bold mb-2">채점 기준 부합 여부:</h4>
      <p class="text-gray-600">{currentExample.evaluation}</p>
    </div>
  {/if}

  <button
    on:click={handleSubmit}
    class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full"
    disabled={isLoading}
  >
    평가하기
  </button>

  {#if isLoading}
    <p class="mt-4">평가 중입니다...</p>
  {:else if result}
    <div class="mt-6 grid grid-cols-2 gap-4">
      <div>
        <h4 class="font-bold mb-2">AI 평가 결과:</h4>
        <div class="bg-gray-50 p-4 rounded whitespace-pre-wrap">
          {result}
        </div>
      </div>
      
      {#if currentExample?.feedback}
        <div>
          <h4 class="font-bold mb-2">희망 피드백:</h4>
          <div class="bg-gray-50 p-4 rounded whitespace-pre-wrap border-l-4 border-blue-500">
            {currentExample.feedback}
          </div>
        </div>
      {/if}
    </div>

    <div class="mt-4">
      <button
        class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 w-full"
        on:click={showCorrectedSentence}
        disabled={isLoadingCorrection}
      >
        수정된 문장 보기
      </button>
      
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