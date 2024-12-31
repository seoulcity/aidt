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
    description: '일반 내용',
    backgroundColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    icon: 'school'
  },
  {
    type: 'forbidden',
    description: '금칙어 사용',
    backgroundColor: 'bg-red-100',
    textColor: 'text-red-800',
    icon: 'block'
  },
  {
    type: 'harmful',
    description: '부적절한 내용',
    backgroundColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    icon: 'warning'
  }
]; 