<!-- src/lib/components/pdf-viewer/PDFPageControls.svelte -->
<script>
  export let currentPage = 1;
  export let totalPages = 0;
  export let scale = 'auto';
  export let isRendering = false;
  export let pdfViewer;
  export let parsingMode;

  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  async function changePage(newPage) {
    if (!pdfViewer || newPage < 1 || newPage > totalPages || isRendering) {
      return;
    }
    dispatch('pageChange', { newPage });
  }

  function handleScaleChange() {
    if (pdfViewer) {
      pdfViewer.setScale(scale);
    }
  }
</script>

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
    <span>
      <input
        type="number"
        min="1"
        max={totalPages}
        bind:value={currentPage}
        on:change={() => changePage(currentPage)}
        class="border rounded px-2 py-1 w-16 inline"
      />
      / {totalPages}
    </span>
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
      on:change={handleScaleChange}
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