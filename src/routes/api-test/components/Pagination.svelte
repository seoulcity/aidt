<!-- src/routes/api-test/components/Pagination.svelte -->
<script lang="ts">
  // Props
  export let currentPage: number;
  export let totalPages: number;
  export let onPageChange: (page: number) => void;
  
  // Optional props with defaults
  export let showPageNumbers = true;
  export let maxVisiblePages = 5;
  
  // Computed values
  $: pageNumbers = getVisiblePageNumbers(currentPage, totalPages, maxVisiblePages);
  
  // Helper function to determine which page numbers to show
  function getVisiblePageNumbers(current: number, total: number, maxVisible: number): number[] {
    if (total <= maxVisible) {
      // If we have fewer pages than the max visible, show all pages
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    
    // Calculate the range of pages to show
    const halfVisible = Math.floor(maxVisible / 2);
    let start = Math.max(current - halfVisible, 1);
    let end = Math.min(start + maxVisible - 1, total);
    
    // Adjust if we're near the end
    if (end === total) {
      start = Math.max(end - maxVisible + 1, 1);
    }
    
    // Generate the array of page numbers
    const pages = [];
    
    // Always include first page
    if (start > 1) {
      pages.push(1);
      // Add ellipsis if there's a gap
      if (start > 2) {
        pages.push(-1); // -1 represents ellipsis
      }
    }
    
    // Add visible page numbers
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    // Always include last page
    if (end < total) {
      // Add ellipsis if there's a gap
      if (end < total - 1) {
        pages.push(-1); // -1 represents ellipsis
      }
      pages.push(total);
    }
    
    return pages;
  }
  
  // Handle page change
  function changePage(page: number) {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  }
</script>

<div class="flex items-center justify-center gap-2 mt-4">
  <!-- Previous button -->
  <button
    on:click={() => changePage(currentPage - 1)}
    disabled={currentPage === 1}
    class="px-3 py-1 rounded border {currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'}"
    aria-label="Previous page"
  >
    이전
  </button>
  
  <!-- Page numbers -->
  {#if showPageNumbers}
    {#each pageNumbers as page}
      {#if page === -1}
        <!-- Ellipsis -->
        <span class="px-2">...</span>
      {:else}
        <!-- Page number button -->
        <button
          on:click={() => changePage(page)}
          class="px-3 py-1 rounded border {page === currentPage ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}"
          aria-current={page === currentPage ? 'page' : undefined}
        >
          {page}
        </button>
      {/if}
    {/each}
  {/if}
  
  <!-- Next button -->
  <button
    on:click={() => changePage(currentPage + 1)}
    disabled={currentPage === totalPages}
    class="px-3 py-1 rounded border {currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'}"
    aria-label="Next page"
  >
    다음
  </button>
</div>

<!-- Page info -->
<div class="text-center text-sm text-gray-500 mt-2">
  {currentPage} / {totalPages} 페이지
</div> 