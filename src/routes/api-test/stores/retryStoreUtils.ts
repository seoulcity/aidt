// src/routes/api-test/stores/retryStoreUtils.ts
import { writable, get } from 'svelte/store';

// Store for tracking retrying IDs
export const retryingIdsStore = writable<Set<number>>(new Set());

// Helper function to check if a response is currently being retried
export function isRetrying(id: number): boolean {
  return get(retryingIdsStore).has(id);
}

// Helper function to construct a meaningful response from status updates
export function constructResponseFromStatusUpdates(statusTexts: string[]): string {
  if (statusTexts.length === 0) return '응답을 생성하지 못했습니다.';
  
  // Filter out duplicate and uninformative status messages
  const uniqueTexts = Array.from(new Set(statusTexts)).filter(text => 
    !text.includes('질문에 대한 내용을 답변드리기 위한 추론을 시작하겠습니다') &&
    !text.includes('질문을 분석하고 있습니다') &&
    !text.includes('질문에 답할 수 있는 정보를 찾고 있습니다') &&
    !text.includes('정보를 바탕으로 답변을 생성중입니다') &&
    !text.includes('DONE') &&
    !text.includes('FINISH')
  );
  
  if (uniqueTexts.length === 0) {
    return '응답을 생성하는 중 오류가 발생했습니다. 다시 시도해주세요.';
  }
  
  // Construct a response that includes the information we've gathered
  return `[참고: 이 응답은 불완전한 데이터로부터 복구되었습니다]\n\n질문하신 내용에 대해 다음과 같은 정보를 찾았습니다:\n\n${uniqueTexts.join('\n\n')}\n\n더 자세한 정보를 원하시면 다시 질문해주세요.`;
} 