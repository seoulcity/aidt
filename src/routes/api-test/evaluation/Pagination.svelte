<script lang="ts">
  export let currentPage: number;
  export let totalPages: number = 1; // 기본값 설정
  export let onPageChange: (page: number) => void;
  
  // 최소 1페이지 보장
  $: safeCurrentPage = Math.max(1, currentPage);
  $: safeTotalPages = Math.max(1, totalPages);
  
  // 표시할 페이지 버튼 수 계산
  const maxVisibleButtons = 5;
  
  $: startPage = Math.max(1, safeCurrentPage - Math.floor(maxVisibleButtons / 2));
  $: endPage = Math.min(safeTotalPages, startPage + maxVisibleButtons - 1);
  $: adjustedStartPage = Math.max(1, endPage - maxVisibleButtons + 1);
  
  $: visiblePages = Array.from(
    { length: endPage - adjustedStartPage + 1 },
    (_, i) => adjustedStartPage + i
  );
  
  function goToPage(page: number) {
    if (page >= 1 && page <= safeTotalPages && page !== safeCurrentPage) {
      onPageChange(page);
    }
  }
</script>

<div class="flex justify-center items-center space-x-1 my-4">
  <!-- 첫 페이지 버튼 -->
  <button
    class="px-3 py-1 rounded border {safeCurrentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'}"
    on:click={() => goToPage(1)}
    disabled={safeCurrentPage === 1}
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
    </svg>
  </button>
  
  <!-- 이전 페이지 버튼 -->
  <button
    class="px-3 py-1 rounded border {safeCurrentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'}"
    on:click={() => goToPage(safeCurrentPage - 1)}
    disabled={safeCurrentPage === 1}
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
    </svg>
  </button>
  
  <!-- 페이지 번호 버튼 -->
  {#each visiblePages as page}
    <button
      class="px-3 py-1 rounded border {safeCurrentPage === page ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}"
      on:click={() => goToPage(page)}
    >
      {page}
    </button>
  {/each}
  
  <!-- 다음 페이지 버튼 -->
  <button
    class="px-3 py-1 rounded border {safeCurrentPage === safeTotalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'}"
    on:click={() => goToPage(safeCurrentPage + 1)}
    disabled={safeCurrentPage === safeTotalPages}
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
    </svg>
  </button>
  
  <!-- 마지막 페이지 버튼 -->
  <button
    class="px-3 py-1 rounded border {safeCurrentPage === safeTotalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'}"
    on:click={() => goToPage(safeTotalPages)}
    disabled={safeCurrentPage === safeTotalPages}
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clip-rule="evenodd" />
      <path fill-rule="evenodd" d="M4.293 15.707a1 1 0 010-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clip-rule="evenodd" />
    </svg>
  </button>
</div> 