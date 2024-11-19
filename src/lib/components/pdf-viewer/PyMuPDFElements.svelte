<!-- src/lib/components/pdf-viewer/PyMuPDFElements.svelte -->
<script>
  export let pageElements = [];
  export let extractionType = 'text';
  export let pdfViewer;
  
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  let isDragging = false;
  let dragStart = { x: 0, y: 0 };
  let dragEnd = { x: 0, y: 0 };
  let selectionBox = null;

  function matchElementType(elementType, extractionType) {
    const typeMap = {
      'tables': 'table',
      'images': 'image',
      'text': 'text'
    };
    return elementType === typeMap[extractionType];
  }

  function toggleElementSelection(element, index, event) {
    if (!element || !matchElementType(element.type, extractionType)) {
      return;
    }

    // 드래그 중에는 클릭 선택 방지
    if (isDragging) {
      event.preventDefault();
      return;
    }
    
    pageElements = pageElements.map((el, i) => {
      if (i === index) {
        return { ...el, selected: !el.selected };
      }
      return el;
    });
    
    updateSelection();
  }

  function updateSelection() {
    const selectedElements = pageElements.filter(el => el.selected);
    if (pdfViewer) {
      pdfViewer.setPageElements(pageElements);
    }
    dispatch('selectionChange', { selectedElements, pageElements });
  }

  function handleDragStart(event) {
    if (extractionType !== 'text') return;

    isDragging = true;
    const rect = event.currentTarget.getBoundingClientRect();
    dragStart = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
    dragEnd = { ...dragStart };
  }

  function handleDragMove(event) {
    if (!isDragging) return;

    const rect = event.currentTarget.getBoundingClientRect();
    dragEnd = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };

    // 선택 영역 계산
    selectionBox = {
      left: Math.min(dragStart.x, dragEnd.x),
      top: Math.min(dragStart.y, dragEnd.y),
      width: Math.abs(dragEnd.x - dragStart.x),
      height: Math.abs(dragEnd.y - dragStart.y)
    };
  }

  function handleDragEnd() {
    if (!isDragging) return;

    // 드래그 영역 내의 텍스트 요소 선택
    if (selectionBox && extractionType === 'text') {
      pageElements = pageElements.map(element => {
        if (element.type !== 'text') return element;

        const elementBox = {
          left: element.bbox[0],
          top: element.bbox[1],
          right: element.bbox[2],
          bottom: element.bbox[3]
        };

        // 선택 영역과 요소가 겹치는지 확인
        const isIntersecting = !(
          elementBox.left > selectionBox.left + selectionBox.width ||
          elementBox.right < selectionBox.left ||
          elementBox.top > selectionBox.top + selectionBox.height ||
          elementBox.bottom < selectionBox.top
        );

        return {
          ...element,
          selected: isIntersecting ? true : element.selected
        };
      });

      updateSelection();
    }

    isDragging = false;
    selectionBox = null;
  }

  function clearSelections() {
    console.log('PyMuPDFElements: Dispatching clearSelections event');
    dispatch('clearSelections');
  }

  // 현재 선택된 타입의 요소만 필터링
  $: filteredElements = pageElements.filter(element => matchElementType(element.type, extractionType));
  
  // 현재 타입의 선택된 요소 수 계산
  $: selectedCount = pageElements.filter(el => el.selected && matchElementType(el.type, extractionType)).length;
</script>

<div 
  class="absolute inset-0 pointer-events-auto z-[1]"
  on:mousedown={handleDragStart}
  on:mousemove={handleDragMove}
  on:mouseup={handleDragEnd}
  on:mouseleave={handleDragEnd}
>
  {#each filteredElements as element, index (element.bbox.join(','))}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div
      class="absolute transition-all duration-200 ease-in-out z-[2] hover:border-[3px] hover:bg-blue-50/5"
      style="
        left: {element.bbox[0]}px;
        top: {element.bbox[1]}px;
        width: {element.bbox[2] - element.bbox[0]}px;
        height: {element.bbox[3] - element.bbox[1]}px;
        border: 2px solid #4a90e2;
        background-color: {element.selected ? 'rgba(74, 144, 226, 0.1)' : 'transparent'};
        cursor: pointer;
      "
      on:click={(event) => toggleElementSelection(element, pageElements.indexOf(element), event)}
      role="button"
      tabindex="0"
    >
      <div 
        class="absolute -top-5 -left-0.5 text-white text-xs px-1.5 py-0.5 rounded whitespace-nowrap bg-blue-500"
      >
        {element.type}
      </div>
    </div>
  {/each}

  {#if selectionBox}
    <div
      class="absolute border-2 border-blue-500 bg-blue-100 opacity-30"
      style="
        left: {selectionBox.left}px;
        top: {selectionBox.top}px;
        width: {selectionBox.width}px;
        height: {selectionBox.height}px;
      "
    ></div>
  {/if}
</div> 