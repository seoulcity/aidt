<!-- src/lib/components/PDFViewer.svelte -->
<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import { browser } from '$app/environment';
  import * as pdfjsLib from 'pdfjs-dist';
  import { PDFViewerAPI } from '$lib/api/pdfViewerAPI';
  import { PDFExtractor } from '$lib/utils/PDFExtractor.js';
  
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
  const pdfExtractor = new PDFExtractor();
  
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

  $: if (file && pdfViewer && browser) {
    (async () => {
        try {
            await pdfViewer.loadPDF(file);
            currentPage = pdfViewer.getCurrentPage();
            totalPages = pdfViewer.getTotalPages();
        } catch (error) {
            console.error('PDF loading error:', error);
        }
    })();
  }

  // 헬퍼 함수들 추가
  function createNewParagraph() {
    return {
      type: 'paragraph',
      content: [],
      x: Infinity,
      y: Infinity,
      width: 0,
      height: 0,
      selected: false
    };
  }

  function finalizeParagraph(paragraph) {
    if (paragraph.content.length === 0) return;
    
    // 문단의 너비와 높이 계산
    const maxX = Math.max(...paragraph.content.map(c => c.x + c.width));
    const maxY = Math.max(...paragraph.content.map(c => c.y + c.height));
    
    paragraph.width = maxX - paragraph.x;
    paragraph.height = maxY - paragraph.y;
  }

  async function extractContent() {
    if (!file) return;
    
    try {
        isExtracting = true;
        extractionProgress = `${currentPage}페이지 ${extractionType === 'text' ? '텍스트' : 
                           extractionType === 'tables' ? '표' : '이미지'} 추출 중...`;
      
        const result = await pdfExtractor.extractPDF(file, extractionType, currentPage);
      
        if (result.success) {
            extractionProgress = `${result.page}페이지 추출 완료!`;
            
            // 추출된 내용을 바로 목록에 추가
            extractedContents = [...extractedContents, {
                text: result.content,
                page: currentPage,
                type: extractionType,
                timestamp: new Date().toISOString()
            }];

            // 3초 후 진행 메시지 제거
            setTimeout(() => {
                extractionProgress = '';
            }, 3000);
        }
    } catch (error) {
        console.error('Content extraction failed:', error);
        extractionProgress = '추출 실패: ' + (error.message || '알 수 없는 오류');
        
        setTimeout(() => {
            extractionProgress = '';
        }, 3000);
    } finally {
        isExtracting = false;
    }
  }

  function confirmExtraction() {
    if (currentContent) {
        // 배열에 새 내용 추가
        extractedContents = [...extractedContents, currentContent];
        currentContent = null;
    }
  }

  function cancelExtraction() {
    currentContent = null;
  }

  function removeExtractedContent(index) {
    extractedContents = extractedContents.filter((_, i) => i !== index);
  }

  function saveAllContents() {
    const combinedText = extractedContents
      .map(content => content.text)
      .join('\n\n');
    
    dispatch('addToEmbedding', { text: combinedText });
    extractedContents = [];
  }
  
  async function handleParsingModeChange() {
    if (!pdfViewer) return;

    try {
        if (parsingMode === 'viewer') {
            await pdfViewer.renderPage(currentPage, true, 'viewer');
        } else {
            await pdfViewer.renderPage(currentPage, false, 'pymupdf');
        }
    } catch (error) {
        console.error('Parsing mode change error:', error);
    }
  }
  
  // parsingMode 변경 감시
  $: if (parsingMode && pdfViewer) {
    handleParsingModeChange();
  }

  // scale 변경될 때 PDFViewerAPI에 반영
  $: if (pdfViewer && scale) {
    pdfViewer.setScale(scale);
  }

  // 페이지 렌더링 함수
  async function renderPage(pageNum) {
    if (!pdfViewer) return;
    await pdfViewer.renderPage(pageNum);
    currentPage = pdfViewer.getCurrentPage();
    totalPages = pdfViewer.getTotalPages();
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
    if (pdfViewer && newPage >= 1 && newPage <= totalPages && !isRendering) {
        try {
            isRendering = true; // 렌더링 시작
            currentPage = newPage;
            await pdfViewer.renderPage(currentPage, parsingMode === 'viewer', parsingMode);
        } catch (error) {
            console.error('Page change error:', error);
        } finally {
            isRendering = false; // 렌더링 완료
        }
    }
  }

  // pageElements 로드 함수 추가
  async function loadPageElements() {
    if (!file || !pdfViewer) return;
    
    try {
        const result = await pdfExtractor.analyzePage(file, currentPage);
        if (result.success) {
            pageElements = result.elements;
        }
    } catch (error) {
        console.error('Failed to load page elements:', error);
    }
  }

  // 요소 선택/해제 토글 함수
  function toggleElementSelection(element) {
    if (element.type !== extractionType) return;
    
    element.selected = !element.selected;
    if (element.selected) {
        selectedElements = [...selectedElements, element];
    } else {
        selectedElements = selectedElements.filter(e => e !== element);
    }
  }

  // 선택된 요소들 추출 함수
  async function extractSelectedElements() {
    if (!selectedElements.length) return;
    
    try {
        isExtracting = true;
        
        // 선택된 요소들을 PyMuPDF4LLM에 전달하기 위한 형식으로 변환
        const result = await pdfExtractor.extractPDF(
            file,
            extractionType,
            currentPage,
            selectedElements.map(e => e.bbox)
        );
        
        if (result.success) {
            extractedContents = [...extractedContents, {
                text: result.content,
                page: currentPage,
                type: extractionType,
                timestamp: new Date().toISOString()
            }];
        }
    } catch (error) {
        console.error('Extraction failed:', error);
    } finally {
        isExtracting = false;
        selectedElements = [];
        pageElements = pageElements.map(e => ({ ...e, selected: false }));
    }
  }

  // parsingMode가 변경될 때 페이지 요소 로드
  $: if (parsingMode === 'pymupdf' && file && pdfViewer) {
    loadPageElements();
  }

  // 페이지가 변경될 때도 요소 다시 로드
  $: if (currentPage && parsingMode === 'pymupdf') {
    loadPageElements();
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
    <div class="canvas-container border rounded p-4 bg-gray-100 overflow-auto relative">
      <canvas bind:this={canvas}></canvas>
      {#if parsingMode === 'viewer'}
        <div
          bind:this={overlayDiv}
          class="absolute inset-0 pointer-events-auto"
          style="z-index: 1;"
        ></div>
      {:else if parsingMode === 'pymupdf' && pageElements}
        <div class="absolute inset-0 pointer-events-auto" style="z-index: 1;">
          {#each pageElements as element}
            <div
              class="element-box absolute"
              style="
                left: {element.bbox[0]}px;
                top: {element.bbox[1]}px;
                width: {element.bbox[2] - element.bbox[0]}px;
                height: {element.bbox[3] - element.bbox[1]}px;
                border: 2px solid {element.type === extractionType ? '#4a90e2' : '#ddd'};
                background-color: {element.selected ? 'rgba(74, 144, 226, 0.1)' : 'transparent'};
                cursor: pointer;
              "
              on:click={() => toggleElementSelection(element)}
            >
              <div class="element-type-badge">
                {element.type}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- 수동 선택 모드일 때의 컨트롤 수정 -->
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

    <!-- PyMuPDF 모드 컨트롤 -->
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
                    <span class="ml-2">텍스트</span>
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
    <!-- 현재 추출된 내용 -->
    {#if currentContent}
      <div class="bg-white p-4 rounded-lg shadow mb-4">
        <h3 class="text-lg font-semibold mb-2">새로 추출된 내용</h3>
        <div class="mb-4">
          <div class="text-sm text-gray-600 mb-2">
            페이지 {currentContent.page}에서 추출된 {currentContent.type === 'text' ? '텍스트' : 
                                                    currentContent.type === 'tables' ? '표' : '이미지'}
          </div>
          <div class="p-3 bg-gray-50 rounded-md max-h-60 overflow-y-auto">
            <pre class="whitespace-pre-wrap text-sm">{currentContent.text}</pre>
          </div>
        </div>
        
        <div class="flex justify-end space-x-3">
          <button
            type="button"
            on:click={cancelExtraction}
            class="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
          >
            취소
          </button>
          <button
            type="button"
            on:click={confirmExtraction}
            class="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            추가하기
          </button>
        </div>
      </div>
    {/if}

    <!-- 추출된 내용 목록 (공통) -->
    {#if extractedContents.length > 0}
      <div class="mt-4 bg-white p-4 rounded-lg shadow">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">추출된 내용 목록</h3>
          <button
            type="button"
            on:click={vectorizeContents}
            class="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
            disabled={isVectorizing}
          >
            {#if isVectorizing}
              <span>벡터화 중...</span>
            {:else}
              <span>벡터화하기</span>
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
              <pre class="whitespace-pre-wrap text-sm">{content.text}</pre>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .canvas-container {
    max-height: 800px;
    position: relative;
    width: 100%;
  }
  
  /* 오버레이 관련 스타일 추가 */
  :global(.bounding-box) {
    transition: all 0.2s ease-in-out;
    z-index: 2;
  }
  
  :global(.element-checkbox) {
    transform: scale(1.2);
    cursor: pointer;
    z-index: 3;
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  
  pre {
    font-family: inherit;
  }

  .element-type-badge {
    position: absolute;
    top: -18px;
    left: 0;
    background-color: #4a90e2;
    color: white;
    padding: 2px 4px;
    font-size: 10px;
    border-radius: 2px;
  }

  .element-box {
    transition: all 0.2s ease-in-out;
    z-index: 2;
  }
  
  .element-box:hover {
    border-width: 3px !important;
    background-color: rgba(74, 144, 226, 0.05) !important;
  }
  
  .element-type-badge {
    position: absolute;
    top: -20px;
    left: -2px;
    background-color: #4a90e2;
    color: white;
    padding: 2px 6px;
    font-size: 10px;
    border-radius: 3px;
    white-space: nowrap;
  }
</style> 