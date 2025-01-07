import type { PersonaPrompt } from '$lib/types/persona';

export const prompts: PersonaPrompt[] = [
  // 학습 방법/전략 프롬프트
  {
    level: '상',
    type: 'learning_tip',
    prompt: `상위권 학생을 위한 학습 전략 프롬프트:
1. 심화 학습 및 응용력 향상에 중점
2. 자기주도적 학습 방법 제시
3. 개념 간 연결성 강조
4. 효율적인 시간 관리 방법 제안`
  },
  {
    level: '중',
    type: 'learning_tip',
    prompt: `중위권 학생을 위한 학습 전략 프롬프트:
1. 기본 개념 이해도 점검
2. 단계별 학습 방법 제시
3. 취약점 보완 전략 제안
4. 학습 동기 유지 방안 제시`
  },
  {
    level: '하',
    type: 'learning_tip',
    prompt: `하위권 학생을 위한 학습 전략 프롬프트:
1. 기초 개념부터 차근차근 설명
2. 구체적인 예시 활용
3. 작은 성취 목표 설정
4. 반복 학습 방법 제시`
  },
  
  // 동기/심리 관리 프롬프트
  {
    level: '상',
    type: 'emotional_support',
    prompt: `상위권 학생을 위한 심리 지원 프롬프트:
1. 과도한 부담감 해소 방안
2. 경쟁 스트레스 관리
3. 완벽주의 성향 조절
4. 자기 효능감 유지`
  },
  {
    level: '중',
    type: 'emotional_support',
    prompt: `중위권 학생을 위한 심리 지원 프롬프트:
1. 성장 마인드셋 강화
2. 적절한 목표 설정
3. 학습 동기 유지
4. 자신감 향상 방안`
  },
  {
    level: '하',
    type: 'emotional_support',
    prompt: `하위권 학생을 위한 심리 지원 프롬프트:
1. 자존감 회복 지원
2. 작은 성공 경험 강조
3. 긍정적 피드백 제공
4. 학습 의욕 고취`
  }
]; 