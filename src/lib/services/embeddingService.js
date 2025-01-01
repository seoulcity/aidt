import { generateEmbedding } from '$lib/utils/embedding';
import { embeddingResults, predefinedQueries, personaChatQueries } from '$lib/stores/embeddingStore';
import { get } from 'svelte/store';

export class EmbeddingService {
  static async calculateSimilarities(query, usePersonaQueries = false) {
    try {
      console.log('=== 유사도 계산 시작 ===');
      console.log('쿼리:', query);
      console.log('페르소나 쿼리 사용:', usePersonaQueries);

      const queries = usePersonaQueries ? personaChatQueries : predefinedQueries;
      console.log('사용할 쿼리:', queries);

      embeddingResults.update(state => ({ ...state, isLoading: true, error: null }));
      
      // 쿼리 임베딩 생성
      console.log('쿼리 임베딩 생성 중...');
      const queryEmbedding = await generateEmbedding(query);
      console.log('쿼리 임베딩 생성 완료');
      
      // 미리 정의된 쿼리들의 임베딩 생성
      console.log('미리 정의된 쿼리 임베딩 생성 중...');
      const predefinedEmbeddings = await Promise.all(
        queries.map(q => generateEmbedding(q.text))
      );
      console.log('미리 정의된 쿼리 임베딩 생성 완료');
      
      // 코사인 유사도 계산
      console.log('코사인 유사도 계산 중...');
      const similarities = predefinedEmbeddings.map((embedding, index) => {
        const similarity = this.cosineSimilarity(queryEmbedding, embedding);
        return {
          query: queries[index].text,
          category: queries[index].category,
          keywords: queries[index].keywords,
          similarity
        };
      });

      // 유사도 기준 내림차순 정렬
      similarities.sort((a, b) => b.similarity - a.similarity);
      
      // 상위 5개 결과에서 카테고리 빈도 계산
      const top5 = similarities.slice(0, 5);
      const categoryCount = top5.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + 1;
        return acc;
      }, {});

      // 가장 빈도가 높은 카테고리 선택
      const predictedCategory = Object.entries(categoryCount)
        .sort(([,a], [,b]) => b - a)[0][0];
      
      console.log('계산된 유사도:', similarities);
      console.log('예측된 카테고리:', predictedCategory);
      
      embeddingResults.update(state => ({
        ...state,
        query,
        similarities: top5,
        category: predictedCategory,
        isLoading: false
      }));
      
      return {
        similarities: top5,
        category: predictedCategory
      };
    } catch (error) {
      console.error('임베딩 유사도 계산 중 오류:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause
      });
      embeddingResults.update(state => ({
        ...state,
        error: error instanceof Error ? error.message : String(error),
        isLoading: false
      }));
      throw error;
    }
  }
  
  static cosineSimilarity(a, b) {
    try {
      const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
      const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
      const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
      return dotProduct / (magnitudeA * magnitudeB);
    } catch (error) {
      console.error('코사인 유사도 계산 중 오류:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        vectors: { a, b }
      });
      throw error;
    }
  }
} 