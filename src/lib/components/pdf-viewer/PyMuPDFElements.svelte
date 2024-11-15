<!-- src/lib/components/pdf-viewer/PyMuPDFElements.svelte -->
<script>
  export let pageElements = [];
  export let extractionType = 'text';
  export let pdfViewer;
  
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

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
    const selectedElements = pageElements.filter(el => el.selected);
    
    // PDFViewerAPI에 업데이트된 요소 정보 전달
    if (pdfViewer) {
      pdfViewer.setPageElements(pageElements);
    }
    
    dispatch('selectionChange', { selectedElements, pageElements });
  }
</script>

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