// src/routes/api-test/evaluation/evaluationService.ts
import { getBatchSummaries, getResponses, updateEvaluation, getBatchStatistics, saveRagasEvaluation } from '../db';
import type { BatchSummary, ResponseData, BatchStatistics } from './types';

// 배치 요약 목록 로드
export async function loadBatchSummaries(): Promise<BatchSummary[]> {
  return await getBatchSummaries();
}

// 특정 배치의 응답 목록 로드
export async function loadBatchResponses(batchId: string, page: number = 1, pageSize: number = 20): Promise<{
  data: ResponseData[],
  count: number
}> {
  return await getResponses({ batchId, page, limit: pageSize });
}

// 특정 배치의 모든 응답 로드 (페이지네이션 없음)
export async function loadAllBatchResponses(batchId: string): Promise<ResponseData[]> {
  // 먼저 총 항목 수를 가져오기 위해 첫 페이지를 로드
  const firstPage = await getResponses({ batchId, page: 1, limit: 1 });
  const totalItems = firstPage.count;
  
  // 모든 항목을 한 번에 가져오기
  const result = await getResponses({ batchId, page: 1, limit: totalItems });
  return result.data;
}

// 특정 배치의 통계 로드
export async function loadBatchStatistics(batchId: string): Promise<BatchStatistics> {
  return await getBatchStatistics(batchId);
}

// 평가 업데이트
export async function handleEvaluation(
  responseId: number, 
  feedback: 0 | 1, 
  note: string = '', 
  category?: string
): Promise<void> {
  await updateEvaluation(responseId, feedback, note, category);
}

// RAGAS 평가 결과 저장
export async function saveRagasResults(
  responseId: number,
  results: any
): Promise<void> {
  await saveRagasEvaluation(responseId, results);
}

// 텍스트 축약
export function truncateText(text: string, maxLength: number = 20): string {
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}

// 날짜 포맷팅
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('ko-KR');
}

// 퍼센트 계산
export function calculatePercentage(value: number, total: number): string {
  return total === 0 ? '0%' : `${Math.round((value / total) * 100)}%`;
}

// AI 테스트 점수 포맷팅 (0-1 사이의 값을 퍼센트로 변환)
export function formatAiScore(score: number): string {
  if (isNaN(score) || score === 0) return '0%';
  return `${Math.round(score * 100)}%`;
}

// AI 테스트 점수 색상 클래스 반환
export function getAiScoreColorClass(score: number): string {
  if (isNaN(score)) return 'text-gray-400';
  if (score >= 0.8) return 'text-green-600';
  if (score >= 0.5) return 'text-yellow-600';
  return 'text-red-600';
}

// 피드백 값 확인
export function ensureFeedbackValue(value: number | null): 0 | 1 {
  return (value ?? 1) as 0 | 1;
}

// 카테고리 목록
export const categories = [
  '분류 없음',
  '일반 질문',
  '개념 설명',
  '문제 해결',
  '코드 분석',
  '오류 수정',
  '기능 추천',
  '기타'
]; 