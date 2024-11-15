<!-- src/lib/components/grammar-search/FileUploadTab.svelte -->
<script>
  import PDFViewer from '$lib/components/PDFViewer.svelte';
  
  export let selectedFile = null;
  export let showPDFViewer = false;
  
  function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      selectedFile = file;
      showPDFViewer = true;
    } else {
      alert('PDF 파일만 선택할 수 있습니다.');
    }
  }
</script>

<div class="bg-white p-6 rounded-lg shadow-md mb-8">
  <div class="flex items-center space-x-4 mb-4">
    <input
      type="file"
      accept=".pdf"
      on:change={handleFileSelect}
      class="block w-full text-sm text-gray-500
        file:mr-4 file:py-2 file:px-4
        file:rounded-full file:border-0
        file:text-sm file:font-semibold
        file:bg-blue-50 file:text-blue-700
        hover:file:bg-blue-100"
    />
  </div>
  
  {#if showPDFViewer && selectedFile}
    <div class="pdf-container">
      <PDFViewer 
        file={selectedFile}
        on:addToEmbedding
        on:saveImages
      />
    </div>
  {/if}
</div> 