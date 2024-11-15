<!-- src/lib/components/grammar-search/EmbeddingModal.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  export let embedding;
  export let show = false;
  
  function close() {
    dispatch('close');
  }
</script>

{#if show && embedding}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
      <div class="flex justify-between items-start mb-4">
        <h3 class="text-xl font-bold">임베딩 상세 정보</h3>
        <button 
          class="text-gray-500 hover:text-gray-700"
          on:click={close}
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div class="space-y-4">
        <div>
          <h4 class="font-semibold">기본 정보</h4>
          <p>ID: {embedding.id}</p>
          <p>생성일: {new Date(embedding.createdAt).toLocaleString()}</p>
          <p>파일명: {embedding.filename}</p>
        </div>
        
        <div>
          <h4 class="font-semibold">메타데이터</h4>
          <p>교과서: {embedding.textbook}</p>
          <p>학교급: {embedding.schoolLevel}</p>
          <p>학년: {embedding.grade}</p>
          <p>단원: {embedding.unit}</p>
          <p>주제: {embedding.topic}</p>
        </div>
        
        <div>
          <h4 class="font-semibold">내용</h4>
          <p class="whitespace-pre-wrap">{embedding.context}</p>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  /* 스크롤바 스타일링 */
  :global(.modal-content) {
    scrollbar-width: thin;
    scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
  }
  
  :global(.modal-content::-webkit-scrollbar) {
    width: 6px;
  }
  
  :global(.modal-content::-webkit-scrollbar-track) {
    background: transparent;
  }
  
  :global(.modal-content::-webkit-scrollbar-thumb) {
    background-color: rgba(156, 163, 175, 0.5);
    border-radius: 3px;
  }
</style> 