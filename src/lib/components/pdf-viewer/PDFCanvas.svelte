<script>
  export let canvas;
  export let overlayDiv;
  export let parsingMode;
  export let pageElements;
  export let extractionType;
  export let pdfViewer;

  import PyMuPDFElements from './PyMuPDFElements.svelte';
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  function handleSelectionChange(event) {
    dispatch('selectionChange', event.detail);
  }
</script>

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