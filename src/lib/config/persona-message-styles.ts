export interface PersonaMessageStyle {
  type: string;
  description: string;
  backgroundColor: string;
  textColor: string;
  icon: string;
}

export const personaMessageStyles: PersonaMessageStyle[] = [
  {
    type: 'learning_tip',
    description: '학습 방법/전략',
    backgroundColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    icon: 'school'
  },
  {
    type: 'emotional_support',
    description: '동기/심리 관리',
    backgroundColor: 'bg-purple-100',
    textColor: 'text-purple-800',
    icon: 'psychology'
  }
]; 