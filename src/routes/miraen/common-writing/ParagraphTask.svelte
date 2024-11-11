<script>
  import WritingTask from '$lib/components/WritingTask.svelte';
  import { paragraphExamples, generateParagraphPrompt } from '$lib/examples/paragraphExamples';

  const paragraphTaskData = {
    title: "문단 완성하기",
    description: "주어진 주제와 가이드라인에 따라 빈칸에 들어갈 내용을 작성하여 1개 문단을 완성하세요.",
    problem: `My Goal List 
This year, I will try something new. I want to ______________________________. 
I hope to get to know _______________________, 
Lastly, I want to go to ________________________!

포함해야 하는 항목:
1) 내용: 올해 이루고 싶은 일 4개
2) 타겟 표현: 관계대명사 who, which, that`,
    systemPrompt: `당신은 한국의 중학생을 위한 AI 영어 작문 튜터입니다.

포함해야 하는 항목:
1) 내용: 올해 이루고 싶은 일 4개 
2) 타겟 표현: 관계대명사 who, which, that

다음 예시들을 참고하여 피드백을 제공하세요:

${paragraphExamples.map((ex, idx) => `예시${ex.id})
답안: "${ex.answer}"
평가: ${ex.evaluation}
피드백: "${ex.feedback}"
`).join('\n')}

위 예시들처럼 내용 적절성, 타겟 표현 사용, 문법적 정확성을 평가하고 구체적인 피드백을 제공해주세요.`,
    taskPrompt: `주제: 올해 꼭 이루고 싶은 목표 4가지를 써 봅시다.

예시 답안들과 평가 기준을 참고하여 학생의 답안을 평가해주세요.`,
    examples: paragraphExamples,
    evaluationAreas: [
      {
        name: '종합',
        label: '평가하기',
        color: 'blue',
        prompt: `평가 기준:
1. 내용 적절성 (4가지 목표 포함, 구체성, 현실성)
2. 타겟 표현 사용 (관계대명사 who, which, that)
3. 문법적 정확성`
      }
    ]
  };
</script>

<WritingTask {...paragraphTaskData} taskType="paragraph" /> 