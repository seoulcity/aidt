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
  import PDFPageControls from './pdf-viewer/PDFPageControls.svelte';
  import PDFCanvas from './pdf-viewer/PDFCanvas.svelte';
  
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

  async function handlePageChange(event) {
    const { newPage } = event.detail;
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

  function handleExtractText(event) {
    extractedContents = [...extractedContents, event.detail];
  }

  function handleSelectionChange(event) {
    selectedElements = event.detail.selectedElements;
    pageElements = event.detail.pageElements;
  }

  function handleClearSelections() {
    console.log('PDFViewer: Handling clearSelections');
    selectedElements = [];
    pageElements = pageElements.map(e => ({ ...e, selected: false }));
    if (pdfViewer) {
      console.log('PDFViewer: Updating pdfViewer elements');
      pdfViewer.setPageElements(pageElements);
    }
  }

  export let formData; // formData prop 추가
</script>

<div class="flex gap-4">
  <!-- 좌측: PDF 뷰어 -->
  <div class="w-1/2">
    <PDFControls
      {parsingMode}
      {extractionType}
      {selectedElements}
      {pageElements}
      {file}
      {currentPage}
      {pdfViewer}
      on:parsingModeChange={(event) => parsingMode = event.detail.mode}
      on:extractionTypeChange={(event) => extractionType = event.detail.type}
      on:clearSelections={handleClearSelections}
      on:extractingStart={() => isExtracting = true}
      on:extractingComplete={(event) => {
        console.log('Extracted Content:', {
          raw: event.detail.content,
          text: event.detail.content.text,
          type: event.detail.content.type,
          page: event.detail.content.page,
          selectedElements
        });
        
        extractedContents = [...extractedContents, event.detail.content];
        isExtracting = false;
        selectedElements = [];
        pageElements = pageElements.map(e => ({ ...e, selected: false }));
        pdfViewer.setPageElements(pageElements);
      }}
      on:extractingError={(event) => {
        console.error('Extraction Error:', event.detail.error);
        isExtracting = false;
      }}
    />

    <PDFPageControls
      {currentPage}
      {totalPages}
      {scale}
      {isRendering}
      {pdfViewer}
      {parsingMode}
      on:pageChange={handlePageChange}
    />

    <PDFCanvas
      bind:canvas
      bind:overlayDiv
      {parsingMode}
      {pageElements}
      {extractionType}
      {pdfViewer}
      on:selectionChange={handleSelectionChange}
      on:clearSelections={handleClearSelections}
    />

    {#if parsingMode === 'viewer'}
      <ViewerModeControls
        {overlayDiv}
        {currentPage}
        {pdfViewer}
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
      {formData}
      on:removeContent={(event) => extractedContents = extractedContents.filter((_, i) => i !== event.detail.index)}
      on:vectorizingStart={() => isVectorizing = true}
      on:vectorizingComplete={() => {
        isVectorizing = false;
        extractedContents = [];
        dispatch('embeddingCreated');
      }}
      on:vectorizingError={() => isVectorizing = false}
    />
  </div>
</div>