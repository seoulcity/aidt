<!-- src/lib/components/grammar-search/EditModal.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  export let editingData;
  export let show = false;
  
  function close() {
    dispatch('close');
  }
  
  function save() {
    dispatch('save');
  }
</script>

{#if show && editingData}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
      <div class="flex justify-between items-start mb-4">
        <h3 class="text-xl font-bold">임베딩 수정</h3>
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
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="edit-textbook" class="block text-sm font-medium text-gray-700">교과서명</label>
            <input 
              id="edit-textbook" 
              type="text" 
              bind:value={editingData.textbook} 
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
            />
          </div>
          
          <div>
            <label for="edit-school-level" class="block text-sm font-medium text-gray-700">학교급</label>
            <select 
              id="edit-school-level" 
              bind:value={editingData.schoolLevel} 
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option>초등학교</option>
              <option>중학교</option>
              <option>고등학교</option>
            </select>
          </div>

          <div>
            <label for="edit-grade" class="block text-sm font-medium text-gray-700">학년</label>
            <select 
              id="edit-grade" 
              bind:value={editingData.grade} 
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option>1</option>
              <option>2</option>
              <option>3</option>
              <option>4</option>
              <option>5</option>
              <option>6</option>
            </select>
          </div>

          <div>
            <label for="edit-unit" class="block text-sm font-medium text-gray-700">단원</label>
            <input 
              id="edit-unit" 
              type="text" 
              bind:value={editingData.unit} 
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
            />
          </div>

          <div class="col-span-2">
            <label for="edit-topic" class="block text-sm font-medium text-gray-700">주제</label>
            <input 
              id="edit-topic" 
              type="text" 
              bind:value={editingData.topic} 
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
            />
          </div>

          <div class="col-span-2">
            <label for="edit-context" class="block text-sm font-medium text-gray-700">내용</label>
            <textarea
              id="edit-context"
              bind:value={editingData.context}
              rows="6"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            ></textarea>
          </div>
        </div>

        <div class="flex justify-end space-x-3 mt-4">
          <button
            type="button"
            on:click={close}
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            취소
          </button>
          <button
            type="button"
            on:click={save}
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  input, select, textarea {
    width: 100%;
  }
  
  :global(input:focus), :global(select:focus), :global(textarea:focus) {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }
  
  /* 스크롤바 스타일링 */
  div {
    scrollbar-width: thin;
    scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
  }
  
  div::-webkit-scrollbar {
    width: 6px;
  }
  
  div::-webkit-scrollbar-track {
    background: transparent;
  }
  
  div::-webkit-scrollbar-thumb {
    background-color: rgba(156, 163, 175, 0.5);
    border-radius: 3px;
  }
</style> 