<script>
    export let activeTab = 'dashboard';
</script>

<nav class="mb-8 flex justify-between items-center">
    <h1 class="text-2xl font-bold">수학 학습 플랫폼</h1>
    <div class="flex gap-4">
        <button 
            class={`px-4 py-2 rounded-lg transition-colors
                ${activeTab === 'dashboard' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
            on:click={() => activeTab = 'dashboard'}
        >
            대시보드
        </button>
        <button 
            class={`px-4 py-2 rounded-lg transition-colors
                ${activeTab === 'learning' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
            on:click={() => activeTab = 'learning'}
        >
            학습하기
        </button>
        <button 
            class={`px-4 py-2 rounded-lg transition-colors
                ${activeTab === 'assessment' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
            on:click={() => activeTab = 'assessment'}
        >
            평가보기
        </button>
    </div>
</nav> 