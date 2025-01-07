<!-- src/lib/components/grammar-search/TabNavigation.svelte -->
<script>
  export let activeTab;
  export let onTabChange;
</script>

<nav class="-mb-px flex space-x-8" aria-label="Tabs">
  <button
    class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
    {activeTab === 'chat' 
      ? 'border-blue-500 text-blue-600'
      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
    on:click={() => onTabChange('chat')}
  >
    내용 탐색기반 AI 채팅
  </button>
  <button
    class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
    {activeTab === 'manual' 
      ? 'border-blue-500 text-blue-600'
      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
    on:click={() => onTabChange('manual')}
  >
    직접 입력
  </button>
  <button
    class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
    {activeTab === 'file'
      ? 'border-blue-500 text-blue-600'
      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
    on:click={() => onTabChange('file')}
  >
    파일 업로드
  </button>
  <button
    class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
    {activeTab === 'list'
      ? 'border-blue-500 text-blue-600'
      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
    on:click={() => onTabChange('list')}
  >
    데이터 목록
  </button>
</nav> 