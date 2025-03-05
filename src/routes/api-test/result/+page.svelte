<!-- src/routes/api-test/result/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { createResultStore } from '../stores/resultStoreCore';
  import { isValidArray, formatDate } from '../stores/resultStoreUtils';
  import { downloadBatchCSV } from '../download';
  import { responseStore } from '../stores/responseStore';
  import SearchBar from '../components/SearchBar.svelte';
  import BatchList from '../components/BatchList.svelte';
  import BatchRetryModal from '../components/BatchRetryModal.svelte';
  import BatchRetryProgress from '../components/BatchRetryProgress.svelte';
  import CategoryFilter from '../components/CategoryFilter.svelte';
  import ResultList from '../components/ResultList.svelte';
  import BackButton from '../components/BackButton.svelte';
  import LoadingSpinner from '../components/LoadingSpinner.svelte';
  
  // 직접 resultStore 인스턴스 생성
  const resultStore = createResultStore();
  
  onMount(() => {
    resultStore.loadData();
  });
  
  // Handle batch deletion
  function handleBatchDelete(event: CustomEvent<{ batchId: string }>) {
    const { batchId } = event.detail;
    resultStore.deleteBatch(batchId);
  }
  
  // Handle batch download
  async function handleBatchDownload(event: CustomEvent<{ batchId: string }>) {
    const { batchId } = event.detail;
    
    try {
      // Show loading indicator or notification
      const loadingToast = showToast('CSV 파일 생성 중...', 'info');
      
      // Load all responses for this batch if not already loaded
      await responseStore.loadAllResponsesForBatch(batchId);
      
      // Get all responses for this batch
      const responses = $responseStore.allResponses;
      
      // Download as CSV
      downloadBatchCSV(responses, batchId);
      
      // Hide loading indicator and show success
      hideToast(loadingToast);
      showToast('CSV 파일이 다운로드되었습니다.', 'success', 3000);
    } catch (error) {
      console.error('Error downloading batch:', error);
      showToast('다운로드 중 오류가 발생했습니다.', 'error', 5000);
    }
  }
  
  // Simple toast notification system
  function showToast(message: string, type: 'info' | 'success' | 'error' = 'info', duration: number = 0): string {
    const id = `toast-${Date.now()}`;
    const toast = document.createElement('div');
    toast.id = id;
    toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded-md text-white ${
      type === 'info' ? 'bg-blue-500' : 
      type === 'success' ? 'bg-green-500' : 
      'bg-red-500'
    } shadow-md z-50`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    if (duration > 0) {
      setTimeout(() => hideToast(id), duration);
    }
    
    return id;
  }
  
  function hideToast(id: string) {
    const toast = document.getElementById(id);
    if (toast) {
      toast.remove();
    }
  }
</script>

<div class="max-w-6xl mx-auto p-8">
  <h1 class="text-2xl font-bold mb-6">API 호출 결과 조회</h1>

  {#if $resultStore.loading}
    <LoadingSpinner message="데이터를 불러오는 중..." />
  {:else if $resultStore.error}
    <LoadingSpinner 
      error={$resultStore.error} 
      retryLabel="다시 시도"
      on:retry={() => resultStore.loadData()}
    />
  {:else}
    <BatchList 
      batchSummaries={$resultStore.batchSummaries}
      deletingBatchId={$resultStore.deletingBatchId}
      deletingBatchProgress={$resultStore.deletingBatchProgress}
      {formatDate}
      on:delete={handleBatchDelete}
      on:download={handleBatchDownload}
    />
  {/if}
</div> 