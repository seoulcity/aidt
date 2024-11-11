<script>
  import WritingTask from '$lib/components/WritingTask.svelte';
  import { sentenceExamples, generateSentencePrompt } from '$lib/examples/sentenceExamples';

  const sentenceTaskData = {
    title: "문장 완성하기",
    description: "관계대명사 who 또는 that을 활용하여 빈칸에 알맞은 말을 쓰는 활동입니다.",
    problem: "Claire is the girl _______. (ride a red bike)",
    systemPrompt: `당신은 한국의 중학생을 위한 AI 영어 작문 튜터입니다. 
관계대명사 who/that의 사용이 적절한지 평가하고, 현재진행형 사용이 자연스러운지 평가해주세요.

평가 기준:
1. 타겟 문법 사용 평가 (관계대명사 who/that)
2. 전체적인 문장의 자연스러움 (현재진행형)
3. 수정이 필요한 경우 수정 제안

다음 예시들을 참고하여 피드백을 제공하세요:

${sentenceExamples.map((ex, idx) => `예시${ex.id})
답안: "${ex.answer}"
평가: ${ex.evaluation}
피드백: "${ex.feedback}"
`).join('\n')}`,
    taskPrompt: `문제: Claire is the girl _______. (ride a red bike)

예시 답안들과 평가 기준을 참고하여 학생의 답안을 평가해주세요.`,
    examples: sentenceExamples,
    evaluationAreas: [
      {
        name: '종합',
        label: '평가하기',
        color: 'blue',
        prompt: `평가 기준:
1. 관계대명사 who/that의 적절한 사용
2. 현재진행형의 자연스러운 사용
3. 전반적인 문법적 정확성`
      }
    ]
  };
</script>

<WritingTask {...sentenceTaskData} taskType="sentence" /> 