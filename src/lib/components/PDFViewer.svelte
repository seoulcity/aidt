<!-- src/lib/components/PDFViewer.svelte -->
<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import { browser } from '$app/environment';
  import * as pdfjsLib from 'pdfjs-dist';
  import { PDFExtractor } from '$lib/utils/PDFExtractor';
  
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
  let extractionType = 'text'; // 'text', 'tables', 'images'
  const pdfExtractor = new PDFExtractor();
  
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
      const result = await pdfExtractor.extractPDF(file, extractionType);
      
      if (result.success) {
        // 추출된 내용을 context에 추가
        dispatch('addToEmbedding', {
          text: result.content
        });
        
        if (extractionType === 'images') {
          dispatch('saveImages', {
            images: result.images
          });
        }
      }
    } catch (error) {
      console.error('Content extraction failed:', error);
    }
  }
</script>

<div class="pdf-viewer">
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
  
  <!-- 추출 타입 선택 컨트롤 추가 -->
  <div class="mb-4 flex items-center space-x-4">
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
    
    <button
      on:click={extractContent}
      class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      선택 내용 추출
    </button>
  </div>
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
</style> 