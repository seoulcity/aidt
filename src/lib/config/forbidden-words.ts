// src/lib/config/forbidden-words.ts
export interface ForbiddenCategory {
  name: string;
  description: string;
  keywords: string[];
  examples: string[];
}

export const forbiddenCategories: ForbiddenCategory[] = [
  {
    name: '학습 무관',
    description: '학습과 무관한 잡담이나 질문',
    keywords: ['게임', '연예인', '드라마', '영화', '데이트', '연애'],
    examples: [
      '게임 추천해주세요',
      '연예인 이름 알려주세요'
    ]
  },
  {
    name: '개인정보',
    description: '개인정보 요청 또는 노출',
    keywords: ['전화번호', '주소', '이름', '나이', '학교', '이메일'],
    examples: [
      '너의 이름이 뭐야?',
      '내 전화번호를 알려줄까?'
    ]
  },
  {
    name: '정치/종교',
    description: '정치적 또는 종교적 내용',
    keywords: ['정당', '대통령', '선거', '종교', '교회', '절', '기도'],
    examples: [
      '어떤 정당을 지지해?',
      '종교는 무엇인가요?'
    ]
  },
  {
    name: '비윤리',
    description: '차별, 혐오, 폭력적 내용',
    keywords: ['욕설', '차별', '폭력', '성희롱', '협박'],
    examples: [
      '싫어하는 친구를 어떻게 해야할까?',
      '다른 반 친구들은 다 못났어'
    ]
  },
  {
    name: '불법',
    description: '불법적인 행위나 내용',
    keywords: ['불법', '마약', '도박', '복제', '해킹'],
    examples: [
      '시험지 유출하는 방법',
      '친구 계정 해킹하는 법'
    ]
  }
]; 