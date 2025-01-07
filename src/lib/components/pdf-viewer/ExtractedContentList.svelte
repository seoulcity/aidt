<!-- src/lib/components/pdf-viewer/ExtractedContentList.svelte -->
<script>
  export let extractedContents = [];
  export let isVectorizing = false;
  export let formData;
  
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  function removeExtractedContent(index) {
    dispatch('removeContent', { index });
  }

  async function vectorizeContents() {
    if (extractedContents.length === 0) return;
    
    try {
      dispatch('vectorizingStart');
      const combinedText = extractedContents
        .map(content => content.text)
        .join('\n\n');
      
      if (!formData.textbook || !formData.unit || !formData.topic) {
        throw new Error('교과서명, 단원, 주제를 모두 입력해주세요.');
      }

      const response = await fetch('/api/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          context: combinedText
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }

      dispatch('vectorizingComplete');
      
    } catch (error) {
      console.error('Vectorization failed:', error);
      dispatch('vectorizingError', { error: error.message });
    }
  }

  // 마크다운 표를 HTML 표로 변환하는 함수
  function markdownToHtmlTable(markdown) {
    if (!markdown) return '';
    
    const rows = markdown.trim().split('\n');
    if (rows.length < 3) return ''; // 헤더, 구분선, 데이터 최소 3줄 필요
    
    let html = '<table class="min-w-full border-collapse border border-gray-300">';
    
    // 헤더 처리 - 첫 번째와 마지막 파이프 문자 제거 후 분할
    const headerRow = rows[0];
    const headers = headerRow.slice(1, -1).split('|');
    html += '<thead class="bg-gray-100"><tr>';
    headers.forEach(header => {
        html += `<th class="border border-gray-300 px-4 py-2">${header.trim()}</th>`;
    });
    html += '</tr></thead>';
    
    // 본문 처리 (구분선 제외)
    html += '<tbody>';
    rows.slice(2).forEach(row => {
        // 첫 번째와 마지막 파이프 문자 제거 후 분할
        const cells = row.slice(1, -1).split('|');
        html += '<tr>';
        cells.forEach(cell => {
            html += `<td class="border border-gray-300 px-4 py-2">${cell.trim()}</td>`;
        });
        html += '</tr>';
    });
    html += '</tbody></table>';
    
    return html;
  }
</script>

{#if extractedContents.length > 0}
  <div class="mt-4 bg-white p-6 rounded-lg shadow">
    <div class="mb-6 grid grid-cols-2 gap-6">
      <div>
        <label class="block text-sm font-medium text-gray-700">ID</label>
        <div class="mt-1 block w-full py-2 px-3 bg-gray-100 rounded-md">
          {formData.id}
        </div>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700">교과서명</label>
        <input 
          type="text" 
          bind:value={formData.textbook} 
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
          required 
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700">학교급</label>
        <select 
          bind:value={formData.schoolLevel} 
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option>초등학교</option>
          <option>중학교</option>
          <option>고등학교</option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700">학년</label>
        <select 
          bind:value={formData.grade} 
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option>1</option>
          <option>2</option>
          <option>3</option>
          <option>4</option>
          <option>5</option>
          <option>6</option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700">단원</label>
        <input 
          type="text" 
          bind:value={formData.unit} 
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
          required 
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700">주제</label>
        <input 
          type="text" 
          bind:value={formData.topic} 
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
          required 
        />
      </div>
    </div>

    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-semibold">추출된 내용 목록</h3>
      <button
        type="button"
        on:click={vectorizeContents}
        class="inline-flex items-center px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
        disabled={isVectorizing || !formData.textbook || !formData.unit || !formData.topic}
      >
        {#if isVectorizing}
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>임베딩 생성 중...</span>
        {:else}
          <span>임베딩 생성</span>
        {/if}
      </button>
    </div>
    
    <div class="space-y-4">
      {#each extractedContents as content, i}
        <div class="p-3 bg-gray-50 rounded-md">
          <div class="flex justify-between items-start mb-2">
            <div class="text-sm text-gray-600">
              페이지 {content.page} - {content.type === 'text' ? '텍스트' : 
                                     content.type === 'tables' ? '표' : '이미지'}
            </div>
            <button
              type="button"
              on:click={() => removeExtractedContent(i)}
              class="text-red-600 hover:text-red-800"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {#if content.type === 'tables'}
            <div class="mb-4">
              <h4 class="text-sm font-semibold mb-2">마크다운 원본:</h4>
              <pre class="whitespace-pre-wrap text-sm bg-gray-100 p-2 rounded">{content.text}</pre>
            </div>
            <div class="overflow-x-auto">
              <h4 class="text-sm font-semibold mb-2">렌더링된 표:</h4>
              {@html markdownToHtmlTable(content.text)}
            </div>
          {:else}
            <pre class="whitespace-pre-wrap text-sm">
              {typeof content.text === 'object' ? JSON.stringify(content.text, null, 2) : content.text}
            </pre>
          {/if}
        </div>
      {/each}
    </div>
  </div>
{/if} 

<style>
  input, select {
    width: 100%;
  }
  
  :global(input:focus), :global(select:focus) {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }
</style> 