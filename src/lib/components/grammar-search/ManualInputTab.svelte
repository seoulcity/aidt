<!-- src/lib/components/grammar-search/ManualInputTab.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  export let formData;
  export let isSubmitting;
  
  function handleSubmit() {
    dispatch('submit');
  }
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-6 bg-white p-6 rounded-lg shadow-md mb-8">
  <div class="grid grid-cols-2 gap-6">
    <div>
      <label for="embedding-id" class="block text-sm font-medium text-gray-700">ID</label>
      <div id="embedding-id" class="mt-1 block w-full py-2 px-3 bg-gray-100 rounded-md">
        {formData.id}
      </div>
    </div>
    
    <div>
      <label for="textbook" class="block text-sm font-medium text-gray-700">교과서명</label>
      <input 
        id="textbook" 
        type="text" 
        bind:value={formData.textbook} 
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
        required 
      />
    </div>

    <div>
      <label for="school-level" class="block text-sm font-medium text-gray-700">학교급</label>
      <select 
        id="school-level" 
        bind:value={formData.schoolLevel} 
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      >
        <option>초등학교</option>
        <option>중학교</option>
        <option>고등학교</option>
      </select>
    </div>

    <div>
      <label for="grade" class="block text-sm font-medium text-gray-700">학년</label>
      <select 
        id="grade" 
        bind:value={formData.grade} 
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
      <label for="unit" class="block text-sm font-medium text-gray-700">단원</label>
      <input 
        id="unit" 
        type="text" 
        bind:value={formData.unit} 
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
        required 
      />
    </div>

    <div>
      <label for="topic" class="block text-sm font-medium text-gray-700">주제</label>
      <input 
        id="topic" 
        type="text" 
        bind:value={formData.topic} 
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
        required 
      />
    </div>
  </div>

  <div>
    <label for="context" class="block text-sm font-medium text-gray-700">내용 (Context)</label>
    <textarea
      id="context"
      bind:value={formData.context}
      rows="6"
      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      required
    ></textarea>
  </div>

  <div class="flex justify-end">
    <button
      type="submit"
      disabled={isSubmitting}
      class="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {#if isSubmitting}
        처리 중...
      {:else}
        임베딩 생성
      {/if}
    </button>
  </div>
</form>

<style>
  input, select, textarea {
    width: 100%;
  }
  
  :global(input:focus), :global(select:focus), :global(textarea:focus) {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }
</style> 