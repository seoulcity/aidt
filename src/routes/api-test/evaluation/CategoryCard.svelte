<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { calculatePercentage, formatAiScore, getAiScoreColorClass } from './evaluationService';
  import type { CategoryStats } from './types';

  export let category: string;
  export let stats: CategoryStats;
  export let batchId: string;
  
  const dispatch = createEventDispatcher();
  
  let isEditing = false;
  let newCategoryName = category;
  let activeTab: 'human' | 'ai' | 'combined' = 'combined';
  
  function startEditing() {
    isEditing = true;
    newCategoryName = category;
  }
  
  function cancelEditing() {
    isEditing = false;
    newCategoryName = category;
  }
  
  function saveCategory() {
    if (newCategoryName.trim() === '') {
      newCategoryName = category;
      isEditing = false;
      return;
    }
    
    if (newCategoryName !== category) {
      dispatch('updateCategory', {
        oldCategory: category,
        newCategory: newCategoryName
      });
    }
    
    isEditing = false;
  }
  
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      saveCategory();
    } else if (event.key === 'Escape') {
      cancelEditing();
    }
  }
  
  function switchTab(tab: 'human' | 'ai' | 'combined') {
    activeTab = tab;
  }
</script>

<div class="bg-white rounded-lg p-5 border shadow-sm hover:shadow-md transition-shadow">
  <div class="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
    {#if isEditing}
      <div class="flex-1 mr-2">
        <input
          type="text"
          class="w-full p-2 border rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          bind:value={newCategoryName}
          on:keydown={handleKeydown}
          autofocus
        />
      </div>
      <div class="flex space-x-2">
        <button 
          class="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-md transition-colors" 
          on:click={saveCategory}
          title="저장"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </button>
        <button 
          class="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors" 
          on:click={cancelEditing}
          title="취소"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    {:else}
      <h3 class="font-medium text-gray-800 flex items-center">
        <span>{category}</span>
        <button 
          class="ml-2 text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors" 
          on:click={startEditing}
          title="카테고리명 수정"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </button>
      </h3>
      <div class="px-2 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
        총 {stats.total}개
      </div>
    {/if}
  </div>
  
  <!-- 탭 메뉴 -->
  <div class="flex border-b mb-4">
    <button 
      class="py-2 px-3 text-xs rounded-t-md {activeTab === 'combined' ? 'bg-gray-100 border-b-2 border-gray-500 font-medium' : 'text-gray-500 hover:bg-gray-50'} transition-colors"
      on:click={() => switchTab('combined')}
    >
      종합
    </button>
    <button 
      class="py-2 px-3 text-xs rounded-t-md {activeTab === 'human' ? 'bg-blue-50 border-b-2 border-blue-500 font-medium' : 'text-gray-500 hover:bg-gray-50'} transition-colors"
      on:click={() => switchTab('human')}
    >
      휴먼 테스트
    </button>
    <button 
      class="py-2 px-3 text-xs rounded-t-md {activeTab === 'ai' ? 'bg-purple-50 border-b-2 border-purple-500 font-medium' : 'text-gray-500 hover:bg-gray-50'} transition-colors"
      on:click={() => switchTab('ai')}
    >
      AI 테스트
    </button>
  </div>

  <!-- 종합 탭 -->
  {#if activeTab === 'combined'}
    <div class="space-y-4">
      <!-- 휴먼 테스트 요약 -->
      <div class="p-3 bg-gray-50 rounded-md">
        <div class="flex justify-between items-center mb-2">
          <span class="text-xs font-medium text-gray-700 flex items-center">
            <span class="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1.5"></span>
            휴먼 테스트
          </span>
          <span class="text-xs text-gray-500">
            {stats.passed}/{stats.total} 통과 ({calculatePercentage(stats.passed, stats.total)})
          </span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden flex">
          <div class="bg-green-600 h-1.5" style="width: {(stats.passed / stats.total) * 100}%"></div>
          <div class="bg-red-600 h-1.5" style="width: {(stats.failed / stats.total) * 100}%"></div>
          <div class="bg-gray-400 h-1.5" style="width: {(stats.pending / stats.total) * 100}%"></div>
        </div>
      </div>
      
      <!-- AI 테스트 요약 -->
      <div class="p-3 bg-gray-50 rounded-md">
        <div class="flex justify-between items-center mb-2">
          <span class="text-xs font-medium text-gray-700 flex items-center">
            <span class="inline-block w-2 h-2 bg-purple-500 rounded-full mr-1.5"></span>
            AI 테스트
          </span>
          <span class="text-xs text-gray-500">
            {stats.ai_evaluated}/{stats.total} 평가됨 ({calculatePercentage(stats.ai_evaluated, stats.total)})
          </span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-1.5">
          <div 
            class="bg-blue-600 h-1.5 rounded-full" 
            style="width: {calculatePercentage(stats.ai_evaluated, stats.total)}"
          ></div>
        </div>
      </div>
      
      <!-- AI 점수 요약 -->
      {#if stats.ai_evaluated > 0}
        <div class="grid grid-cols-2 gap-3 mt-2">
          <div class="p-2 bg-white border rounded-md">
            <div class="flex justify-between items-center mb-1">
              <span class="text-xs text-gray-600">충실도</span>
              <span class="text-xs font-medium {getAiScoreColorClass(stats.faithfulness_avg)}">
                {formatAiScore(stats.faithfulness_avg)}
              </span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden flex">
              <div 
                class="{getAiScoreColorClass(stats.faithfulness_avg).replace('text-', 'bg-')} h-1.5" 
                style="width: {stats.faithfulness_avg * 100}%"
              ></div>
            </div>
          </div>
          <div class="p-2 bg-white border rounded-md">
            <div class="flex justify-between items-center mb-1">
              <span class="text-xs text-gray-600">관련성</span>
              <span class="text-xs font-medium {getAiScoreColorClass(stats.relevancy_avg)}">
                {formatAiScore(stats.relevancy_avg)}
              </span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden flex">
              <div 
                class="{getAiScoreColorClass(stats.relevancy_avg).replace('text-', 'bg-')} h-1.5" 
                style="width: {stats.relevancy_avg * 100}%"
              ></div>
            </div>
          </div>
        </div>
      {/if}
    </div>

  <!-- 휴먼 테스트 탭 -->
  {:else if activeTab === 'human'}
    <div class="p-3 bg-blue-50 rounded-md">
      <div class="grid grid-cols-3 gap-3 mb-3">
        <div class="text-center p-2 bg-white rounded-md border border-gray-200">
          <p class="text-lg font-bold text-green-600">{stats.passed}</p>
          <p class="text-xs text-gray-500">Pass</p>
          <p class="text-xs text-gray-400">({calculatePercentage(stats.passed, stats.total)})</p>
        </div>
        <div class="text-center p-2 bg-white rounded-md border border-gray-200">
          <p class="text-lg font-bold text-red-600">{stats.failed}</p>
          <p class="text-xs text-gray-500">Fail</p>
          <p class="text-xs text-gray-400">({calculatePercentage(stats.failed, stats.total)})</p>
        </div>
        <div class="text-center p-2 bg-white rounded-md border border-gray-200">
          <p class="text-lg font-bold text-gray-400">{stats.pending}</p>
          <p class="text-xs text-gray-500">미평가</p>
          <p class="text-xs text-gray-400">({calculatePercentage(stats.pending, stats.total)})</p>
        </div>
      </div>
      
      <div class="mt-2">
        <div class="flex justify-between items-center mb-1">
          <span class="text-xs text-gray-600">진행 상황</span>
          <span class="text-xs font-medium">{calculatePercentage(stats.total - stats.pending, stats.total)}</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden flex">
          <div class="bg-green-600 h-1.5" style="width: {(stats.passed / stats.total) * 100}%"></div>
          <div class="bg-red-600 h-1.5" style="width: {(stats.failed / stats.total) * 100}%"></div>
        </div>
      </div>
    </div>
    
  <!-- AI 테스트 탭 -->
  {:else}
    <div class="p-3 bg-purple-50 rounded-md">
      <div class="grid grid-cols-3 gap-3 mb-3">
        <div class="text-center p-2 bg-white rounded-md border border-gray-200">
          <p class="text-lg font-bold text-blue-600">{stats.ai_evaluated}</p>
          <p class="text-xs text-gray-500">평가됨</p>
          <p class="text-xs text-gray-400">({calculatePercentage(stats.ai_evaluated, stats.total)})</p>
        </div>
        <div class="text-center p-2 bg-white rounded-md border border-gray-200">
          <p class="text-lg font-bold {getAiScoreColorClass(stats.faithfulness_avg)}">
            {formatAiScore(stats.faithfulness_avg)}
          </p>
          <p class="text-xs text-gray-500">충실도</p>
        </div>
        <div class="text-center p-2 bg-white rounded-md border border-gray-200">
          <p class="text-lg font-bold {getAiScoreColorClass(stats.relevancy_avg)}">
            {formatAiScore(stats.relevancy_avg)}
          </p>
          <p class="text-xs text-gray-500">관련성</p>
        </div>
      </div>
      
      <!-- AI 테스트 진행 상황 -->
      <div class="mt-2">
        <div class="flex justify-between items-center mb-1">
          <span class="text-xs text-gray-600">진행 상황</span>
          <span class="text-xs font-medium">{calculatePercentage(stats.ai_evaluated, stats.total)}</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-1.5">
          <div 
            class="bg-blue-600 h-1.5 rounded-full" 
            style="width: {calculatePercentage(stats.ai_evaluated, stats.total)}"
          ></div>
        </div>
      </div>
      
      <!-- AI 테스트 점수 시각화 -->
      {#if stats.ai_evaluated > 0}
        <div class="mt-3 grid grid-cols-2 gap-3">
          <div class="p-2 bg-white border rounded-md">
            <div class="flex justify-between items-center mb-1">
              <span class="text-xs text-gray-600">충실도</span>
              <span class="text-xs font-medium {getAiScoreColorClass(stats.faithfulness_avg)}">
                {formatAiScore(stats.faithfulness_avg)}
              </span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden flex">
              <div 
                class="{getAiScoreColorClass(stats.faithfulness_avg).replace('text-', 'bg-')} h-1.5" 
                style="width: {stats.faithfulness_avg * 100}%"
              ></div>
            </div>
          </div>
          <div class="p-2 bg-white border rounded-md">
            <div class="flex justify-between items-center mb-1">
              <span class="text-xs text-gray-600">관련성</span>
              <span class="text-xs font-medium {getAiScoreColorClass(stats.relevancy_avg)}">
                {formatAiScore(stats.relevancy_avg)}
              </span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden flex">
              <div 
                class="{getAiScoreColorClass(stats.relevancy_avg).replace('text-', 'bg-')} h-1.5" 
                style="width: {stats.relevancy_avg * 100}%"
              ></div>
            </div>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div> 