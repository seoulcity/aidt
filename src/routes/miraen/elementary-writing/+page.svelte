<script>
  import WritingTask from '$lib/components/WritingTask.svelte';

  const writingTaskData = {
    title: "Let's Write 2",
    description: "빈칸을 포함한 문단이 주어집니다. 빈칸을 채워 문장/문단을 완성하세요.",
    systemPrompt: `당신은 초등학생을 위한 AI 영어 작문 튜터입니다.
다음 두 가지 기준으로 평가해주세요:
1. 맥락 (빈칸 작성의 내용 적절성)
2. 정확성 (띄어쓰기, 스펠링, 문법, 대/소문자)`,
    taskPrompt: `My name is **Liam**.
I'm from **Canada**.
I like **sports**.
I can **play soccer** well.

각 빈칸을 채워 자연스러운 문단을 만드세요.`,
    examples: [
      {
        id: 1,
        answer: "My name is Jihun.\nI'm from Korea.\nI like music.\nI can play piano well.",
        evaluation: "맥락 O, 정확성 O"
      },
      {
        id: 2,
        answer: "My name is 지훈.\nI'm from korea.\nI like musics.\nI can to play piano well.",
        evaluation: "맥락 O, 정확성 X"
      }
    ]
  };
</script>

<div class="container mx-auto px-4 py-8">
  <header class="mb-8">
    <h1 class="text-3xl font-bold text-center">초등 영어 쓰기 활동 평가</h1>
    <a href="/" class="text-blue-500 hover:underline mb-4 inline-block">← 홈으로 돌아가기</a>
  </header>

  <WritingTask {...writingTaskData} />
</div> 