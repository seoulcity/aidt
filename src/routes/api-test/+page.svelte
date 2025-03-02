<!-- src/routes/api-test/+page.svelte -->
<script lang="ts">
  import { clarioStore, handleSubmit } from './clarioStore';
  import { downloadJSON, downloadCSV } from './download';
  import { parseCSV, readEntireCSV, downloadParsedCSV, type CSVPreview } from './csvUtils';
  import Pagination from './components/Pagination.svelte';
  import ResponseRenderer from './components/ResponseRenderer.svelte';
  import { queryQueueStore, type QueryItem } from './queryQueueStore';

  $: ({ loading, error, streamingText, metadata, formData } = $clarioStore);
  $: queryQueue = $queryQueueStore;

  let csvFile: File | null = null;
  let csvPreview: CSVPreview | null = null;
  let selectedQuestionIndex: number = -1;
  let selectedCategoryIndex: number = -1;
  let questions: Array<{ text: string; category: string }> = [];
  let concurrentLimit = 3; // 동시 처리할 최대 요청 수

  // Pagination
  let currentPage = 1;
  const questionsPerPage = 20;
  $: totalPages = Math.ceil(questions.length / questionsPerPage);
  $: paginatedQuestions = questions.slice(
    (currentPage - 1) * questionsPerPage,
    currentPage * questionsPerPage
  );

  function handlePageChange(page: number) {
    currentPage = page;
  }

  function isValidArray<T>(arr: T[] | undefined): arr is T[] {
    return Array.isArray(arr) && arr.length > 0;
  }

  async function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      csvFile = file;
      csvPreview = await parseCSV(file);
      selectedQuestionIndex = -1;
      selectedCategoryIndex = -1;
      questions = [];
      currentQuestionIndex = -1;
    } catch (e) {
      alert(e instanceof Error ? e.message : 'CSV 파일을 처리하는 중 오류가 발생했습니다.');
    }
  }

  async function handleColumnSelect(index: number, type: 'question' | 'category') {
    if (!csvFile) return;
    
    if (type === 'question') {
      // Toggle selection - if already selected, deselect it
      selectedQuestionIndex = selectedQuestionIndex === index ? -1 : index;
    } else {
      // Toggle selection - if already selected, deselect it
      selectedCategoryIndex = selectedCategoryIndex === index ? -1 : index;
    }

    // Only load questions if a question column is selected
    if (selectedQuestionIndex >= 0) {
      try {
        const result = await readEntireCSV(csvFile, selectedQuestionIndex, selectedCategoryIndex);
        questions = result;
        // Reset to page 1 when changing columns
        currentPage = 1;
      } catch (e) {
        alert(e instanceof Error ? e.message : 'CSV 파일을 처리하는 중 오류가 발생했습니다.');
      }
    } else {
      // Clear questions if no question column is selected
      questions = [];
    }
  }

  // For tracking batch progress
  let currentQuestionIndex: number = -1;
  let batchProcessing = false;
  let processingError: string | null = null;
  let processedCount = 0;
  let totalProcessed = 0;

  // Add a variable to track if batch was cancelled
  let batchCancelled = false;

  async function startBatchProcess() {
    if (questions.length === 0) return;
    
    batchProcessing = true;
    processingError = null;
    processedCount = 0;
    totalProcessed = 0;
    currentQuestionIndex = 0;
    batchCancelled = false;

    try {
      // Set the max concurrent limit
      queryQueueStore.setMaxConcurrent(concurrentLimit);
      
      // Add all questions to the queue
      // This will generate a single batch ID for all queries
      queryQueueStore.addQueries(questions);
      
      // Update the batch processing status based on the queue
      const unsubscribe = queryQueueStore.subscribe(state => {
        processedCount = state.activeQueries.length;
        totalProcessed = state.queue.filter(q => q.status === 'completed' || q.status === 'error').length;
        batchProcessing = state.processing && state.queue.some(q => q.status === 'queued' || q.status === 'processing');
        
        if (!batchProcessing && totalProcessed > 0) {
          // All processing is done or cancelled
          unsubscribe();
        }
      });
    } catch (e) {
      processingError = e instanceof Error ? e.message : '처리 중 오류가 발생했습니다.';
      batchProcessing = false;
    }
  }

  function handleQueryComplete(event: CustomEvent<{ index: number, success: boolean }>) {
    // This is handled by the queryQueueStore now
  }

  function handleQueryRemove(event: CustomEvent<{ index: number }>) {
    const query = queryQueue.queue[event.detail.index];
    if (query) {
      queryQueueStore.removeQuery(query.id);
    }
  }

  function clearCompletedQueries() {
    queryQueueStore.clearCompleted();
  }

  // Add function to cancel batch processing
  function cancelBatchProcess() {
    if (confirm('진행 중인 배치 처리를 취소하시겠습니까? 대기 중인 모든 요청이 취소됩니다.')) {
      queryQueueStore.cancelBatchProcess();
      batchCancelled = true;
    }
  }

  $: progress = questions.length > 0 ? 
    Math.round((totalProcessed / questions.length) * 100) : 0;

  // Form submission handler
  function onFormSubmit(event: SubmitEvent) {
    event.preventDefault();
    handleSubmit();
  }
</script>

<style>
  .csv-preview-table {
    table-layout: fixed;
    width: 100%;
  }

  .csv-preview-table th {
    @apply px-4 py-2 bg-gray-50;
    width: auto;
    min-width: 120px;
    max-width: 200px;
  }

  .csv-preview-table td {
    @apply px-4 py-2;
    word-wrap: break-word;
    white-space: pre-wrap;
    min-width: 120px;
    max-width: 200px;
    vertical-align: top;
  }

  .csv-preview-table td:first-child,
  .csv-preview-table th:first-child {
    position: sticky;
    left: 0;
    background: white;
    z-index: 10;
  }

  .column-selection-hint {
    border: 2px dashed #22c55e;
    padding: 1rem;
    border-radius: 0.5rem;
    background-color: rgba(34, 197, 94, 0.05);
  }
  
  .column-button {
    transition: all 0.2s;
  }
  
  .column-button:hover {
    background-color: rgba(34, 197, 94, 0.1);
    border-radius: 0.25rem;
  }
  
  .column-button.selected {
    background-color: rgba(34, 197, 94, 0.2);
    border-radius: 0.25rem;
  }
</style>

<div class="max-w-3xl mx-auto p-8">
  {#if loading}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
        <div class="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent mb-4"></div>
        <p class="text-lg">Generating response...</p>
      </div>
    </div>
  {/if}

  <h1 class="text-2xl font-bold mb-6">ClaRIO API Test</h1>
  
  <div class="mb-8 space-y-4">
    <div class="border-b pb-4">
      <h2 class="text-lg font-semibold mb-4">CSV 파일 업로드</h2>
      <input 
        type="file" 
        accept=".csv"
        on:change={handleFileSelect}
        class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
      />
    </div>

    {#if csvPreview}
      <div class="border rounded-lg p-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-semibold">CSV 미리보기 (상위 5개 행)</h3>
          <button
            on:click={() => csvPreview && downloadParsedCSV(csvPreview.headers, csvPreview.rows, 'parsed_preview.csv')}
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
            미리보기 다운로드
          </button>
        </div>
        
        {#if selectedQuestionIndex === -1}
          <div class="column-selection-hint mb-4">
            <div class="flex items-center gap-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
              </svg>
              <h4 class="font-semibold text-green-700">질문 컬럼을 선택해주세요</h4>
            </div>
            <p class="text-sm text-gray-600">아래 표에서 질문이 포함된 컬럼의 헤더를 클릭하여 선택해주세요. 질문 컬럼을 선택해야 배치 처리를 진행할 수 있습니다.</p>
          </div>
        {/if}
        
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 csv-preview-table">
            <thead>
              <tr>
                {#each csvPreview.headers as header, i}
                  <th>
                    <div class="space-y-2">
                      <button
                        class="w-full text-left font-semibold p-2 column-button {selectedQuestionIndex === i ? 'selected text-green-600' : 'text-gray-900'}"
                        on:click={() => handleColumnSelect(i, 'question')}
                      >
                        <div class="flex items-center gap-1">
                          {#if selectedQuestionIndex === i}
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                            </svg>
                          {/if}
                          {header}
                        </div>
                        {#if selectedQuestionIndex === i}
                          <span class="text-xs block mt-1 bg-green-100 text-green-800 px-2 py-1 rounded-full inline-block">질문 컬럼</span>
                        {/if}
                      </button>
                      <button
                        class="w-full text-left text-sm p-2 column-button {selectedCategoryIndex === i ? 'selected text-blue-600 font-semibold' : 'text-gray-600'}"
                        on:click={() => handleColumnSelect(i, 'category')}
                      >
                        <div class="flex items-center gap-1">
                          {#if selectedCategoryIndex === i}
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                            </svg>
                          {/if}
                          카테고리로 선택
                        </div>
                        {#if selectedCategoryIndex === i}
                          <span class="text-xs block mt-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full inline-block">카테고리 컬럼</span>
                        {/if}
                      </button>
                    </div>
                  </th>
                {/each}
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              {#each csvPreview.rows as row}
                <tr>
                  {#each row as cell}
                    <td>{cell}</td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        {#if selectedQuestionIndex >= 0}
          <div class="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <div class="flex items-center gap-2 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <p class="text-sm font-medium text-green-800">선택된 질문 컬럼: <span class="font-bold">{csvPreview.headers[selectedQuestionIndex]}</span></p>
            </div>
            {#if selectedCategoryIndex >= 0}
              <div class="flex items-center gap-2 mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <p class="text-sm font-medium text-blue-800">선택된 카테고리 컬럼: <span class="font-bold">{csvPreview.headers[selectedCategoryIndex]}</span></p>
              </div>
            {/if}
            <p class="text-sm text-gray-600 mt-1">총 <span class="font-bold">{questions.length}</span>개의 질문이 로드되었습니다.</p>
          </div>
        {/if}
      </div>

      {#if questions.length > 0}
        <div class="border rounded-lg p-4">
          <h3 class="font-semibold mb-4">로드된 질문 목록</h3>
          <div class="space-y-2 mb-4">
            {#each paginatedQuestions as question, i}
              <div class="p-2 {i % 2 === 0 ? 'bg-gray-50' : 'bg-white'} rounded">
                <p class="text-sm">
                  <span class="font-medium text-gray-500">
                    {(currentPage - 1) * questionsPerPage + i + 1}.
                  </span>
                  {question.text}
                  {#if question.category}
                    <span class="text-xs text-gray-500 ml-2">({question.category})</span>
                  {/if}
                </p>
              </div>
            {/each}
          </div>

          <!-- Use the Pagination component -->
          {#if totalPages > 1}
            <Pagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={handlePageChange} 
            />
          {/if}
        </div>

        <div class="border rounded-lg p-4">
          <div class="flex justify-between items-center mb-4">
            <h3 class="font-semibold">배치 처리</h3>
            <div class="flex gap-2">
              <div class="flex items-center">
                <label for="concurrentLimit" class="mr-2 text-sm">동시 처리 수:</label>
                <input 
                  type="number" 
                  id="concurrentLimit" 
                  bind:value={concurrentLimit} 
                  min="1" 
                  max="5"
                  class="w-16 p-1 border rounded text-center"
                />
              </div>
              <button
                on:click={startBatchProcess}
                disabled={batchProcessing}
                class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {batchProcessing ? '처리 중...' : '실행'}
              </button>
              {#if batchProcessing}
                <button
                  on:click={cancelBatchProcess}
                  class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  취소
                </button>
              {/if}
              <button
                on:click={clearCompletedQueries}
                disabled={queryQueue.queue.filter(q => q.status === 'completed' || q.status === 'error').length === 0}
                class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                완료된 항목 지우기
              </button>
            </div>
          </div>

          {#if batchProcessing}
            <div class="space-y-2 mb-4">
              <div class="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  class="h-full bg-green-500 transition-all duration-200"
                  style="width: {progress}%"
                />
              </div>
              <p class="text-sm text-gray-600">
                처리 중: {totalProcessed} / {questions.length} ({progress}%)
              </p>
              <p class="text-sm text-gray-600">
                현재 {processedCount}개의 요청 처리 중
              </p>
            </div>
          {/if}
          
          {#if batchCancelled && !batchProcessing}
            <div class="p-3 bg-yellow-50 border border-yellow-200 rounded-md mb-4">
              <p class="text-yellow-700">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
                배치 처리가 취소되었습니다. 대기 중이던 요청들은 취소되었습니다.
              </p>
            </div>
          {/if}

          {#if processingError}
            <div class="mt-4 p-4 bg-red-50 text-red-700 rounded">
              {processingError}
            </div>
          {/if}
        </div>
        
        <!-- Response Renderers -->
        {#if queryQueue.queue.length > 0}
          <div class="mt-4">
            <h3 class="font-semibold mb-4">응답 목록</h3>
            <div class="space-y-4">
              {#each queryQueue.queue as query, i}
                <ResponseRenderer 
                  queryText={query.text}
                  category={query.category}
                  responseText={query.responseText}
                  metadata={query.metadata}
                  loading={query.loading}
                  error={query.error}
                  index={i}
                  saveStatus={query.saveStatus}
                  on:complete={handleQueryComplete}
                  on:remove={handleQueryRemove}
                />
              {/each}
            </div>
          </div>
        {/if}
      {:else if csvPreview}
        <div class="border rounded-lg p-6 mt-4 bg-yellow-50 border-yellow-200">
          <div class="flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 class="font-semibold text-yellow-800 mb-1">질문 목록이 비어 있습니다</h3>
              <p class="text-sm text-yellow-700">CSV 파일에서 <span class="font-bold">질문 컬럼</span>을 선택해주세요. 질문 컬럼을 선택하면 질문 목록이 자동으로 로드됩니다.</p>
            </div>
          </div>
        </div>
      {/if}
    {/if}
  </div>

  <form on:submit|preventDefault={onFormSubmit} class="flex flex-col gap-4 mb-8">
    <div class="flex flex-col gap-2">
      <label for="query">Query:</label>
      <input 
        type="text" 
        id="query" 
        bind:value={formData.query} 
        required
        class="p-2 text-base border border-gray-300 rounded-md"
      />
    </div>
    
    <div class="flex flex-col gap-2">
      <label for="group_id">Group ID:</label>
      <input 
        type="text" 
        id="group_id" 
        bind:value={formData.group_id} 
        class="p-2 text-base border border-gray-300 rounded-md"
      />
    </div>
    
    <div class="flex flex-col gap-2">
      <label for="persona">Persona:</label>
      <select 
        id="persona" 
        bind:value={formData.persona} 
        class="p-2 text-base border border-gray-300 rounded-md"
      >
        <option value="선생님">선생님</option>
        <option value="친구">친구</option>
        <option value="전문가">전문가</option>
      </select>
    </div>
    
    <div class="flex flex-col gap-2">
      <label for="user_type">User Type:</label>
      <input 
        type="text" 
        id="user_type" 
        bind:value={formData.user_type} 
        class="p-2 text-base border border-gray-300 rounded-md"
      />
    </div>
    
    <button 
      type="submit" 
      class="mt-2 p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
      disabled={loading}
    >
      {loading ? 'Submitting...' : 'Submit'}
    </button>
  </form>
  
  {#if streamingText}
    <div class="mb-8 p-4 bg-green-50 rounded-lg">
      <h2 class="text-lg font-semibold mb-2">Response:</h2>
      <div class="prose max-w-none">
        <p class="whitespace-pre-wrap">{streamingText}</p>
      </div>
      
      {#if metadata}
        <div class="flex gap-2 mt-4">
          <button
            on:click={() => downloadJSON(streamingText, metadata)}
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
            Download JSON
          </button>
          <button
            on:click={() => downloadCSV(streamingText, metadata)}
            class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
            Download CSV
          </button>
        </div>
        
        <div class="mt-4 space-y-3">
          {#if isValidArray(metadata.reference)}
            <div class="border rounded-md p-3">
              <h3 class="font-semibold mb-1">References:</h3>
              <ul class="list-disc pl-5">
                {#each metadata.reference as ref}
                  <li>{ref}</li>
                {/each}
              </ul>
            </div>
          {/if}

          {#if isValidArray(metadata.recommended_questions)}
            <div class="border rounded-md p-3">
              <h3 class="font-semibold mb-1">Recommended Questions:</h3>
              <ul class="list-disc pl-5">
                {#each metadata.recommended_questions as question}
                  <li>{question}</li>
                {/each}
              </ul>
            </div>
          {/if}

          {#if isValidArray(metadata.images)}
            <div class="border rounded-md p-3">
              <h3 class="font-semibold mb-1">Images:</h3>
              <div class="grid grid-cols-2 gap-2">
                {#each metadata.images as image}
                  <img src={image} alt="Response image" class="w-full h-auto rounded" />
                {/each}
              </div>
            </div>
          {/if}

          <div class="border rounded-md p-3">
            <h3 class="font-semibold mb-1">Additional Information:</h3>
            <dl class="grid grid-cols-2 gap-1">
              <dt class="font-semibold">Action:</dt>
              <dd>{metadata.action}</dd>
              {#if metadata.sub_action}
                <dt class="font-semibold">Sub Action:</dt>
                <dd>{metadata.sub_action}</dd>
              {/if}
              <dt class="font-semibold">Token Count:</dt>
              <dd>{metadata.token_count}</dd>
              <dt class="font-semibold">Latency:</dt>
              <dd>{metadata.latency.toFixed(2)}s</dd>
              <dt class="font-semibold">Response ID:</dt>
              <dd class="break-all">{metadata.response_id}</dd>
            </dl>
          </div>
        </div>
      {/if}
    </div>
  {/if}
  
  {#if error}
    <div class="p-4 bg-red-50 text-red-700 rounded-lg">
      <h2 class="text-lg font-semibold mb-2">Error:</h2>
      <pre class="whitespace-pre-wrap">{JSON.stringify(error, null, 2)}</pre>
    </div>
  {/if}
</div> 