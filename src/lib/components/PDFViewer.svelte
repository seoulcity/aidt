<!-- src/lib/components/PDFViewer.svelte -->
<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import { browser } from '$app/environment';
  import * as pdfjsLib from 'pdfjs-dist';
  import { PDFViewerAPI } from '$lib/api/pdfViewerAPI';
  import { PDFService } from '$lib/services/pdfService';
  import ExtractedContentList from './pdf-viewer/ExtractedContentList.svelte';
  import CurrentExtractedContent from './pdf-viewer/CurrentExtractedContent.svelte';
  import PDFControls from './pdf-viewer/PDFControls.svelte';
  import ViewerModeControls from './pdf-viewer/ViewerModeControls.svelte';
  import PyMuPDFElements from './pdf-viewer/PyMuPDFElements.svelte';
  
  const dispatch = createEventDispatcher();
  
  export let file = null;
  let canvas;
  let overlayDiv;
  let pdfViewer;
  let parsingMode = 'viewer';
  let extractionType = 'text';
  let scale = 'auto';
  let currentPage = 1;
  let totalPages = 0;
  
  let isExtracting = false;
  let extractionProgress = '';
  let extractedContents = [];
  let currentContent = null;
  
  let isVectorizing = false;
  
  let isRendering = false;
  
  let pageElements = null;  // 페이지 요소들을 저장할 변수
  let selectedElements = []; // 선택된 요소들을 저장할 변수
  
  if (browser) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }

  // 리사이즈 핸들러 추가
  let resizeTimeout;
  
  function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (pdfViewer) {
        pdfViewer.handleResize();
      }
    }, 100); // 디바운스 처리
  }

  onMount(async () => {
    if (browser) {
        pdfViewer = new PDFViewerAPI(canvas, overlayDiv);
        if (file) {
            try {
                await pdfViewer.loadPDF(file);
                currentPage = pdfViewer.getCurrentPage();
                totalPages = pdfViewer.getTotalPages();
            } catch (error) {
                console.error('PDF loading error:', error);
            }
        }
        
        window.addEventListener('resize', handleResize);
    }
    
    return () => {
        if (pdfViewer) {
            pdfViewer.cleanup();
        }
        window.removeEventListener('resize', handleResize);
    };
  });

  $: if (file && pdfViewer && browser && !pdfViewer.pdf) {
    (async () => {
        try {
            isRendering = true;
            const success = await pdfViewer.loadPDF(file);
            if (success) {
                currentPage = pdfViewer.getCurrentPage();
                totalPages = pdfViewer.getTotalPages();
                await pdfViewer.renderPage(currentPage, parsingMode === 'viewer', parsingMode);
            }
        } catch (error) {
            console.error('PDF loading error:', error);
        } finally {
            isRendering = false;
        }
    })();
  }

  function handleConfirmExtraction() {
    if (currentContent) {
      extractedContents = [...extractedContents, currentContent];
      currentContent = null;
    }
  }

  function handleCancelExtraction() {
    currentContent = null;
  }
  
  $: if (parsingMode && pdfViewer) {
    (async () => {
        try {
            isRendering = true;
            await pdfViewer.renderPage(currentPage, parsingMode === 'viewer', parsingMode);
            if (parsingMode === 'pymupdf') {
                try {
                    await loadPageElements();
                } catch (error) {
                    console.warn('Failed to load page elements on mode change:', error);
                    pageElements = [];
                }
            }
        } catch (error) {
            console.error('Parsing mode change error:', error);
        } finally {
            isRendering = false;
        }
    })();
  }

  // scale 변경될 때 PDFViewerAPI에 반영
  $: if (pdfViewer && scale) {
    pdfViewer.setScale(scale);
  }

  // PDF 정리를 위한 cleanup 함수
  onMount(() => {
    return () => {
      // 컴포넌트 언마운트 시 PDF 정리
      if (pdfViewer) {
        pdfViewer.cleanup();
      }
      // 캔버스 초기화
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
  });

  // 페이지 이동 시에도 현재 파싱 모드 유지
  async function changePage(newPage) {
    if (!pdfViewer || newPage < 1 || newPage > totalPages || isRendering) {
        return;
    }

    try {
        isRendering = true;
        
        // overlayDiv 초기화
        if (overlayDiv) {
            overlayDiv.innerHTML = '';
        }
        
        // 페이지 렌더링
        await pdfViewer.renderPage(newPage, parsingMode === 'viewer', parsingMode);
        currentPage = newPage;
        
        // PyMuPDF 모드일 경우 페이지 요소 로드 시도
        if (parsingMode === 'pymupdf') {
            try {
                pageElements = await PDFService.analyzePageElements(file, newPage);
                selectedElements = []; // 페이지 변경 시 선택된 요소 초기화
                if (pdfViewer) {
                    pdfViewer.setPageElements(pageElements);
                }
            } catch (error) {
                console.warn('Failed to load page elements:', error);
                pageElements = [];
            }
        }
    } catch (error) {
        console.error('Page change error:', error);
    } finally {
        isRendering = false;
    }
  }

  // loadPageElements 함수 수정
  async function loadPageElements() {
    if (!file || !pdfViewer) return;
    
    try {
        const elements = await PDFService.analyzePageElements(file, currentPage);
        if (Array.isArray(elements)) {
            pageElements = elements;
            selectedElements = []; // 페이지 변경 시 선택된 요소 초기화
            
            // PDFViewerAPI에 요소 정보 전달
            pdfViewer.setPageElements(pageElements);
        } else {
            throw new Error('Invalid page elements data');
        }
    } catch (error) {
        console.error('Failed to load page elements:', error);
        pageElements = [];
        selectedElements = [];
    }
  }

  // parsingMode 변경 감시 수정
  $: if (parsingMode === 'pymupdf' && file && pdfViewer) {
    loadPageElements().catch(error => {
        console.error('Failed to load page elements on mode change:', error);
    });
  }

  // 페이지가 변경될 때도 요소 다시 로드
  $: if (currentPage && parsingMode === 'pymupdf') {
    loadPageElements();
  }

  function handleExtractingStart() {
    isExtracting = true;
  }

  function handleExtractingComplete(event) {
    extractedContents = [...extractedContents, event.detail.content];
    isExtracting = false;
    selectedElements = [];
    pageElements = pageElements.map(e => ({ ...e, selected: false }));
    pdfViewer.setPageElements(pageElements);
  }

  function handleExtractingError() {
    isExtracting = false;
  }

  function handleVectorizingStart() {
    isVectorizing = true;
  }

  function handleVectorizingComplete(event) {
    dispatch('addToEmbedding', { text: event.detail.text });
    extractedContents = [];
    isVectorizing = false;
  }

  function handleVectorizingError() {
    isVectorizing = false;
  }

  function handleParsingModeChange(event) {
    parsingMode = event.detail.mode;
  }

  function handleExtractionTypeChange(event) {
    extractionType = event.detail.type;
  }

  function handleExtractText(event) {
    extractedContents = [...extractedContents, event.detail];
  }

  function handleSelectionChange(event) {
    selectedElements = event.detail.selectedElements;
    pageElements = event.detail.pageElements;
  }

  function handleRemoveContent(event) {
    const { index } = event.detail;
    extractedContents = extractedContents.filter((_, i) => i !== index);
  }
</script>

<div class="flex gap-4">
  <!-- 좌측: PDF 뷰어 -->
  <div class="w-1/2">
    <PDFControls
      {parsingMode}
      {extractionType}
      {selectedElements}
      {file}
      {currentPage}
      {pdfViewer}
      on:parsingModeChange={handleParsingModeChange}
      on:extractionTypeChange={handleExtractionTypeChange}
      on:extractingStart={handleExtractingStart}
      on:extractingComplete={handleExtractingComplete}
      on:extractingError={handleExtractingError}
    />

    <!-- PDF 뷰어 컨트롤 -->
    <div class="controls mb-4 flex justify-between items-center">
      <div class="flex items-center space-x-4">
        <button
          type="button"
          on:click={() => changePage(currentPage - 1)}
          disabled={currentPage <= 1 || !pdfViewer || isRendering}
          class="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {#if isRendering}
            <div class="flex items-center space-x-2">
              <span>처리 중...</span>
            </div>
          {:else}
            이전
          {/if}
        </button>
        <span>페이지 {currentPage} / {totalPages}</span>
        <button
          type="button"
          on:click={() => changePage(currentPage + 1)}
          disabled={currentPage >= totalPages || !pdfViewer || isRendering}
          class="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {#if isRendering}
            <div class="flex items-center space-x-2">
              <span>처리 중...</span>
            </div>
          {:else}
            다음
          {/if}
        </button>
      </div>
      <div class="flex items-center space-x-2">
        <label for="scale">확대/축소:</label>
        <select
          id="scale"
          bind:value={scale}
          on:change={() => pdfViewer.setScale(scale)}
          class="border rounded px-2 py-1"
        >
          <option value="auto">폭 맞춤</option>
          <option value="0.5">50%</option>
          <option value="0.75">75%</option>
          <option value="1">100%</option>
          <option value="1.25">125%</option>
          <option value="1.5">150%</option>
          <option value="2">200%</option>
        </select>
      </div>
    </div>

    <!-- PDF 캔버스 -->
    <div class="canvas-container relative w-full max-h-[800px] border rounded p-4 bg-gray-100 overflow-auto">
      <canvas bind:this={canvas}></canvas>
      <div
        bind:this={overlayDiv}
        class="absolute inset-0 pointer-events-auto z-[1]"
        class:hidden={parsingMode !== 'viewer'}
      ></div>
      {#if parsingMode === 'pymupdf' && pageElements}
        <PyMuPDFElements
          {pageElements}
          {extractionType}
          {pdfViewer}
          on:selectionChange={handleSelectionChange}
        />
      {/if}
    </div>

    <!-- 수동 선택 모드일 때의 컨트롤 -->
    {#if parsingMode === 'viewer'}
      <ViewerModeControls
        {overlayDiv}
        {currentPage}
        on:extract={handleExtractText}
      />
    {/if}
  </div>

  <!-- 우측: 추출된 내용 -->
  <div class="w-1/2">
    <CurrentExtractedContent
      {currentContent}
      on:confirm={handleConfirmExtraction}
      on:cancel={handleCancelExtraction}
    />

    <ExtractedContentList
      {extractedContents}
      {isVectorizing}
      on:removeContent={handleRemoveContent}
      on:vectorizingStart={handleVectorizingStart}
      on:vectorize={handleVectorizingComplete}
      on:vectorizingError={handleVectorizingError}
    />
  </div>
</div>