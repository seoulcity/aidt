<!-- src/lib/components/PDFViewer.svelte -->
<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import { browser } from '$app/environment';
  import * as pdfjsLib from 'pdfjs-dist';
  import { PDFViewerAPI } from '$lib/api/pdfViewerAPI';
  import { PDFService } from '$lib/services/pdfService';
  import ExtractedContentList from './pdf-viewer/ExtractedContentList.svelte';
  import CurrentExtractedContent from './pdf-viewer/CurrentExtractedContent.svelte';
  
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

  function removeExtractedContent(index) {
    extractedContents = extractedContents.filter((_, i) => i !== index);
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

  // 선택 내용 추출 함수 수정
  function extractSelectedText() {
    const selectedTexts = Array.from(overlayDiv.querySelectorAll('.bounding-box'))
        .filter(box => box.querySelector('input[type="checkbox"]').checked)
        .map(box => {
            const checkbox = box.querySelector('input[type="checkbox"]');
            checkbox.checked = false;
            box.style.backgroundColor = 'transparent';
            box.style.border = '1px solid #ddd';
            return box.dataset.text;
        })
        .join(' ');

    if (selectedTexts) {
        // 새로운 추출 내용을 배열에 추가
        extractedContents = [...extractedContents, {
            text: selectedTexts,
            page: currentPage,
            type: 'text',
            timestamp: new Date().toISOString()
        }];
    }
  }

  // 벡터화 함수
  async function vectorizeContents() {
    if (extractedContents.length === 0) return;
    
    try {
        isVectorizing = true;
        const combinedText = extractedContents
            .map(content => content.text)
            .join('\n\n');
        
        dispatch('addToEmbedding', { text: combinedText });
        extractedContents = []; // 벡터화 후 초기화
    } catch (error) {
        console.error('Vectorization failed:', error);
    } finally {
        isVectorizing = false;
    }
  }

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

  // toggleElementSelection 함수 수정
  function toggleElementSelection(element, index) {
    if (!element || element.type !== extractionType) {
        return;
    }
    
    // pageElements 업데이트
    pageElements = pageElements.map((el, i) => {
        if (i === index) {
            return { ...el, selected: !el.selected };
        }
        return el;
    });
    
    // selectedElements 업데이트
    selectedElements = pageElements.filter(el => el.selected);
    
    // PDFViewerAPI에 업데이트된 요소 정보 전달
    if (pdfViewer) {
        pdfViewer.setPageElements(pageElements);
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

  // 선택된 요소들 추출 함수 수정
  async function extractSelectedElements() {
    if (!selectedElements.length) return;
    
    try {
        isExtracting = true;
        
        const content = await PDFService.extractSelectedElements(
            file,
            extractionType,
            currentPage,
            selectedElements
        );
        
        extractedContents = [...extractedContents, {
            text: content,
            page: currentPage,
            type: extractionType,
            timestamp: new Date().toISOString()
        }];
    } catch (error) {
        console.error('Extraction failed:', error);
    } finally {
        isExtracting = false;
        selectedElements = [];
        pageElements = pageElements.map(e => ({ ...e, selected: false }));
        pdfViewer.setPageElements(pageElements);
    }
  }

  function handleRemoveContent(event) {
    const { index } = event.detail;
    extractedContents = extractedContents.filter((_, i) => i !== index);
  }

  async function handleVectorize() {
    if (extractedContents.length === 0) return;
    
    try {
      isVectorizing = true;
      const combinedText = extractedContents
        .map(content => content.text)
        .join('\n\n');
      
      dispatch('addToEmbedding', { text: combinedText });
      extractedContents = []; // 벡터화 후 초기화
    } catch (error) {
      console.error('Vectorization failed:', error);
    } finally {
      isVectorizing = false;
    }
  }
</script>

<div class="flex gap-4">
  <!-- 좌측: PDF 뷰어 -->
  <div class="w-1/2">
    <!-- 파싱 모드 선택 -->
    <div class="mb-4 bg-white p-4 rounded-lg shadow">
      <h3 class="text-lg font-semibold mb-2">파싱 방식 선택</h3>
      <div class="flex space-x-4">
        <label class="inline-flex items-center">
          <input
            type="radio"
            bind:group={parsingMode}
            value="viewer"
            class="form-radio"
          />
          <span class="ml-2">PDF 뷰어 (수동 선택)</span>
        </label>
        <label class="inline-flex items-center">
          <input
            type="radio"
            bind:group={parsingMode}
            value="pymupdf"
            class="form-radio"
          />
          <span class="ml-2">PyMuPDF (자동 추출)</span>
        </label>
      </div>
    </div>

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
        <div class="absolute inset-0 pointer-events-auto z-[1]">
          {#each pageElements as element, index}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div
              class="absolute transition-all duration-200 ease-in-out z-[2] hover:border-[3px] hover:bg-blue-50/5"
              style="
                left: {element.bbox[0]}px;
                top: {element.bbox[1]}px;
                width: {element.bbox[2] - element.bbox[0]}px;
                height: {element.bbox[3] - element.bbox[1]}px;
                border: 2px solid {element.type === extractionType ? '#4a90e2' : '#ddd'};
                background-color: {element.selected ? 'rgba(74, 144, 226, 0.1)' : 'transparent'};
                cursor: {element.type === extractionType ? 'pointer' : 'not-allowed'};
              "
              on:click={() => toggleElementSelection(element, index)}
              role="button"
              tabindex="0"
            >
              <div 
                class="absolute -top-5 -left-0.5 text-white text-xs px-1.5 py-0.5 rounded whitespace-nowrap"
                style="background-color: {element.type === extractionType ? '#4a90e2' : '#999'};"
              >
                {element.type}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- 수동 선택 모드일 때의 컨트롤 -->
    {#if parsingMode === 'viewer'}
      <div class="mt-4 bg-white p-4 rounded-lg shadow">
        <div class="flex justify-between items-center">
          <span class="text-sm text-gray-600">선택한 텍스트를 추출할 수 있습니다.</span>
          <button
            type="button"
            on:click={extractSelectedText}
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            선택 내용 추출
          </button>
        </div>
      </div>
    {/if}

    <!-- PyMuPDF 모드 컨트롤 추가 -->
    {#if parsingMode === 'pymupdf'}
      <div class="mt-4 bg-white p-4 rounded-lg shadow">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center space-x-4">
            <label class="inline-flex items-center">
              <input
                type="radio"
                bind:group={extractionType}
                value="text"
                class="form-radio"
              />
              <span class="ml-2">텍스</span>
            </label>
            
            <label class="inline-flex items-center">
              <input
                type="radio"
                bind:group={extractionType}
                value="tables"
                class="form-radio"
              />
              <span class="ml-2">표</span>
            </label>
            
            <label class="inline-flex items-center">
              <input
                type="radio"
                bind:group={extractionType}
                value="images"
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
  </div>

  <!-- 우측: 추출된 내용 -->
  <div class="w-1/2">
    <!-- 현재 추출된 내용 컴포넌트로 교체 -->
    <CurrentExtractedContent
      {currentContent}
      on:confirm={handleConfirmExtraction}
      on:cancel={handleCancelExtraction}
    />

    <!-- 추출된 내용 목록 -->
    <ExtractedContentList
      {extractedContents}
      {isVectorizing}
      on:removeContent={handleRemoveContent}
      on:vectorize={handleVectorize}
    />
  </div>
</div>