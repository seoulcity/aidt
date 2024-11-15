<script>
  import { PDFService } from '$lib/services/pdfService';
  
  export let parsingMode = 'viewer';
  export let extractionType = 'text';
  export let selectedElements = [];
  export let file;
  export let currentPage;
  export let pdfViewer;
  
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  function handleParsingModeChange(event) {
    dispatch('parsingModeChange', { mode: event.target.value });
  }

  function handleExtractionTypeChange(event) {
    dispatch('extractionTypeChange', { type: event.target.value });
  }

  async function extractSelectedElements() {
    if (!selectedElements.length) return;
    
    try {
      dispatch('extractingStart');
      
      const content = await PDFService.extractSelectedElements(
        file,
        extractionType,
        currentPage,
        selectedElements
      );
      
      dispatch('extractingComplete', {
        content: {
          text: content,
          page: currentPage,
          type: extractionType,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Extraction failed:', error);
      dispatch('extractingError', { error });
    }
  }
</script>

<!-- 파싱 모드 선택 -->
<div class="mb-4 bg-white p-4 rounded-lg shadow">
  <h3 class="text-lg font-semibold mb-2">파싱 방식 선택</h3>
  <div class="flex space-x-4">
    <label class="inline-flex items-center">
      <input
        type="radio"
        name="parsingMode"
        value="viewer"
        checked={parsingMode === 'viewer'}
        on:change={handleParsingModeChange}
        class="form-radio"
      />
      <span class="ml-2">PDF 뷰어 (수동 선택)</span>
    </label>
    <label class="inline-flex items-center">
      <input
        type="radio"
        name="parsingMode"
        value="pymupdf"
        checked={parsingMode === 'pymupdf'}
        on:change={handleParsingModeChange}
        class="form-radio"
      />
      <span class="ml-2">PyMuPDF (자동 추출)</span>
    </label>
  </div>
</div>

<!-- PyMuPDF 모드 컨트롤 -->
{#if parsingMode === 'pymupdf'}
  <div class="mt-4 bg-white p-4 rounded-lg shadow">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center space-x-4">
        <label class="inline-flex items-center">
          <input
            type="radio"
            name="extractionType"
            value="text"
            checked={extractionType === 'text'}
            on:change={handleExtractionTypeChange}
            class="form-radio"
          />
          <span class="ml-2">텍스트</span>
        </label>
        
        <label class="inline-flex items-center">
          <input
            type="radio"
            name="extractionType"
            value="tables"
            checked={extractionType === 'tables'}
            on:change={handleExtractionTypeChange}
            class="form-radio"
          />
          <span class="ml-2">표</span>
        </label>
        
        <label class="inline-flex items-center">
          <input
            type="radio"
            name="extractionType"
            value="images"
            checked={extractionType === 'images'}
            on:change={handleExtractionTypeChange}
            class="form-radio"
          />
          <span class="ml-2">이미지</span>
        </label>
      </div>
      
      <button
        type="button"
        on:click={extractSelectedElements}
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        disabled={selectedElements.length === 0}
      >
        {#if selectedElements.length > 0}
          선택된 {selectedElements.length}개 항목 추출
        {:else}
          추출할 항목 선택
        {/if}
      </button>
    </div>
  </div>
{/if} 