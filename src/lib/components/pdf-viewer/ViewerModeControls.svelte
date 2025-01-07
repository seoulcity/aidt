<!-- src/lib/components/pdf-viewer/ViewerModeControls.svelte -->
<script>
  export let overlayDiv;
  export let currentPage;
  export let pdfViewer;
  
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

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
      dispatch('extract', {
        text: selectedTexts,
        page: currentPage,
        type: 'text',
        timestamp: new Date().toISOString()
      });
    }
  }
</script>

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