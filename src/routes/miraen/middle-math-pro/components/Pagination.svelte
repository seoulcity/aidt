<!-- src/routes/miraen/middle-math-pro/components/Pagination.svelte -->
<script>
  export let currentPage;
  export let totalPages;
  export let onPageChange;
</script>

<div class="flex justify-center gap-4 mt-6">
  <button
    class="px-4 py-2 rounded bg-blue-500 text-white disabled:bg-gray-300"
    disabled={currentPage === 1}
    on:click={() => onPageChange(Math.max(1, currentPage - 1))}
  >
    이전
  </button>
  <span class="flex items-center">
    {currentPage} / {totalPages}
  </span>
  <button
    class="px-4 py-2 rounded bg-blue-500 text-white disabled:bg-gray-300"
    disabled={currentPage === totalPages}
    on:click={() => onPageChange(Math.min(totalPages, currentPage + 1))}
  >
    다음
  </button>
</div> 