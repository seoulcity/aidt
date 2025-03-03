<!-- src/routes/api-test/result/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { resultStore } from '../stores/resultStore';
  import { isValidArray, formatDate } from '../stores/resultStoreUtils';
  import ResponseItem from '../components/ResponseItem.svelte';
  import SearchBar from '../components/SearchBar.svelte';
  
  onMount(() => {
    resultStore.loadData();
  });
  
  // Handle retry event from ResponseItem component
  function handleRetry(event: CustomEvent<{ response: any, batchId: string | null }>) {
    const { response, batchId } = event.detail;
    resultStore.retryResponse(response, batchId);
  }
  
  // Handle delete event from ResponseItem component
  function handleDelete(event: CustomEvent<{ id: number }>) {
    const { id } = event.detail;
    resultStore.deleteResponse(id);
  }

  // Get the total pages from the store
  $: totalPages = resultStore.totalPages;
  $: visiblePageNumbers = resultStore.visiblePageNumbers;

  // Batch retry functionality
  let showRetryModal = false;
  let selectedCategoryForRetry = '';
  let concurrentLimit = 3;
  let retryCount = 0;
  let batchRetryInProgress = false;
  let batchRetryProgress = 0;
  let batchRetryTotal = 0;
  
  function openRetryModal(category: string) {
    selectedCategoryForRetry = category;
    
    // Count how many items will be retried using getCategoryTotalCount
    retryCount = getCategoryTotalCount(category);
    
    showRetryModal = true;
  }
  
  function closeRetryModal() {
    showRetryModal = false;
  }
  
  async function startBatchRetry() {
    if (retryCount === 0) {
      closeRetryModal();
      return;
    }
    
    batchRetryInProgress = true;
    batchRetryProgress = 0;
    batchRetryTotal = retryCount;
    
    try {
      await resultStore.retryBatchByCategory(selectedCategoryForRetry, concurrentLimit, (progress, total) => {
        batchRetryProgress = progress;
        batchRetryTotal = total;
      });
    } catch (error) {
      console.error('Batch retry error:', error);
    } finally {
      batchRetryInProgress = false;
      closeRetryModal();
    }
  }
  
  function cancelBatchRetry() {
    if (batchRetryInProgress) {
      resultStore.cancelBatchRetry();
    }
  }

  // 현재 카테고리의 전체 항목 수 계산
  function getCategoryTotalCount(category: string): number {
    if (category === '전체') {
      return $resultStore.totalCount;
    } else if (category === '에러') {
      return $resultStore.allResponses.filter(r => !!r.error_message).length;
    } else {
      return $resultStore.allResponses.filter(r => r.query_category === category).length;
    }
  }
  
  // Search functionality
  let searchQuery = '';
  
  function handleSearch(event: CustomEvent<{ query: string }>) {
    searchQuery = event.detail.query;
    resultStore.searchResponses(searchQuery);
  }
  
  function clearSearch() {
    searchQuery = '';
    resultStore.clearSearch();
  }
  
  // Function to handle category filter click
  function handleCategoryFilter(category: string) {
    // Clear the search query in the component
    searchQuery = '';
    // Apply the category filter (which also clears search in the store)
    resultStore.filterByCategory(category);
  }
</script>

<div class="max-w-6xl mx-auto p-8">
  <h1 class="text-2xl font-bold mb-6">API 호출 결과 조회</h1>

  {#if $resultStore.loading}
    <div class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
      <p class="ml-4 text-gray-600">데이터를 불러오는 중...</p>
    </div>
  {:else if $resultStore.error}
    <div class="bg-red-50 p-4 rounded-md mb-4">
      <p class="text-red-700">{$resultStore.error}</p>
      <button 
        class="mt-2 px-4 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-md text-sm"
        on:click={() => resultStore.loadData()}
      >
        다시 시도
      </button>
    </div>
  {:else}
    {#if !$resultStore.selectedBatchId}
      <div class="space-y-4">
        {#each $resultStore.batchSummaries as summary}
          <div
            class="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer relative group"
          >
            <!-- 배치 삭제 진행 중인 경우 프로그레스 바 표시 -->
            {#if $resultStore.deletingBatchId === summary.batch_id}
              <div class="absolute inset-0 bg-gray-100 bg-opacity-75 flex flex-col items-center justify-center z-10 rounded-lg">
                <p class="text-gray-700 mb-2">배치 삭제 중... {$resultStore.deletingBatchProgress}%</p>
                <div class="w-2/3 bg-gray-200 rounded-full h-2.5">
                  <div class="bg-red-600 h-2.5 rounded-full" style="width: {$resultStore.deletingBatchProgress}%"></div>
                </div>
              </div>
            {/if}
            
            <div 
              class="flex justify-between items-center"
              on:click={() => $resultStore.deletingBatchId ? null : resultStore.selectBatch(summary.batch_id)}
            >
              <div>
                <div class="flex items-center gap-2">
                  <p class="text-sm text-gray-500">{formatDate(summary.created_at)}</p>
                  {#if summary.is_individual}
                    <span class="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">단독 수행</span>
                  {:else}
                    <span class="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">배치 수행</span>
                  {/if}
                </div>
                <p class="font-medium">총 {summary.count}개의 응답</p>
              </div>
              
              <div class="flex items-center">
                <!-- 삭제 버튼 (호버 시 표시) -->
                <button
                  class="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 mr-2"
                  on:click|stopPropagation={() => resultStore.deleteBatch(summary.batch_id)}
                  disabled={$resultStore.deletingBatchId !== null}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                </button>
                
                <!-- 화살표 아이콘 -->
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <button
        class="mb-4 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
        on:click={() => resultStore.selectBatch(null)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
        목록으로 돌아가기
      </button>
      
      <!-- 검색 기능 -->
      <div class="mb-6">
        <div class="flex justify-between items-center mb-3">
          <h2 class="text-lg font-semibold">검색</h2>
          <span class="px-2 py-1 bg-gray-100 text-sm rounded-full">
            {$resultStore.isIndividualMode ? '단독 수행' : '배치 수행'}
          </span>
        </div>
        <div class="mb-4">
          <SearchBar 
            value={searchQuery} 
            placeholder="질문 또는 답변 내용 검색..." 
            on:search={handleSearch}
            on:clear={clearSearch}
          />
          {#if searchQuery}
            <p class="mt-2 text-sm text-gray-600">
              "{searchQuery}" 검색 결과: {$resultStore.totalCount}개
              {#if $resultStore.totalCount > 0}
                <button 
                  class="ml-2 text-blue-500 hover:text-blue-700 underline"
                  on:click={clearSearch}
                >
                  검색 초기화
                </button>
              {/if}
            </p>
          {/if}
        </div>
      </div>
      
      <!-- 카테고리 필터 버튼 -->
      <div class="mb-6">
        <div class="flex justify-between items-center mb-3">
          <h2 class="text-lg font-semibold">카테고리 필터</h2>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            class="px-4 py-2 rounded-full text-sm {$resultStore.selectedCategory === '전체' ? 'bg-green-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}"
            on:click={() => handleCategoryFilter('전체')}
            disabled={$resultStore.loading}
          >
            전체
          </button>
          {#each $resultStore.categories as category}
            {#if category !== '전체'}
              <button
                class="px-4 py-2 rounded-full text-sm {
                  $resultStore.selectedCategory === category 
                    ? category === '에러' 
                      ? 'bg-red-500 text-white' 
                      : 'bg-green-500 text-white' 
                    : category === '에러'
                      ? 'bg-red-100 hover:bg-red-200 text-red-800'
                      : 'bg-gray-100 hover:bg-gray-200'
                }"
                on:click={() => handleCategoryFilter(category)}
                disabled={$resultStore.loading}
              >
                {category}
              </button>
            {/if}
          {/each}
        </div>
      </div>

      <div class="space-y-6">
        {#if $resultStore.responses.length === 0}
          <div class="p-8 text-center bg-gray-50 rounded-lg border">
            {#if $resultStore.searchQuery}
              <p class="text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline-block mr-1 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
                </svg>
                "<span class="font-medium">{$resultStore.searchQuery}</span>"에 대한 검색 결과가 없습니다.
                <button 
                  class="ml-2 text-blue-500 hover:text-blue-700 underline"
                  on:click={clearSearch}
                >
                  검색 초기화
                </button>
              </p>
            {:else}
              <p class="text-gray-500">표시할 결과가 없습니다.</p>
            {/if}
          </div>
        {:else}
          <!-- 결과 수와 페이지 정보 표시 -->
          <div class="flex justify-between items-center mb-4">
            <p class="text-sm text-gray-500">
              {#if $resultStore.searchQuery}
                검색 결과 {$resultStore.totalCount}개 중 {($resultStore.currentPage - 1) * $resultStore.itemsPerPage + 1}-{Math.min($resultStore.currentPage * $resultStore.itemsPerPage, $resultStore.totalCount)}
              {:else}
                총 {$resultStore.totalCount}개 결과 중 {($resultStore.currentPage - 1) * $resultStore.itemsPerPage + 1}-{Math.min($resultStore.currentPage * $resultStore.itemsPerPage, $resultStore.totalCount)}
              {/if}
            </p>
            <p class="text-sm text-gray-500">페이지 {$resultStore.currentPage} / {totalPages || 1}</p>
          </div>
          
          <!-- 현재 선택된 카테고리 다시 시도 버튼 -->
          <div class="mb-6">
            <button
              class="px-4 py-2 rounded-md {
                $resultStore.selectedCategory === '에러'
                  ? 'bg-red-100 hover:bg-red-200 text-red-800'
                  : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
              } text-sm flex items-center gap-1"
              on:click={() => openRetryModal($resultStore.selectedCategory)}
              disabled={$resultStore.loading || $resultStore.totalCount === 0}
              title="현재 카테고리의 모든 항목을 다시 시도합니다"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
              </svg>
              {$resultStore.selectedCategory === '전체' 
                ? '전체 카테고리 다시 시도' 
                : `'${$resultStore.selectedCategory}' 카테고리 다시 시도`}
              <span class="ml-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-700">
                {getCategoryTotalCount($resultStore.selectedCategory)}개 전체
              </span>
            </button>
            <p class="text-xs text-gray-500 mt-1 ml-1">
              선택된 카테고리의 모든 항목({getCategoryTotalCount($resultStore.selectedCategory)}개) API 호출을 다시 시도합니다.
            </p>
          </div>
          
          {#each $resultStore.responses as response}
            <ResponseItem 
              {response} 
              batchId={$resultStore.selectedBatchId}
              formatDate={formatDate}
              isValidArray={isValidArray}
              isDeleting={$resultStore.deletingIds.has(response.id) || $resultStore.retryingIds.has(response.id)}
              on:delete={handleDelete}
              on:retry={handleRetry}
            />
          {/each}
          
          <!-- 페이지네이션 UI -->
          {#if totalPages > 1}
            <div class="flex justify-center items-center gap-2 mt-8">
              <button
                on:click={() => resultStore.changePage(1)}
                disabled={$resultStore.currentPage === 1 || $resultStore.loading || $resultStore.isSearching}
                class="px-3 py-1 rounded border {$resultStore.currentPage === 1 || $resultStore.loading || $resultStore.isSearching ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'}"
              >
                &laquo;
              </button>
              
              <button
                on:click={() => resultStore.changePage($resultStore.currentPage - 1)}
                disabled={$resultStore.currentPage === 1 || $resultStore.loading || $resultStore.isSearching}
                class="px-3 py-1 rounded border {$resultStore.currentPage === 1 || $resultStore.loading || $resultStore.isSearching ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'}"
              >
                이전
              </button>
              
              {#each visiblePageNumbers as page}
                {#if page === 1 && $resultStore.currentPage > 3}
                  <button
                    on:click={() => resultStore.changePage(page)}
                    disabled={$resultStore.loading || $resultStore.isSearching}
                    class="px-3 py-1 rounded border {page === $resultStore.currentPage ? 'bg-green-500 text-white' : $resultStore.loading || $resultStore.isSearching ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'}"
                  >
                    {page}
                  </button>
                  {#if $resultStore.currentPage > 4}
                    <span class="px-1">...</span>
                  {/if}
                {:else if page === totalPages && $resultStore.currentPage < totalPages - 2}
                  {#if $resultStore.currentPage < totalPages - 3}
                    <span class="px-1">...</span>
                  {/if}
                  <button
                    on:click={() => resultStore.changePage(page)}
                    disabled={$resultStore.loading || $resultStore.isSearching}
                    class="px-3 py-1 rounded border {page === $resultStore.currentPage ? 'bg-green-500 text-white' : $resultStore.loading || $resultStore.isSearching ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'}"
                  >
                    {page}
                  </button>
                {:else}
                  <button
                    on:click={() => resultStore.changePage(page)}
                    disabled={$resultStore.loading || $resultStore.isSearching}
                    class="px-3 py-1 rounded border {page === $resultStore.currentPage ? 'bg-green-500 text-white' : $resultStore.loading || $resultStore.isSearching ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'}"
                  >
                    {page}
                  </button>
                {/if}
              {/each}
              
              <button
                on:click={() => resultStore.changePage($resultStore.currentPage + 1)}
                disabled={$resultStore.currentPage === totalPages || $resultStore.loading || $resultStore.isSearching}
                class="px-3 py-1 rounded border {$resultStore.currentPage === totalPages || $resultStore.loading || $resultStore.isSearching ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'}"
              >
                다음
              </button>
              
              <button
                on:click={() => resultStore.changePage(totalPages)}
                disabled={$resultStore.currentPage === totalPages || $resultStore.loading || $resultStore.isSearching}
                class="px-3 py-1 rounded border {$resultStore.currentPage === totalPages || $resultStore.loading || $resultStore.isSearching ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'}"
              >
                &raquo;
              </button>
            </div>
          {/if}
        {/if}
      </div>
    {/if}
  {/if}
</div>

<!-- Retry Modal -->
{#if showRetryModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 max-w-md w-full">
      <h2 class="text-xl font-bold mb-4">
        {selectedCategoryForRetry === '전체' 
          ? '전체 카테고리 다시 시도' 
          : selectedCategoryForRetry === '에러' 
            ? '에러 카테고리 다시 시도' 
            : `'${selectedCategoryForRetry}' 카테고리 다시 시도`}
      </h2>
      
      <div class="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
        <p class="mb-2 font-medium text-yellow-800">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          전체 항목 다시 시도 안내
        </p>
        <p class="text-sm text-yellow-700">       
          <span class="font-bold">선택된 '{selectedCategoryForRetry}' 카테고리의 모든 항목 {retryCount}개</span> API 호출을 다시 시도합니다.
        </p>
      </div>
      
      <p class="mb-4 text-sm text-gray-600">
        <span class="font-medium">총 처리 항목:</span> <span class="font-bold">{retryCount}개</span> 
        {#if $resultStore.responses.length !== retryCount}
          <span class="text-gray-500">(현재 페이지: {$resultStore.responses.length}개)</span>
        {/if}
      </p>
      
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">동시 처리 수</label>
        <input 
          type="number" 
          bind:value={concurrentLimit} 
          min="1" 
          max="10" 
          class="w-full px-3 py-2 border rounded-md"
        />
        <p class="text-xs text-gray-500 mt-1">동시에 처리할 요청 수를 설정합니다. (1-10)</p>
      </div>
      
      {#if batchRetryInProgress}
        <div class="mb-4">
          <p class="text-sm mb-2">진행 중... ({batchRetryProgress}/{batchRetryTotal})</p>
          <div class="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              class="bg-green-600 h-2.5 rounded-full" 
              style="width: {batchRetryProgress / batchRetryTotal * 100}%"
            ></div>
          </div>
        </div>
        
        <div class="flex justify-end">
          <button
            class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            on:click={cancelBatchRetry}
          >
            취소
          </button>
        </div>
      {:else}
        <div class="flex justify-end gap-2">
          <button
            class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            on:click={closeRetryModal}
          >
            취소
          </button>
          <button
            class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            on:click={startBatchRetry}
          >
            시작
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}

<!-- Batch Retry Progress Overlay (when modal is closed) -->
{#if batchRetryInProgress && !showRetryModal}
  <div class="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 z-40 w-80">
    <div class="flex justify-between items-center mb-2">
      <h3 class="font-semibold">다시 시도 진행 중</h3>
      <button 
        class="text-gray-500 hover:text-gray-700"
        on:click={() => showRetryModal = true}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
          <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
    
    <p class="text-sm mb-2">{batchRetryProgress}/{batchRetryTotal} 완료</p>
    <div class="w-full bg-gray-200 rounded-full h-2.5 mb-2">
      <div 
        class="bg-green-600 h-2.5 rounded-full" 
        style="width: {batchRetryProgress / batchRetryTotal * 100}%"
      ></div>
    </div>
    
    <button
      class="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
      on:click={cancelBatchRetry}
    >
      취소
    </button>
  </div>
{/if} 