<!-- src/lib/components/PDFViewer.svelte -->
<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import { browser } from '$app/environment';
  import * as pdfjsLib from 'pdfjs-dist';
  import { PDFExtractor } from '$lib/utils/PDFExtractor.js';
  
  const dispatch = createEventDispatcher();
  
  export let file = null;
  let canvas;
  let overlayDiv; // 오버레이 div로 변경
  let pdf = null;
  let currentPage = 1;
  let totalPages = 0;
  let scale = 1.5;
  let pageElements = []; // 페이지의 텍스트와 이미지 요소들
  let selectedElements = []; // 선택된 요소들
  let parsingMode = 'viewer'; // 'viewer' 또는 'pymupdf'
  let extractionType = 'text'; // 'text', 'tables', 'images'
  const pdfExtractor = new PDFExtractor();
  
  let isExtracting = false; // 추출 진행 상태
  let extractionProgress = ''; // 추출 진행 메시지
  
  let extractedContent = null; // 추출된 내용 저장
  let extractedContentPreview = ''; // 추출된 내용 미리보기
  
  if (browser) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;
  }
  
  async function renderPage(pageNum) {
    if (!pdf || !canvas) return;
    
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    
    // 메인 캔버스 설정
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    const context = canvas.getContext('2d');
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    
    await page.render(renderContext);
    
    // 페이지 요소 추출
    const textContent = await page.getTextContent();
    const operatorList = await page.getOperatorList();
    
    pageElements = [];
    
    // 텍스트 요소를 문단으로 그룹화
    let lastY = null;
    let currentParagraph = createNewParagraph();
    
    textContent.items.forEach(item => {
      const transform = viewport.transform;
      const [x, y] = applyTransform([item.transform[4], item.transform[5]], transform);
      
      // y 좌표 보정: viewport 높이에서 PDF 좌표를 빼서 화면 좌표계로 변환
      const adjustedY = y - (item.height * scale);
      
      // 새로운 문단 시작 조건 체크
      if (lastY !== null) {
        const yGap = Math.abs(adjustedY - lastY);
        const lineHeight = item.height * scale;
        
        // 줄 간격이 일반적인 행간보다 크면 새로운 문단으로 판단
        if (yGap > lineHeight * 1.5) {
          if (currentParagraph.content.length > 0) {
            finalizeParagraph(currentParagraph);
            pageElements.push({ ...currentParagraph });
            currentParagraph = createNewParagraph();
          }
        }
      }
      
      // 현재 텍스트 항목을 문단에 추가
      currentParagraph.x = Math.min(currentParagraph.x, x);
      currentParagraph.y = Math.min(currentParagraph.y, adjustedY);
      currentParagraph.content.push({
        text: item.str,
        x,
        y: adjustedY,
        width: item.width * scale,
        height: item.height * scale
      });
      
      lastY = adjustedY;
    });
    
    // 마지막 문단 처리
    if (currentParagraph.content.length > 0) {
      finalizeParagraph(currentParagraph);
      pageElements.push({ ...currentParagraph });
    }
    
    // 이미지 요소 추가
    let imageIndex = 0;
    for (let i = 0; i < operatorList.fnArray.length; i++) {
      if (operatorList.fnArray[i] === pdfjsLib.OPS.paintImageXObject) {
        const imageArgs = operatorList.argsArray[i];
        pageElements.push({
          type: 'image',
          id: `image_${imageIndex++}`,
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          selected: false
        });
      }
    }
    
    renderOverlay();
  }
  
  function applyTransform(point, transform) {
    return [
      transform[0] * point[0] + transform[2] * point[1] + transform[4],
      transform[1] * point[0] + transform[3] * point[1] + transform[5]
    ];
  }
  
  function renderOverlay() {
    if (!overlayDiv) return;
    
    // 기존 오버레이 제거
    overlayDiv.innerHTML = '';
    
    // 각 요소에 대한 바운딩 박스와 체크박스 생성
    pageElements.forEach((element, index) => {
      const box = document.createElement('div');
      box.className = 'bounding-box';
      box.style.position = 'absolute';
      box.style.left = `${element.x}px`;
      box.style.top = `${element.y}px`;
      box.style.width = `${element.width}px`;
      box.style.height = `${element.height}px`;
      box.style.border = '1px solid #ccc';
      box.style.backgroundColor = element.selected ? 'rgba(0, 255, 0, 0.1)' : 'transparent';
      
      // 체크박스 추가
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'element-checkbox';
      checkbox.checked = element.selected;
      checkbox.style.position = 'absolute';
      checkbox.style.left = '-20px';
      checkbox.style.top = '0';
      
      checkbox.addEventListener('change', () => {
        element.selected = checkbox.checked;
        box.style.backgroundColor = element.selected ? 'rgba(0, 255, 0, 0.1)' : 'transparent';
        
        if (element.selected) {
          selectedElements = [...selectedElements, element];
        } else {
          selectedElements = selectedElements.filter(e => e !== element);
        }
        
        // 선택된 요소들 알림
        dispatch('selectionChange', {
          selectedElements: [...selectedElements]
        });
      });
      
      box.appendChild(checkbox);
      overlayDiv.appendChild(box);
    });
  }
  
  async function loadPDF(file) {
    if (!file) return;
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      totalPages = pdf.numPages;
      currentPage = 1;
      await renderPage(currentPage);
    } catch (error) {
      console.error('PDF 로딩 에러:', error);
    }
  }
  
  $: if (file && browser) {
    loadPDF(file);
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
            
            // 추출된 내용을 미리보기로 저장
            extractedContent = {
                text: result.content,
                page: result.page,
                type: extractionType
            };
            extractedContentPreview = result.content;

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
    if (extractedContent) {
        dispatch('addToEmbedding', {
            text: extractedContent.text
        });
        
        if (extractedContent.type === 'images') {
            dispatch('saveImages', {
                images: extractedContent.images
            });
        }
        
        // 미리보기 초기화
        extractedContent = null;
        extractedContentPreview = '';
    }
  }

  function cancelExtraction() {
    extractedContent = null;
    extractedContentPreview = '';
  }
  
  async function handleParsingModeChange() {
    if (parsingMode === 'viewer') {
      // PDF.js 뷰어 모드일 때는 기존 렌더링 로직 사용
      await renderPage(currentPage);
    } else {
      // pymupdf 모드일 때도 PDF는 보여주되 오버레이만 숨김
      if (overlayDiv) {
        overlayDiv.innerHTML = '';
      }
      await renderPage(currentPage);
    }
  }
  
  $: if (parsingMode) {
    handleParsingModeChange();
  }
</script>

<div class="pdf-viewer">
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
  {#if parsingMode === 'viewer'}
    <div class="controls mb-4 flex justify-between items-center">
      <div class="flex items-center space-x-4">
        <button
          on:click={() => currentPage > 1 && renderPage(--currentPage)}
          disabled={currentPage <= 1}
          class="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          이전
        </button>
        <span>페이지 {currentPage} / {totalPages}</span>
        <button
          on:click={() => currentPage < totalPages && renderPage(++currentPage)}
          disabled={currentPage >= totalPages}
          class="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          다음
        </button>
      </div>
      <div class="flex items-center space-x-2">
        <label for="scale">확대/축소:</label>
        <select
          id="scale"
          bind:value={scale}
          on:change={() => renderPage(currentPage)}
          class="border rounded px-2 py-1"
        >
          <option value={1}>100%</option>
          <option value={1.5}>150%</option>
          <option value={2}>200%</option>
          <option value={2.5}>250%</option>
        </select>
      </div>
    </div>
    
    <div class="canvas-container border rounded p-4 bg-gray-100 overflow-auto relative">
      <canvas bind:this={canvas}></canvas>
      <div
        bind:this={overlayDiv}
        class="absolute top-4 left-4 pointer-events-auto"
        style="z-index: 1;"
      ></div>
    </div>
    
    {#if selectedElements.length > 0}
      <div class="selected-elements mt-4">
        <h3 class="text-lg font-semibold mb-2">선택된 요소</h3>
        <div class="space-y-2">
          {#each selectedElements as element}
            <div class="flex items-center justify-between p-2 bg-white rounded shadow">
              <span>
                {element.type === 'paragraph' ? 
                  `텍스트: ${element.content.map(c => c.text).join('')}` : 
                  '이미지'}
              </span>
              <button
                on:click={() => {
                  element.selected = false;
                  selectedElements = selectedElements.filter(e => e !== element);
                  renderOverlay();
                }}
                class="text-red-600 hover:text-red-800"
              >
                제거
              </button>
            </div>
          {/each}
        </div>
        <div class="mt-4 flex justify-end space-x-2">
          <button
            on:click={() => {
              const textElements = selectedElements.filter(e => e.type === 'paragraph');
              if (textElements.length > 0) {
                dispatch('addToEmbedding', {
                  text: textElements.map(e => e.content.map(c => c.text).join('')).join('\n\n')
                });
              }
            }}
            class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            disabled={!selectedElements.some(e => e.type === 'paragraph')}
          >
            임베딩에 추가
          </button>
          <button
            on:click={() => {
              const imageElements = selectedElements.filter(e => e.type === 'image');
              if (imageElements.length > 0) {
                dispatch('saveImages', {
                  images: imageElements
                });
              }
            }}
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={!selectedElements.some(e => e.type === 'image')}
          >
            이미지 저장
          </button>
        </div>
      </div>
    {/if}
  {:else}
    <!-- PyMuPDF 모드 컨트롤 -->
    <div class="bg-white p-4 rounded-lg shadow mb-4">
      <h3 class="text-lg font-semibold mb-2">자동 추출 옵션</h3>
      <div class="grid grid-cols-1 gap-4">
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
        
        <div class="flex justify-between items-center">
          <div class="text-sm text-gray-600">
            {#if extractionType === 'text'}
              텍스트 추출: 문서의 모든 텍스트를 자동으로 추출합니다.
            {:else if extractionType === 'tables'}
              표 추출: 문서 내의 표를 자동으로 감지하고 추출합니다.
            {:else}
              이미지 추출: 문서에 포함된 이미지를 자동으로 추출합니다.
            {/if}
          </div>
          <button
            type="button"
            on:click|preventDefault={extractContent}
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={!file || isExtracting}
          >
            {#if isExtracting}
              <div class="flex items-center space-x-2">
                <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>처리 중...</span>
              </div>
            {:else}
              {extractionType === 'text' ? '텍스트 추출' : 
               extractionType === 'tables' ? '표 추출' : '이미지 추출'}
            {/if}
          </button>
        </div>

        <!-- 진행 상태 표시 -->
        {#if extractionProgress}
          <div class="mt-2 p-3 rounded-md {extractionProgress.includes('실패') ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}">
            {extractionProgress}
          </div>
        {/if}
      </div>
    </div>
    
    <!-- 추출된 내용 미리보기 -->
    {#if extractedContent}
      <div class="mt-4 bg-white p-4 rounded-lg shadow">
        <h3 class="text-lg font-semibold mb-2">추출된 내용 미리보기</h3>
        <div class="mb-4">
          <div class="text-sm text-gray-600 mb-2">
            페이지 {extractedContent.page}에서 추출된 {extractedContent.type === 'text' ? '텍스트' : 
                                                      extractedContent.type === 'tables' ? '표' : '이미지'}
          </div>
          <div class="p-3 bg-gray-50 rounded-md max-h-60 overflow-y-auto">
            <pre class="whitespace-pre-wrap text-sm">{extractedContentPreview}</pre>
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
            내용 추가하기
          </button>
        </div>
      </div>
    {/if}
    
    <!-- PDF 미리보기 컨트롤 추가 -->
    <div class="controls mb-4 flex justify-between items-center">
      <div class="flex items-center space-x-4">
        <button
          on:click={() => currentPage > 1 && renderPage(--currentPage)}
          disabled={currentPage <= 1}
          class="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          이전
        </button>
        <span>페이지 {currentPage} / {totalPages}</span>
        <button
          on:click={() => currentPage < totalPages && renderPage(++currentPage)}
          disabled={currentPage >= totalPages}
          class="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          다음
        </button>
      </div>
      <div class="flex items-center space-x-2">
        <label for="scale">확대/축소:</label>
        <select
          id="scale"
          bind:value={scale}
          on:change={() => renderPage(currentPage)}
          class="border rounded px-2 py-1"
        >
          <option value={1}>100%</option>
          <option value={1.5}>150%</option>
          <option value={2}>200%</option>
          <option value={2.5}>250%</option>
        </select>
      </div>
    </div>
    
    <!-- PDF 미리보기 -->
    <div class="canvas-container border rounded p-4 bg-gray-100 overflow-auto">
      <canvas bind:this={canvas}></canvas>
    </div>
  {/if}
</div>

<style>
  .canvas-container {
    max-height: 800px;
    position: relative;
  }
  canvas {
    margin: 0 auto;
  }
  :global(.bounding-box) {
    transition: background-color 0.2s;
  }
  :global(.element-checkbox) {
    transform: scale(1.2);
    cursor: pointer;
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
</style> 