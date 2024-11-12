// src/lib/examples/paragraphExamples.js
export const paragraphExamples = [
  {
    id: 1,
    answer: `My Goal List
This year, I will try something new. I want to draw better and learn to swim. I hope to get to know Jisoo who is good at sports. Lastly, I want to go to a museum which will be interesting!`,
    evaluation: "내용 적절성 O, 타겟표현 O, 문법 O",
    feedback: "알맞은 표현을 사용하여 자신이 이루고 싶은 목표를 잘 썼어요!"
  },
  {
    id: 2,
    answer: `My Goal List
This year, I will try something new. I want make a video and learn to play the guitar. I hope to get to know Mina who is very kind. Lastly, I want to go to a zoo which will be exciting!`,
    evaluation: "내용 적절성 O, 타겟표현 O, 문법 X",
    feedback: "(내용 적절성) 자신이 이루고 싶은 목표에 대해 잘 썼네요.\n(문법) 문법 오류는 꼭 확인하고 바른 형태를 익히세요.\n* make a video -> to make a video"
  },
  {
    id: 3,
    answer: `My Goal List
This year, I will try something new. I want to make a video and learning play the guitar. I hope to get to know Mina. Lastly, I want to go to a zoo!`,
    evaluation: "내용 적절성 O, 타겟표현 X, 문법 X",
    feedback: "(내용 적절성) 자신이 이루고 싶은 목표에 대해 잘 썼네요.\n(타겟 표현) 관계대명사 who, which, that을 사용해서 문장을 쓴다면 더 복잡한 내용도 전달할 수 있어요.\n(문법) 문법 오류는 꼭 확인하고 바른 형태를 익히세요.\n* learning -> learn 또는 to learn"
  },
  {
    id: 4,
    answer: `My Goal List
This year, I will try new things. I want to get a soccer ball for my birthday. I hope to get to know a movie star who is really famous. Lastly, I want to go to another planet which will be exciting!`,
    evaluation: "내용 적절성 X, 타겟표현 O, 문법 O",
    feedback: "(내용 적절성) 이루고 싶은 목표에 대해 더 고민해 볼까요? 보고 싶은 영화나 책, 친구가 되고 싶은 사람, 또는 가보고 싶은 구체적인 장소가 있나요?"
  },
  {
    id: 5,
    answer: `My Goal List
This year, I will try new things. I want to get a soccer ball for my birthday. I hope to get to know a movie star. Lastly, I want to go to the Moon!`,
    evaluation: "내용 적절성 X, 타겟표현 X, 문법 O",
    feedback: "(내용 적절성) 이루고 싶은 목표에 대해 더 고민해 볼까요? 보고 싶은 영화나 보고 싶은 책, 친구가 되고 싶은 사람이 있나요?\n(타겟 표현) 관계대명사 who, which, that을 사용해서 문장을 쓴다면 더 복잡한 내용도 전달할 수 있어요."
  },
  {
    id: 6,
    answer: `My Goal List
This year, I will try something new. I want to eating a whole cake on my birthday. I hope to get to know a movie stars. Lastly, I want to go to the Moon!`,
    evaluation: "내용 적절성 X, 타겟표현 X, 문법 X",
    feedback: "(내용 적절성) 이루고 싶은 목표에 대해 더 고민해 볼까요? 보고 싶은 영화나 보고 싶은 책, 친구가 되고 싶은 사람이 있나요?\n(타겟 표현) 관계대명사 who, which, that을 사용해서 문장을 쓴다면 더 복잡한 내용도 전달할 수 있어요.\n(문법) 문법 오류는 꼭 확인하고 바른 형태를 익히세요.\n* eating -> eat\n* a movie stars -> a movie star 또는 movie stars"
  }
];

export function generateParagraphPrompt(examples) {
  return examples.slice(0, 3).map(ex => 
    `예시${ex.id})\n답안: "${ex.answer}"\n평가: ${ex.evaluation}\n피드백: "${ex.feedback}"`
  ).join('\n\n');
} 