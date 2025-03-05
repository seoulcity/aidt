<!-- src/routes/api-test/result/[id]/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { createResultStore } from '../../stores/resultStoreCore';
  import { isValidArray, formatDate } from '../../stores/resultStoreUtils';
  import SearchBar from '../../components/SearchBar.svelte';
  import CategoryFilter from '../../components/CategoryFilter.svelte';
  import ResultList from '../../components/ResultList.svelte';
  import BackButton from '../../components/BackButton.svelte';
  import LoadingSpinner from '../../components/LoadingSpinner.svelte';
  import BatchRetryModal from '../../components/BatchRetryModal.svelte';
  import BatchRetryProgress from '../../components/BatchRetryProgress.svelte';
  
  // Get the batch ID from the URL parameter
  const batchId = $page.params.id;
  
  // Create a result store instance
  const resultStore = createResultStore();
  
  onMount(() => {
    // Load data and select the batch
    resultStore.loadData().then(() => {
      resultStore.selectBatch(batchId);
    });
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
  
  // Handle view event from ResponseItem component
  function handleView(event: CustomEvent<{ id: number }>) {
    const { id } = event.detail;
    // In a real application, you might navigate to a detail view for this specific item
    // For now, we'll just log it
    console.log(`View item with ID: ${id}`);
    // You could implement a modal or navigate to another page here
  }

  // Calculate total pages based on the current filtered data
  $: calculatedTotalPages = Math.ceil($resultStore.totalCount / $resultStore.itemsPerPage) || 1;
  
  // Get the visible page numbers
  $: calculatedVisiblePageNumbers = getVisiblePageNumbers($resultStore.currentPage, calculatedTotalPages);
  
  // Function to calculate visible page numbers
  function getVisiblePageNumbers(currentPage: number, totalPages: number): number[] {
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // Generate the array of page numbers
    const pages: number[] = [];
    
    // Always include first page
    if (startPage > 1) {
      pages.push(1);
    }
    
    // Add pages in the middle
    for (let i = startPage; i <= endPage; i++) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }
    
    // Always include last page
    if (endPage < totalPages) {
      pages.push(totalPages);
    }
    
    return pages;
  }

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
  
  async function startBatchRetry(event: CustomEvent<{ concurrentLimit: number }>) {
    const { concurrentLimit: limit } = event.detail;
    
    if (retryCount === 0) {
      closeRetryModal();
      return;
    }
    
    batchRetryInProgress = true;
    batchRetryProgress = 0;
    batchRetryTotal = retryCount;
    
    try {
      await resultStore.retryBatchByCategory(selectedCategoryForRetry, limit, (progress, total) => {
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
  function handleCategoryFilter(event: CustomEvent<{ category: string }>) {
    const { category } = event.detail;
    // Clear the search query in the component
    searchQuery = '';
    // Apply the category filter (which also clears search in the store)
    resultStore.filterByCategory(category);
  }
  
  // Handle page change
  function handlePageChange(event: CustomEvent<{ page: number }>) {
    const { page } = event.detail;
    resultStore.changePage(page);
  }
  
  // Navigate back to the batch list
  function navigateBack() {
    window.location.href = '/api-test/result';
  }
</script>

<div class="max-w-6xl mx-auto p-8">
  <h1 class="text-2xl font-bold mb-6">API 호출 결과 조회 - 배치 {batchId}</h1>

  {#if $resultStore.loading}
    <LoadingSpinner message="데이터를 불러오는 중..." />
  {:else if $resultStore.error}
    <LoadingSpinner 
      error={$resultStore.error} 
      retryLabel="다시 시도"
      on:retry={() => resultStore.loadData()}
    />
  {:else}
    <BackButton on:click={navigateBack} />
    
    <!-- 검색 기능 -->
    <SearchBar 
      value={searchQuery} 
      placeholder="질문 또는 답변 내용 검색..." 
      isIndividualMode={$resultStore.isIndividualMode}
      totalCount={$resultStore.totalCount}
      showSearchResults={!!searchQuery}
      on:search={handleSearch}
      on:clear={clearSearch}
    />
    
    <!-- 카테고리 필터 -->
    <CategoryFilter 
      categories={$resultStore.categories}
      selectedCategory={$resultStore.selectedCategory}
      loading={$resultStore.loading}
      totalCount={getCategoryTotalCount($resultStore.selectedCategory)}
      {getCategoryTotalCount}
      on:filter={handleCategoryFilter}
      on:retry={(e) => openRetryModal(e.detail.category)}
    />

    <!-- 페이지네이션 UI (상단) -->
    {#if calculatedTotalPages > 1}
      <div class="flex justify-between items-center mb-4">
        <p class="text-sm text-gray-500">
          {#if $resultStore.searchQuery}
            검색 결과 {$resultStore.totalCount}개 중 {($resultStore.currentPage - 1) * $resultStore.itemsPerPage + 1}-{Math.min($resultStore.currentPage * $resultStore.itemsPerPage, $resultStore.totalCount)}
          {:else}
            총 {$resultStore.totalCount}개 결과 중 {($resultStore.currentPage - 1) * $resultStore.itemsPerPage + 1}-{Math.min($resultStore.currentPage * $resultStore.itemsPerPage, $resultStore.totalCount)}
          {/if}
        </p>
        <div class="flex justify-center items-center gap-2">
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
          
          {#each calculatedVisiblePageNumbers as page}
            <button
              on:click={() => resultStore.changePage(page)}
              disabled={$resultStore.loading || $resultStore.isSearching}
              class="px-3 py-1 rounded border {page === $resultStore.currentPage ? 'bg-green-500 text-white' : $resultStore.loading || $resultStore.isSearching ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'}"
            >
              {page}
            </button>
          {/each}
          
          <button
            on:click={() => resultStore.changePage($resultStore.currentPage + 1)}
            disabled={$resultStore.currentPage === calculatedTotalPages || $resultStore.loading || $resultStore.isSearching}
            class="px-3 py-1 rounded border {$resultStore.currentPage === calculatedTotalPages || $resultStore.loading || $resultStore.isSearching ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'}"
          >
            다음
          </button>
          
          <button
            on:click={() => resultStore.changePage(calculatedTotalPages)}
            disabled={$resultStore.currentPage === calculatedTotalPages || $resultStore.loading || $resultStore.isSearching}
            class="px-3 py-1 rounded border {$resultStore.currentPage === calculatedTotalPages || $resultStore.loading || $resultStore.isSearching ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'}"
          >
            &raquo;
          </button>
        </div>
      </div>
    {/if}

    <!-- 결과 목록 -->
    <ResultList 
      responses={$resultStore.responses}
      batchId={$resultStore.selectedBatchId}
      {formatDate}
      {isValidArray}
      deletingIds={$resultStore.deletingIds}
      retryingIds={$resultStore.retryingIds}
      totalCount={$resultStore.totalCount}
      currentPage={$resultStore.currentPage}
      itemsPerPage={$resultStore.itemsPerPage}
      totalPages={calculatedTotalPages}
      visiblePageNumbers={calculatedVisiblePageNumbers}
      loading={$resultStore.loading}
      isSearching={$resultStore.isSearching}
      searchQuery={$resultStore.searchQuery}
      on:delete={handleDelete}
      on:retry={handleRetry}
      on:changePage={handlePageChange}
      on:clearSearch={clearSearch}
      on:view={handleView}
    />
  {/if}
</div>

<!-- Batch Retry Modal -->
<BatchRetryModal 
  showModal={showRetryModal}
  selectedCategory={selectedCategoryForRetry}
  {retryCount}
  {concurrentLimit}
  {batchRetryInProgress}
  {batchRetryProgress}
  {batchRetryTotal}
  on:close={closeRetryModal}
  on:start={startBatchRetry}
  on:cancel={cancelBatchRetry}
/>

<!-- Batch Retry Progress Overlay (when modal is closed) -->
<BatchRetryProgress 
  {batchRetryInProgress}
  {batchRetryProgress}
  {batchRetryTotal}
  on:showModal={() => showRetryModal = true}
  on:cancel={cancelBatchRetry}
/> 