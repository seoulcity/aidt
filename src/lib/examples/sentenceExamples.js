// src/lib/examples/sentenceExamples.js
export const sentenceExamples = [
  {
    id: 1,
    answer: "Claire is the girl who is riding a red bike.",
    evaluation: "타겟 문법- 2개 O",
    feedback: "관계대명사 who와 현재진행형을 사용하여 문장을 잘 완성했어요!"
  },
  {
    id: 2,
    answer: "Claire is the girl who rides a red bike.",
    evaluation: "타겟 문법 (필수 항목) O, 타겟 문법 (선택 항목) X",
    feedback: "관계대명사 who를 사용하여 문장을 잘 완성했어요! 현재 하고 있는 동작을 나타낼 때는 현재 진행형으로 표현하는 것이 더 자연스러워요.\n* rides -> is riding"
  },
  {
    id: 3,
    answer: "Claire is the girl which is riding a red bike.",
    evaluation: "타겟 문법 (필수 항목) X, 타겟 문법 (선택 항목) O",
    feedback: "현재진행형을 올바르게 사용했어요. 선행사가 사람이라면 who 또는 that이 와야 해요.\n* which -> who 또는 that"
  },
  {
    id: 4,
    answer: "Claire is the girl which rides a red bike.",
    evaluation: "타겟 문법-2개 X, 그 외 문법 O",
    feedback: "선행사가 사람이라면 who 또는 that이 와야 해요. 현재 하고 있는 동작은 현재 진행형으로 표현하는 것에 유의해요.\n* which -> who 또는 that\n* rides -> is riding"
  },
  {
    id: 5,
    answer: "Claire is the girl which rides red bike.",
    evaluation: "타겟 문법-2개 X, 그 외 문법 X",
    feedback: "선행사가 사람이라면 who 또는 that이 와야 해요. 현재 하고 있는 동작은 현재 진행형으로 표현하는 것에 유의해요. 다른 문법 오류도 꼭 확인하고 바른 형태를 익히세요.\n* which -> who 또는 that\n* rides -> is riding\n* red bike -> a red bike"
  }
];

export function generateSentencePrompt(examples) {
  return examples.slice(0, 3).map(ex => 
    `예시${ex.id})\n답안: "${ex.answer}"\n평가: ${ex.evaluation}\n피드백: "${ex.feedback}"`
  ).join('\n\n');
} 