// src/lib/examples/elementaryExamples.js
export const elementaryExamples = {
  name: [
    {
      id: 1,
      answer: "My name is Jihun.",
      evaluation: "맥락 O, 정확성 O",
      feedback: "잘했어요."
    },
    {
      id: 2,
      answer: "My name is 지훈.",
      evaluation: "맥락 O, 정확성-문법 X",
      feedback: "영어로 문장을 완성하세요."
    },
    {
      id: 3,
      answer: "My name is jihun.",
      evaluation: "맥락 O, 정확성-대소문자 X",
      feedback: "이름의 첫 글자는 대문자로 써요."
    },
    {
      id: 4,
      answer: "My name is from Korea.",
      evaluation: "맥락 X, 정확성 X",
      feedback: "My name is 다음에 from Korea는 어색해요. 나의 이름을 써 보세요."
    }
  ],
  country: [
    {
      id: 1,
      answer: "I'm from Canada.",
      evaluation: "맥락 O, 정확성 O",
      feedback: "잘했어요."
    },
    {
      id: 2,
      answer: "I'm from canada.",
      evaluation: "맥락 O, 정확성-대소문자 X",
      feedback: "I'm from Canada.라고 써야 해요."
    },
    {
      id: 3,
      answer: "I'm from school.",
      evaluation: "맥락 X, 정확성 O",
      feedback: "나의 출신지를 '나라 이름'으로 써 보세요."
    },
    {
      id: 4,
      answer: "I'm from come school.",
      evaluation: "맥락 X, 정확성-문법 X",
      feedback: "I'm from 다음에 come을 쓸 수 없어요. 나의 출신지를 나라 이름으로 써 보세요."
    }
  ],
  like: [
    {
      id: 1,
      answer: "I like music.",
      evaluation: "맥락 O, 정확성 O",
      feedback: "잘했어요."
    },
    {
      id: 2,
      answer: "I like musics.",
      evaluation: "맥락 O, 정확성-문법 X",
      feedback: "I like music.이라고 써야 해요."
    },
    {
      id: 3,
      answer: "I don't like music.",
      evaluation: "맥락 X, 정확성 O",
      feedback: "주어진 표현 'I like'를 사용하여 좋아하는 것을 써 보세요."
    },
    {
      id: 4,
      answer: "I like don't music.",
      evaluation: "맥락 X, 정확성-문법 X",
      feedback: "I like 다음에는 don't를 쓸 수 없어요. I like music. 이라고 써야 해요."
    },
    {
      id: 5,
      answer: "I like dancing",
      evaluation: "맥락 O, 정확성 O",
      feedback: "잘했어요."
    },
    {
      id: 6,
      answer: "I like dencing",
      evaluation: "맥락 O, 정확성-철자 X",
      feedback: "I like dancing 이라고 써야 해요."
    },
    {
      id: 7,
      answer: "I like good food.",
      evaluation: "맥락 O, 정확성 O",
      feedback: "잘했어요."
    },
    {
      id: 8,
      answer: "I like when it rains.",
      evaluation: "맥락 O, 정확성 O",
      feedback: "잘했어요."
    }
  ],
  can: [
    {
      id: 1,
      answer: "I can cook well.",
      evaluation: "맥락 O, 정확성 O",
      feedback: "잘했어요."
    },
    {
      id: 2,
      answer: "I can co ok well.",
      evaluation: "맥락 O, 정확성-띄어쓰기 X",
      feedback: "I can cook well.이라고 써야 해요."
    },
    {
      id: 3,
      answer: "I can not cook well.",
      evaluation: "맥락 X, 정확성 O",
      feedback: "주어진 표현 'I can ___ well.'을 사용하여 잘하는 것을 써 보세요."
    },
    {
      id: 4,
      answer: "I can play the piano well.",
      evaluation: "맥락 O, 정확성 O",
      feedback: "잘했어요."
    },
    {
      id: 5,
      answer: "I can play piano well.",
      evaluation: "맥락 O, 정확성-문법 X",
      feedback: "I can play the piano well.라고 써야 해요."
    }
  ]
};

export const elementaryTasks = {
  name: {
    title: "이름 소개하기",
    sentence: "My name is _______.",
    form: "대문자로 시작하는 단어"
  },
  country: {
    title: "출신지 소개하기",
    sentence: "I'm from ______.",
    form: "대문자로 시작하는 국가 이름"
  },
  like: {
    title: "좋아하는 것 소개하기",
    sentence: "I like _______.",
    form: "명사/동명사/형용사+명사/문장"
  },
  can: {
    title: "잘하는 것 소개하기",
    sentence: "I can _______ well.",
    form: "동사원형/동사구"
  }
};

export const systemPromptTemplate = `당신은 초등학생을 위한 AI 영어 작문 튜터입니다.

평가 영역:
1) 맥락 
2) 정확성 (철자, 띄어쓰기, 구두점, 대소문자, 문법)

다음 기준으로 피드백을 제공해주세요:
CASE1_맥락 O, 정확성 O : 잘했어요. (칭찬)
CASE2_맥락 O, 정확성 X : '_____' 라고 써야 해요. (정답 표현 제공) 
CASE3_맥락 X, 정확성 O : '_____' 를 사용하여 써 보세요. (타겟 문장/핵심 표현 유도)
CASE4_맥락 X, 정확성 X : '_____'를 쓸 수 없어요. '_____'라고 써야 해요. (오류 지적 + 정정)

*사람 이름은 정확성의 '띄어쓰기, 스펠링, 문법' 요소는 채점 하지 않고, '영문/대소문자 구분' 만 채점
*피드백은 초등학생이 이해하기 쉽게 작성해주세요.`; 