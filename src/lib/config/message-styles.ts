// src/lib/config/message-styles.ts
export interface MessageStyle {
  type: string;
  description: string;
  backgroundColor: string;
  textColor: string;
  icon: string;
}

export const messageStyles: MessageStyle[] = [
  {
    type: 'normal',
    description: '일반 학습 질문',
    backgroundColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    icon: 'school'
  },
  {
    type: 'unethical',
    description: '비윤리적 내용',
    backgroundColor: 'bg-amber-100',
    textColor: 'text-amber-800',
    icon: 'warning'
  },
  {
    type: 'forbidden',
    description: '금칙어/부적절 내용',
    backgroundColor: 'bg-red-100',
    textColor: 'text-red-800',
    icon: 'block'
  }
]; 