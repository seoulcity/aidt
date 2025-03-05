<!-- src/routes/api-test/evaluation/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import {
    formatDate,
    calculatePercentage,
    formatAiScore,
    getAiScoreColorClass
  } from './evaluationService';
  import CategoryCard from './CategoryCard.svelte';
  import ProgressModal from './ProgressModal.svelte';
  import Pagination from './Pagination.svelte';
  import ResponseItem from './ResponseItem.svelte';
  
  // Import stores
  import {
    batchSummaries,
    selectedBatchId,
    responses,
    loading,
    responsesLoading,
    error,
    expandedResponseId,
    batchStats,
    isUpdatingCategory,
    updateProgress,
    updateMessage,
    isUpdateComplete,
    updateCompleteMessage,
    currentPage,
    totalItems,
    pageSize,
    totalPages,
    resetBatchSelection,
    resetCategoryUpdateState,
    requestCancelCategoryUpdate,
    toggleResponseExpand,
    isRunningBatchAiTest,
    aiTestProgress,
    aiTestMessage,
    isAiTestComplete,
    aiTestCompleteMessage,
    resetBatchAiTestState,
    requestCancelBatchAiTest,
    concurrentRequests
  } from './evaluationStore';
  
  // Import controllers
  import {
    fetchBatchSummaries,
    fetchBatchResponses,
    handleEvaluation,
    handleSaveRagasResults,
    handleCategoryUpdate,
    handleBatchAiTest
  } from './evaluationController';

  // Handle page change
  function handlePageChange(page: number) {
    if ($selectedBatchId) {
      fetchBatchResponses($selectedBatchId, page);
      const responsesContainer = document.getElementById('responses-container');
      if (responsesContainer) {
        responsesContainer.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  // Handle response expansion toggle
  function handleResponseExpand(event: CustomEvent) {
    const { id } = event.detail;
    toggleResponseExpand(id);
  }

  // Handle category update event
  function handleCategoryUpdateEvent(event: CustomEvent) {
    const { oldCategory, newCategory } = event.detail;
    handleCategoryUpdate(oldCategory, newCategory);
  }

  // Cancel category update
  function cancelCategoryUpdate() {
    requestCancelCategoryUpdate();
  }
  
  // Close update modal
  function closeUpdateModal() {
    resetCategoryUpdateState();
  }
  
  // Show batch AI test confirmation dialog
  let showAiTestConfirmation = false;
  let aiTestConfirmationMode: 'all' | 'pending' = 'pending';
  
  function openAiTestConfirmation() {
    showAiTestConfirmation = true;
    aiTestConfirmationMode = 'pending';
  }
  
  function closeAiTestConfirmation() {
    showAiTestConfirmation = false;
  }
  
  // Start batch AI test
  function startBatchAiTest() {
    handleBatchAiTest(aiTestConfirmationMode, $concurrentRequests);
    closeAiTestConfirmation();
  }
  
  // Cancel batch AI test
  function cancelBatchAiTest() {
    requestCancelBatchAiTest();
  }
  
  // Close AI test modal
  function closeAiTestModal() {
    resetBatchAiTestState();
  }

  onMount(fetchBatchSummaries);
</script>

<div class="max-w-6xl mx-auto p-8">
  <h1 class="text-2xl font-bold mb-6">평가</h1>

  {#if $loading}
    <div class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
    </div>
  {:else if $error}
    <div class="bg-red-50 p-4 rounded-md">
      <p class="text-red-700">{$error}</p>
    </div>
  {:else}
    {#if !$selectedBatchId}
      <!-- 배치 목록 -->
      <div class="space-y-4">
        {#each $batchSummaries as summary}
          <div
            class="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            on:click={() => fetchBatchResponses(summary.batch_id)}
          >
            <div class="flex justify-between items-center">
              <div>
                <p class="text-sm text-gray-500">{formatDate(summary.created_at)}</p>
                <p class="font-medium">총 {summary.count}개의 응답</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <!-- 배치 상세 및 평가 -->
      <div class="mb-6 space-y-6">
        <button
          class="px-4 py-2 text-sm bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-md flex items-center gap-1 transition-colors"
          on:click={resetBatchSelection}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
          배치 목록으로 돌아가기
        </button>

        {#if $batchStats}
          <!-- 전체 통계 -->
          <div class="bg-white rounded-lg p-6 border shadow-sm">
            <h2 class="text-xl font-semibold mb-5 text-gray-800 pb-2 border-b">전체 평가 현황</h2>
            
            <!-- 종합 시각화 -->
            <div class="mb-8 bg-gray-50 p-5 rounded-lg border border-gray-100">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-md font-medium text-gray-700">종합 평가 현황</h3>
                <div class="flex gap-2">
                  <p class="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border">총 {$batchStats.total.total}개 항목</p>
                  <button 
                    class="text-sm bg-blue-500 text-white px-3 py-1 rounded-full hover:bg-blue-600 transition-colors flex items-center gap-1"
                    on:click={openAiTestConfirmation}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
                    </svg>
                    AI 테스트 실행
                  </button>
                </div>
              </div>
              
              <!-- 휴먼 테스트 진행 상황 -->
              <div class="mb-5 pb-4 border-b border-gray-200">
                <div class="flex justify-between items-center mb-2">
                  <span class="text-sm text-gray-700 flex items-center">
                    <span class="inline-block w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                    휴먼 테스트
                  </span>
                  <span class="text-sm">
                    <span class="text-green-600 font-medium">{$batchStats.total.passed}</span> / 
                    <span class="text-red-600 font-medium">{$batchStats.total.failed}</span> / 
                    <span class="text-gray-400 font-medium">{$batchStats.total.pending}</span>
                  </span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden flex">
                  <div class="bg-green-600 h-2.5" style="width: {($batchStats.total.passed / $batchStats.total.total) * 100}%"></div>
                  <div class="bg-red-600 h-2.5" style="width: {($batchStats.total.failed / $batchStats.total.total) * 100}%"></div>
                  <div class="bg-gray-400 h-2.5" style="width: {($batchStats.total.pending / $batchStats.total.total) * 100}%"></div>
                </div>
                <div class="flex justify-between text-xs mt-2">
                  <span class="text-green-600 bg-green-50 px-2 py-1 rounded-md">Pass: {calculatePercentage($batchStats.total.passed, $batchStats.total.total)}</span>
                  <span class="text-red-600 bg-red-50 px-2 py-1 rounded-md">Fail: {calculatePercentage($batchStats.total.failed, $batchStats.total.total)}</span>
                  <span class="text-gray-500 bg-gray-100 px-2 py-1 rounded-md">미평가: {calculatePercentage($batchStats.total.pending, $batchStats.total.total)}</span>
                </div>
              </div>
              
              <!-- AI 테스트 진행 상황 -->
              <div>
                <div class="flex justify-between items-center mb-2">
                  <span class="text-sm text-gray-700 flex items-center">
                    <span class="inline-block w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
                    AI 테스트
                  </span>
                  <span class="text-sm">
                    <span class="text-blue-600 font-medium">{$batchStats.total.ai_evaluated}</span> / 
                    <span class="text-gray-400 font-medium">{$batchStats.total.ai_pending}</span>
                  </span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden flex">
                  <div class="bg-blue-600 h-2.5" style="width: {($batchStats.total.ai_evaluated / $batchStats.total.total) * 100}%"></div>
                  <div class="bg-gray-400 h-2.5" style="width: {($batchStats.total.ai_pending / $batchStats.total.total) * 100}%"></div>
                </div>
                <div class="flex justify-between text-xs mt-2">
                  <span class="text-blue-600 bg-blue-50 px-2 py-1 rounded-md">평가됨: {calculatePercentage($batchStats.total.ai_evaluated, $batchStats.total.total)}</span>
                  <span class="text-gray-500 bg-gray-100 px-2 py-1 rounded-md">미평가: {calculatePercentage($batchStats.total.ai_pending, $batchStats.total.total)}</span>
                </div>
              </div>
              
              <!-- AI 테스트 점수 요약 -->
              {#if $batchStats.total.ai_evaluated > 0}
                <div class="grid grid-cols-2 gap-6 mt-5 pt-4 border-t border-gray-200">
                  <div class="bg-white p-3 rounded-md border">
                    <div class="flex justify-between items-center mb-2">
                      <span class="text-sm text-gray-700 font-medium">충실도 평균</span>
                      <span class="text-sm font-medium {getAiScoreColorClass($batchStats.total.faithfulness_avg)}">
                        {formatAiScore($batchStats.total.faithfulness_avg)}
                      </span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                      <div 
                        class="{getAiScoreColorClass($batchStats.total.faithfulness_avg).replace('text-', 'bg-')} h-2.5" 
                        style="width: {$batchStats.total.faithfulness_avg * 100}%"
                      ></div>
                    </div>
                  </div>
                  <div class="bg-white p-3 rounded-md border">
                    <div class="flex justify-between items-center mb-2">
                      <span class="text-sm text-gray-700 font-medium">관련성 평균</span>
                      <span class="text-sm font-medium {getAiScoreColorClass($batchStats.total.relevancy_avg)}">
                        {formatAiScore($batchStats.total.relevancy_avg)}
                      </span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                      <div 
                        class="{getAiScoreColorClass($batchStats.total.relevancy_avg).replace('text-', 'bg-')} h-2.5" 
                        style="width: {$batchStats.total.relevancy_avg * 100}%"
                      ></div>
                    </div>
                  </div>
                </div>
              {/if}
            </div>
          </div>

          <!-- 카테고리별 통계 -->
          <div class="bg-white rounded-lg p-6 border shadow-sm">
            <h2 class="text-xl font-semibold mb-5 text-gray-800 pb-2 border-b">카테고리별 평가 현황</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {#each Object.entries($batchStats.byCategory) as [category, stats]}
                <CategoryCard 
                  {category} 
                  {stats} 
                  batchId={$selectedBatchId} 
                  on:updateCategory={handleCategoryUpdateEvent}
                />
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <div id="responses-container" class="space-y-2">
        <!-- 상단 페이지네이션 -->
        <div class="mb-4">
          <!-- 디버깅 정보 (개발 중에만 사용) -->
          <p class="text-xs text-gray-500 mb-2">
            총 항목: {$totalItems}, 페이지 크기: {$pageSize}, 총 페이지: {$totalPages}, 현재 페이지: {$currentPage}
          </p>
          
          {#if $totalPages > 0}
            <Pagination 
              currentPage={$currentPage} 
              totalPages={$totalPages} 
              onPageChange={handlePageChange} 
            />
          {/if}
        </div>
        
        <!-- 응답 목록 -->
        {#if $responsesLoading}
          <div class="py-8 flex justify-center">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          </div>
        {:else if $responses.length > 0}
          {#each $responses as response}
            <ResponseItem 
              {response}
              expanded={$expandedResponseId === response.id}
              on:toggleExpand={handleResponseExpand}
              on:evaluate={(e) => handleEvaluation(e.detail.id, e.detail.feedback, e.detail.note, e.detail.category)}
              on:saveRagasResults={(e) => handleSaveRagasResults(e.detail.id, e.detail.results)}
            />
          {/each}
        {:else}
          <div class="bg-gray-50 p-8 text-center rounded-lg border">
            <p class="text-gray-500">이 배치에 응답이 없거나 모든 응답이 로드되지 않았습니다.</p>
          </div>
        {/if}
        
        <!-- 하단 페이지네이션 -->
        <div class="mt-4">
          <!-- 디버깅 정보 (개발 중에만 사용) -->
          <p class="text-xs text-gray-500 mb-2">
            총 항목: {$totalItems}, 페이지 크기: {$pageSize}, 총 페이지: {$totalPages}, 현재 페이지: {$currentPage}
          </p>
          
          {#if $totalPages > 0}
            <Pagination 
              currentPage={$currentPage} 
              totalPages={$totalPages} 
              onPageChange={handlePageChange} 
            />
          {/if}
        </div>
      </div>
    {/if}
  {/if}
</div>

<!-- 진행 상황 모달 -->
<ProgressModal
  isOpen={$isUpdatingCategory}
  title="카테고리 변경"
  message={$updateMessage}
  progress={$updateProgress}
  onCancel={cancelCategoryUpdate}
  isCancelable={!$isUpdateComplete}
  isComplete={$isUpdateComplete}
  completeMessage={$updateCompleteMessage}
  onClose={closeUpdateModal}
/> 

<!-- AI 테스트 진행 상황 모달 -->
<ProgressModal
  isOpen={$isRunningBatchAiTest}
  title="AI 테스트 실행"
  message={$aiTestMessage}
  progress={$aiTestProgress}
  onCancel={cancelBatchAiTest}
  isCancelable={!$isAiTestComplete}
  isComplete={$isAiTestComplete}
  completeMessage={$aiTestCompleteMessage}
  onClose={closeAiTestModal}
/>

<!-- AI 테스트 확인 모달 -->
{#if showAiTestConfirmation}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 max-w-md w-full">
      <h2 class="text-xl font-semibold mb-4">AI 테스트 실행</h2>
      
      <p class="mb-6 text-gray-700">
        AI 테스트를 실행할 항목을 선택하세요. 이미 평가된 항목을 다시 평가하거나, 미평가된 항목만 평가할 수 있습니다.
      </p>
      
      <div class="space-y-3 mb-6">
        <label class="flex items-center space-x-3">
          <input 
            type="radio" 
            name="aiTestMode" 
            value="all" 
            bind:group={aiTestConfirmationMode}
            class="h-5 w-5 text-blue-600"
          />
          <span class="text-gray-700">모든 항목 평가 (총 {$batchStats?.total.total || 0}개)</span>
        </label>
        
        <label class="flex items-center space-x-3">
          <input 
            type="radio" 
            name="aiTestMode" 
            value="pending" 
            bind:group={aiTestConfirmationMode}
            class="h-5 w-5 text-blue-600"
          />
          <span class="text-gray-700">미평가 항목만 평가 (총 {$batchStats?.total.ai_pending || 0}개)</span>
        </label>
      </div>
      
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          동시 처리 건수 (1-20)
        </label>
        <input 
          type="number" 
          min="1" 
          max="20" 
          bind:value={$concurrentRequests} 
          class="w-full p-2 border rounded"
        />
        <p class="text-xs text-gray-500 mt-1">
          동시에 처리할 요청 수를 설정합니다. 너무 많은 요청은 서버 부하를 일으킬 수 있습니다.
        </p>
      </div>
      
      <div class="flex justify-end space-x-3">
        <button 
          class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          on:click={closeAiTestConfirmation}
        >
          취소
        </button>
        <button 
          class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          on:click={startBatchAiTest}
        >
          실행
        </button>
      </div>
    </div>
  </div>
{/if} 