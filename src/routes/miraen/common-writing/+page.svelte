<script>
  import BrandingBeta from '$lib/components/BrandingBeta.svelte';
  import SentenceTask from './SentenceTask.svelte';
  import ParagraphTask from './ParagraphTask.svelte';

  let activeTab = 'sentence';
</script>

<div class="container mx-auto px-4 py-8">
  <header class="mb-8">
    <h1 class="text-3xl font-bold text-center">공통 영어 쓰기 활동 평가</h1>
    <div class="text-center mt-2 mb-4">
      <BrandingBeta />
    </div>
    <a href="/" class="text-blue-500 hover:underline mb-4 inline-block">← 홈으로 돌아가기</a>
  </header>

  <div class="mb-6">
    <div class="border-b border-gray-200">
      <nav class="-mb-px flex">
        <button
          class={`py-2 px-4 border-b-2 font-medium text-sm ${
            activeTab === 'sentence'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          on:click={() => (activeTab = 'sentence')}
        >
          문장 완성하기
        </button>
        <button
          class={`ml-8 py-2 px-4 border-b-2 font-medium text-sm ${
            activeTab === 'paragraph'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          on:click={() => (activeTab = 'paragraph')}
        >
          문단 완성하기
        </button>
      </nav>
    </div>
  </div>

  {#if activeTab === 'sentence'}
    <SentenceTask />
  {:else}
    <ParagraphTask />
  {/if}
</div> 