<!-- src/routes/miraen/elementary-writing/+page.svelte -->
<script>
  import { elementaryExamples, elementaryTasks, systemPromptTemplate } from '$lib/examples/elementaryExamples';
  import WritingTask from '$lib/components/WritingTask.svelte';
  import BrandingBeta from '$lib/components/BrandingBeta.svelte';

  let activeTab = 'name';

  function getTaskData(type) {
    const task = elementaryTasks[type];
    return {
      title: task.title,
      description: `주어진 문장의 빈칸을 채워 완성하세요. (${task.form})`,
      problem: task.sentence,
      systemPrompt: `${systemPromptTemplate}

현재 평가할 문장: ${task.sentence}
정답 형태: ${task.form}

다음 예시들을 참고하여 피드백을 제공하세요:

${elementaryExamples[type].map((ex, idx) => `예시${ex.id})
답안: "${ex.answer}"
평가: ${ex.evaluation}
피드백: "${ex.feedback}"
`).join('\n')}`,
      taskPrompt: `문제: ${task.sentence}
정답 형태: ${task.form}

예시 답안들과 평가 기준을 참고하여 학생의 답안을 평가해주세요.`,
      examples: elementaryExamples[type],
      evaluationAreas: [
        {
          name: '종합',
          label: '평가하기',
          color: 'blue',
          prompt: `평가 기준:
1. 맥락 (문장의 의미가 자연스러운가)
2. 정확성 (철자, 띄어쓰기, 구두점, 대소문자, 문법)`
        }
      ]
    };
  }
</script>

<div class="container mx-auto px-4 py-8">
  <header class="mb-8">
    <h1 class="text-3xl font-bold text-center">초등 영어 쓰기 활동 평가</h1>
    <div class="text-center mt-2 mb-4">
      <BrandingBeta />
    </div>
    <a href="/" class="text-blue-500 hover:underline mb-4 inline-block">← 홈으로 돌아가기</a>
  </header>

  <div class="mb-6">
    <div class="border-b border-gray-200">
      <nav class="-mb-px flex flex-wrap">
        {#each Object.entries(elementaryTasks) as [type, task]}
          <button
            class={`py-2 px-4 border-b-2 font-medium text-sm ${
              activeTab === type
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } mr-4`}
            on:click={() => (activeTab = type)}
          >
            {task.title}
          </button>
        {/each}
      </nav>
    </div>
  </div>

  <WritingTask {...getTaskData(activeTab)} taskType="elementary" {activeTab} />
</div> 