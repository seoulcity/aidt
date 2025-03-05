// src/routes/api-test/stores/searchService.ts
import { writable, get } from 'svelte/store';
import type { ResponseData } from './types';

// 검색 상태를 위한 인터페이스
export interface SearchState {
  query: string;
  results: ResponseData[];
  isSearching: boolean;
}

// 초기 검색 상태
const initialSearchState: SearchState = {
  query: '',
  results: [],
  isSearching: false
};

// 검색 스토어 생성
function createSearchStore() {
  const { subscribe, update, set } = writable<SearchState>(initialSearchState);

  return {
    subscribe,
    update,
    set,

    // 검색 쿼리로 응답 필터링
    filterResponsesBySearch(responses: ResponseData[], query: string): ResponseData[] {
      if (!query) return responses;
      
      const lowerQuery = query.toLowerCase();
      return responses.filter(response => 
        response.input_text.toLowerCase().includes(lowerQuery) || 
        response.response_text.toLowerCase().includes(lowerQuery)
      );
    },

    // 검색 수행
    async search(query: string, allResponses: ResponseData[]) {
      if (!query.trim()) {
        this.clear();
        return [];
      }

      update(state => ({ ...state, isSearching: true, query }));
      
      try {
        // 실제 검색 로직 수행
        const results = this.filterResponsesBySearch(allResponses, query);
        
        update(state => ({
          ...state,
          results,
          isSearching: false
        }));
        
        return results;
      } catch (error) {
        console.error('Search error:', error);
        update(state => ({ ...state, isSearching: false }));
        return [];
      }
    },

    // 검색 초기화
    clear() {
      set(initialSearchState);
    },

    // 현재 검색 상태 가져오기
    getState() {
      return get({ subscribe });
    }
  };
}

export const searchStore = createSearchStore(); 