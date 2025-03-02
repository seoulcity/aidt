// src/routes/api-test/db.ts
import { supabase } from '$lib/supabaseClient';
import type { Metadata } from './types';

export async function saveResponse(responseText: string, metadata: Metadata, batchId?: string) {
  try {
    const { data, error } = await supabase
      .from('clario_responses')
      .insert({
        response_text: responseText,
        input_text: metadata.input_text,
        reference: metadata.reference,
        recommended_questions: metadata.recommended_questions,
        images: metadata.images,
        action: metadata.action,
        sub_action: metadata.sub_action,
        token_count: metadata.token_count,
        response_id: metadata.response_id,
        latency: metadata.latency,
        batch_id: batchId,
        is_batch: !!batchId,
        query_category: metadata.query_category || '분류 없음',
        order_id: metadata.order_id || null
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving response:', error);
    throw error;
  }
}

/**
 * 에러가 발생한 API 호출에 대한 정보를 저장합니다.
 * 쿼리와 카테고리 정보는 저장하고 에러 메시지를 함께 기록합니다.
 */
export async function saveErrorResponse(inputText: string, errorMessage: string, metadata: Partial<Metadata> = {}, batchId?: string) {
  try {
    // Create the data object for insertion
    const insertData = {
      response_text: '에러 발생: API 호출 실패',
      input_text: inputText,
      action: metadata.action || 'error',
      sub_action: metadata.sub_action || null,
      token_count: metadata.token_count || 0,
      response_id: metadata.response_id || `error-${Date.now()}`,
      latency: metadata.latency || 0,
      batch_id: batchId,
      is_batch: !!batchId,
      query_category: metadata.query_category || '분류 없음',  // 원래 카테고리 정보 유지
      order_id: metadata.order_id || null,
      error_message: errorMessage
    };
    
    // 에러 발생 시에도 최소한의 정보를 저장
    const { data, error } = await supabase
      .from('clario_responses')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving error response:', error);
    // 에러 저장 중 에러가 발생해도 원래 작업을 중단하지 않도록 조용히 실패
    return null;
  }
}

export async function getResponses(options: { 
  isBatch?: boolean, 
  batchId?: string,
  limit?: number,
  offset?: number,
  page?: number
} = {}) {
  try {
    // 먼저 전체 카운트를 가져오기 위한 쿼리
    let countQuery = supabase
      .from('clario_responses')
      .select('id', { count: 'exact' });

    if (typeof options.isBatch === 'boolean') {
      countQuery = countQuery.eq('is_batch', options.isBatch);
    }

    if (options.batchId) {
      countQuery = countQuery.eq('batch_id', options.batchId);
    }

    const { count: totalCount, error: countError } = await countQuery;
    
    if (countError) throw countError;

    // 실제 데이터를 가져오기 위한 쿼리
    let dataQuery = supabase
      .from('clario_responses')
      .select('*');

    if (typeof options.isBatch === 'boolean') {
      dataQuery = dataQuery.eq('is_batch', options.isBatch);
    }

    if (options.batchId) {
      dataQuery = dataQuery.eq('batch_id', options.batchId);
      dataQuery = dataQuery.order('order_id', { ascending: true });
    } else {
      dataQuery = dataQuery.order('created_at', { ascending: false });
    }
    
    // 페이지네이션 적용
    const pageSize = options.limit || 20;
    const offset = options.page ? (options.page - 1) * pageSize : (options.offset || 0);
    
    dataQuery = dataQuery.range(offset, offset + pageSize - 1);

    const { data, error } = await dataQuery;

    if (error) throw error;
    
    // 디버깅 로그 개선
    console.log('DB 응답:', { 
      data: data?.length, 
      count: totalCount, 
      pageSize,
      page: options.page || 1,
      offset
    });
    
    // 데이터가 없는 경우 빈 배열 반환
    if (!data || data.length === 0) {
      console.warn('쿼리 결과가 없습니다:', { options });
    }
    
    return { data: data || [], count: totalCount || 0 };
  } catch (error) {
    console.error('Error fetching responses:', error);
    throw error;
  }
}

export async function getBatchSummaries(limit = 10) {
  try {
    const { data, error } = await supabase
      .from('clario_responses')
      .select('batch_id, created_at')
      .not('batch_id', 'is', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // 배치별로 그룹화하고 카운트 계산
    const batchMap = new Map();
    data.forEach(row => {
      if (!batchMap.has(row.batch_id)) {
        batchMap.set(row.batch_id, {
          batch_id: row.batch_id,
          created_at: row.created_at,
          count: 1
        });
      } else {
        batchMap.get(row.batch_id).count++;
      }
    });

    // 배치 요약 정보를 배열로 변환하고 최신순으로 정렬
    const summaries = Array.from(batchMap.values())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);

    return summaries;
  } catch (error) {
    console.error('Error fetching batch summaries:', error);
    throw error;
  }
}

export interface BatchStatistics {
  total: {
    total: number;
    passed: number;
    failed: number;
    pending: number;
    ai_evaluated: number;
    ai_pending: number;
    faithfulness_avg: number;
    relevancy_avg: number;
  };
  byCategory: {
    [category: string]: {
      total: number;
      passed: number;
      failed: number;
      pending: number;
      ai_evaluated: number;
      ai_pending: number;
      faithfulness_avg: number;
      relevancy_avg: number;
    };
  };
}

export async function getBatchStatistics(batchId: string): Promise<BatchStatistics> {
  try {
    const { data, error } = await supabase
      .from('clario_responses')
      .select('query_category, human_feedback, ragas_feedback')
      .eq('batch_id', batchId);

    if (error) throw error;

    const stats: BatchStatistics = {
      total: { 
        total: 0, 
        passed: 0, 
        failed: 0, 
        pending: 0,
        ai_evaluated: 0,
        ai_pending: 0,
        faithfulness_avg: 0,
        relevancy_avg: 0
      },
      byCategory: {}
    };

    // 전체 AI 평가 점수 합계를 위한 변수
    let totalFaithfulness = 0;
    let totalRelevancy = 0;
    let totalAiEvaluated = 0;

    data.forEach(row => {
      // 전체 통계 업데이트
      stats.total.total++;
      if (row.human_feedback === 1) stats.total.passed++;
      else if (row.human_feedback === 0) stats.total.failed++;
      else stats.total.pending++;

      // AI 테스트 통계 업데이트
      const hasRagasResults = row.ragas_feedback && 
                             row.ragas_feedback.scores && 
                             (row.ragas_feedback.scores.faithfulness !== undefined || 
                              row.ragas_feedback.scores.answer_relevancy !== undefined);
      
      if (hasRagasResults) {
        stats.total.ai_evaluated++;
        totalAiEvaluated++;
        
        // 충실도(faithfulness) 점수 추가
        if (row.ragas_feedback.scores.faithfulness !== undefined) {
          const faithfulness = parseFloat(row.ragas_feedback.scores.faithfulness);
          if (!isNaN(faithfulness)) {
            totalFaithfulness += faithfulness;
          }
        }
        
        // 관련성(answer_relevancy) 점수 추가
        if (row.ragas_feedback.scores.answer_relevancy !== undefined) {
          const relevancy = parseFloat(row.ragas_feedback.scores.answer_relevancy);
          if (!isNaN(relevancy)) {
            totalRelevancy += relevancy;
          }
        }
      } else {
        stats.total.ai_pending++;
      }

      // 카테고리별 통계 업데이트
      const category = row.query_category || '분류 없음';
      if (!stats.byCategory[category]) {
        stats.byCategory[category] = { 
          total: 0, 
          passed: 0, 
          failed: 0, 
          pending: 0,
          ai_evaluated: 0,
          ai_pending: 0,
          faithfulness_avg: 0,
          relevancy_avg: 0
        };
      }
      
      // 휴먼 테스트 통계
      stats.byCategory[category].total++;
      if (row.human_feedback === 1) stats.byCategory[category].passed++;
      else if (row.human_feedback === 0) stats.byCategory[category].failed++;
      else stats.byCategory[category].pending++;
      
      // 카테고리별 AI 테스트 통계
      if (hasRagasResults) {
        stats.byCategory[category].ai_evaluated++;
        
        // 충실도(faithfulness) 점수 추가
        if (row.ragas_feedback.scores.faithfulness !== undefined) {
          const faithfulness = parseFloat(row.ragas_feedback.scores.faithfulness);
          if (!isNaN(faithfulness)) {
            stats.byCategory[category].faithfulness_avg = 
              (stats.byCategory[category].faithfulness_avg * (stats.byCategory[category].ai_evaluated - 1) + faithfulness) / 
              stats.byCategory[category].ai_evaluated;
          }
        }
        
        // 관련성(answer_relevancy) 점수 추가
        if (row.ragas_feedback.scores.answer_relevancy !== undefined) {
          const relevancy = parseFloat(row.ragas_feedback.scores.answer_relevancy);
          if (!isNaN(relevancy)) {
            stats.byCategory[category].relevancy_avg = 
              (stats.byCategory[category].relevancy_avg * (stats.byCategory[category].ai_evaluated - 1) + relevancy) / 
              stats.byCategory[category].ai_evaluated;
          }
        }
      } else {
        stats.byCategory[category].ai_pending++;
      }
    });

    // 전체 평균 계산
    if (totalAiEvaluated > 0) {
      stats.total.faithfulness_avg = totalFaithfulness / totalAiEvaluated;
      stats.total.relevancy_avg = totalRelevancy / totalAiEvaluated;
    }

    return stats;
  } catch (error) {
    console.error('Error fetching batch statistics:', error);
    throw error;
  }
}

export async function updateEvaluation(
  responseId: number,
  humanFeedback: 0 | 1,
  note: string = '',
  category?: string
) {
  try {
    const updateData: any = {
      human_feedback: humanFeedback,
      human_feedback_note: note,
      evaluated_at: new Date().toISOString()
    };

    if (category !== undefined) {
      updateData.query_category = category;
    }

    const { data, error } = await supabase
      .from('clario_responses')
      .update(updateData)
      .eq('id', responseId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating evaluation:', error);
    throw error;
  }
}

// 카테고리 이름 변경 함수
export async function updateCategoryName(
  batchId: string,
  oldCategory: string,
  newCategory: string,
  onProgress?: (processed: number, total: number) => void
) {
  try {
    // 1. 해당 배치에서 특정 카테고리를 가진 모든 응답 ID 가져오기
    const { data: responses, error: fetchError } = await supabase
      .from('clario_responses')
      .select('id')
      .eq('batch_id', batchId)
      .eq('query_category', oldCategory);

    if (fetchError) throw fetchError;
    
    const total = responses.length;
    if (total === 0) return { success: true, count: 0 };
    
    // 2. 각 응답에 대해 카테고리 업데이트 (일괄 업데이트가 아닌 개별 업데이트로 진행 상황 추적)
    let processed = 0;
    let success = true;
    
    for (const response of responses) {
      const { error: updateError } = await supabase
        .from('clario_responses')
        .update({ query_category: newCategory })
        .eq('id', response.id);
      
      if (updateError) {
        success = false;
        console.error('Error updating category for response:', response.id, updateError);
      }
      
      processed++;
      if (onProgress) onProgress(processed, total);
      
      // 취소 신호를 확인하기 위한 지연 추가
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    return { success, count: processed };
  } catch (error) {
    console.error('Error updating category name:', error);
    throw error;
  }
}

// RAGAS 평가 결과 저장 함수
export async function saveRagasEvaluation(
  responseId: number,
  results: any
) {
  try {
    const updateData = {
      ragas_feedback: results,
      evaluated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('clario_responses')
      .update(updateData)
      .eq('id', responseId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving RAGAS evaluation:', error);
    throw error;
  }
} 