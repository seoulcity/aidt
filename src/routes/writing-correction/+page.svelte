<script>
  import { chatCompletion } from '$lib/clovaStudioService';
  import { onMount } from 'svelte';

  let instruction = '';
  let userInput = '';
  let correctionResults = {
    grammar: '',
    punctuation: '',
    spelling: '',
    capitalization: '',
    vocabulary: '',
    overall: ''
  };
  let isLoading = false;

  const goodExample = "I have a best friend named John. He is very kind and always helps me with my homework. We often play basketball together on weekends. John is good at math and I'm good at English, so we help each other study.";
  const badExample = "i have best friend john. he very kind and always help me with homework. we often play basketball together in weekend. john good at math and im good at english so we help each other study";

  const systemPrompt = `당신은 한국의 중학생을 위한 AI 영어 작문 튜터입니다. 학생의 영어 작문을 다음 기준에 따라 교정하고 평가해야 합니다:
  1. 문법 (Grammar)
  2. 구두점 (Punctuation)
  3. 철자 (Spelling)
  4. 대소문자 (Capitalization)
  5. 어휘 사용 (Vocabulary)

  친근하고 격려하는 방식으로 피드백을 제공하세요. 중학교 수준을 넘어서는 고급 문법은 교정하지 마세요. 

  각 카테고리별로 다음과 같은 형식으로 피드백을 제공하세요:

  [카테고리명]:
  1. 전반적인 평가 (한국어):
     [이 부분에 대한 전반적인 평가를 한국어로 작성하세요.]
  2. 원문 (영어):
     "[원문을 그대로 인용하세요.]"
  3. 수정 제안 (영어):
     [수정된 문장을 작성하세요.]
  4. 설명 (한국어):
     [수정 사항에 대한 설명을 한국어로 작성하세요.]

  예시:
  Grammar:
  1. 전반적인 평가 (한국어):
     문장 구조와 시제 사용이 대체로 양호합니다. 몇 가지 작은 오류가 있지만 쉽게 수정할 수 있습니다.
  2. 원문 (영어):
     "I have best friend john. he very kind and always help me with homework."
  3. 수정 제안 (영어):
     [I have a best friend named John. He is very kind and always helps me with my homework.]
  4. 설명 (한국어):
     'have' 뒤에 부정관사 'a'를 추가했습니다. 'john'은 고유명사이므로 대문자로 시작해야 합니다. 'He'도 문장의 시작이므로 대문자로 썼습니다. 'is'를 추가하여 문장을 완성했고, 3인칭 단수 현재형 'helps'를 사용했습니다. 마지막으로 'my'를 추가하여 의미를 명확히 했습니다.

  이러한 형식으로 각 카테고리(Grammar, Punctuation, Spelling, Capitalization, Vocabulary)에 대한 피드백을 제공하세요. 전체 교정의 경우, 모든 카테고리를 포함한 종합적인 피드백을 제공하세요.`;

  async function handleSubmit(category) {
    if (!userInput.trim()) return;

    isLoading = true;
    try {
      const prompt = `지시문: ${instruction}\n\n학생의 글: ${userInput}\n\n${category} 기준에 따라 글을 교정하고 평가해주세요. 피드백을 자연스러운 한국어로 요약하여 제공해주세요.`;
      const response = await chatCompletion(systemPrompt, prompt);
      correctionResults[category] = response;
    } catch (error) {
      console.error('Error:', error);
      correctionResults[category] = '죄송합니다. 오류가 발생했습니다.';
    } finally {
      isLoading = false;
    }
  }

  function setExample(example) {
    userInput = example;
  }

  onMount(() => {
    instruction = '자신과 자신이 소개하고 싶은 사람에 관해 소개 글을 써 봅시다.';
  });
</script>

<div class="container mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold mb-6">AI 영작문 교정기</h1>

  <div class="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6" role="alert">
    <p class="font-bold">사용 가이드</p>
    <ul class="list-disc list-inside">
      <li>이 페이지는 중학생을 위한 영작문 교정 및 평가 도구입니다.</li>
      <li>지시문에 따라 영어로 문단을 작성해주세요.</li>
      <li>AI가 문법, 구두점, 철자, 대소문자, 어휘 사용을 중심으로 교정합니다.</li>
      <li>중학교 수준에 맞는 피드백을 제공하며, 고등학교 수준의 문법은 교정하지 않습니다.</li>
      <li>평가 결과는 이해하기 쉬운 자연어로 제공됩니다.</li>
    </ul>
  </div>

  <div class="mb-6">
    <label for="instruction" class="block mb-2 font-bold">지시문:</label>
    <input
      id="instruction"
      bind:value={instruction}
      class="w-full p-2 border rounded"
      placeholder="지시문을 입력하세요..."
    />
  </div>

  <div class="mb-6">
    <label for="userInput" class="block mb-2 font-bold">영작문:</label>
    <textarea
      id="userInput"
      bind:value={userInput}
      class="w-full p-2 border rounded h-40"
      placeholder="영작문을 입력하세요..."
    ></textarea>
  </div>

  <div class="mb-6">
    <button
      on:click={() => setExample(goodExample)}
      class="bg-green-500 text-white p-2 rounded mr-2 hover:bg-green-600"
    >
      좋은 예시
    </button>
    <button
      on:click={() => setExample(badExample)}
      class="bg-red-500 text-white p-2 rounded hover:bg-red-600"
    >
      나쁜 예시
    </button>
  </div>

  <div class="mb-6">
    <button
      on:click={() => handleSubmit('grammar')}
      class="bg-blue-500 text-white p-2 rounded mr-2 hover:bg-blue-600"
      disabled={isLoading}
    >
      문법 교정
    </button>
    <button
      on:click={() => handleSubmit('punctuation')}
      class="bg-blue-500 text-white p-2 rounded mr-2 hover:bg-blue-600"
      disabled={isLoading}
    >
      구두점 교정
    </button>
    <button
      on:click={() => handleSubmit('spelling')}
      class="bg-blue-500 text-white p-2 rounded mr-2 hover:bg-blue-600"
      disabled={isLoading}
    >
      철자 교정
    </button>
    <button
      on:click={() => handleSubmit('capitalization')}
      class="bg-blue-500 text-white p-2 rounded mr-2 hover:bg-blue-600"
      disabled={isLoading}
    >
      대소문자 교정
    </button>
    <button
      on:click={() => handleSubmit('vocabulary')}
      class="bg-blue-500 text-white p-2 rounded mr-2 hover:bg-blue-600"
      disabled={isLoading}
    >
      어휘 교정
    </button>
    <button
      on:click={() => handleSubmit('overall')}
      class="bg-green-500 text-white p-2 rounded hover:bg-green-600"
      disabled={isLoading}
    >
      전체 교정
    </button>
  </div>

  {#if isLoading}
    <p class="mt-4">교정 중입니다...</p>
  {:else}
    {#each Object.entries(correctionResults) as [category, result]}
      {#if result}
        <div class="mt-6">
          <h2 class="text-2xl font-bold mb-2">{category} 교정 결과:</h2>
          <div class="bg-gray-100 p-4 rounded whitespace-pre-wrap">
            {result}
          </div>
        </div>
      {/if}
    {/each}
  {/if}
</div>
