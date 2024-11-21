<!-- src/routes/miraen/common-writing/+page.svelte -->
<script>
  import { onMount } from 'svelte';
  import BrandingBeta from '$lib/components/BrandingBeta.svelte';
  import SentenceTask from './SentenceTask.svelte';
  import ParagraphTask from './ParagraphTask.svelte';
  import CreateProblemModal from './CreateProblemModal.svelte';
  import WritingTask from '$lib/components/WritingTask.svelte';
  import { supabase } from '$lib/supabaseClient';

  let activeTab = 'sentence';
  let showCreateModal = false;
  let customProblems = [];
  let showDeleteConfirm = null;

  onMount(async () => {
    const { data, error } = await supabase
      .from('problems')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });
    
    if (!error) {
      customProblems = data;
    }
  });

  async function handleDelete(id) {
    if (confirm('이 문제를 삭제하시겠습니까?')) {
      const { error } = await supabase
        .from('problems')
        .update({ is_active: false })
        .eq('id', id);

      if (!error) {
        customProblems = customProblems.filter(p => p.id !== id);
        if (activeTab === id) {
          activeTab = 'sentence';
        }
      }
    }
  }
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
      <nav class="-mb-px flex flex-wrap">
        <button
          class={`py-2 px-4 border-b-2 font-medium text-sm relative group ${
            activeTab === 'sentence'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          on:click={() => (activeTab = 'sentence')}
        >
          문장 완성하기
        </button>
        <button
          class={`ml-8 py-2 px-4 border-b-2 font-medium text-sm relative group ${
            activeTab === 'paragraph'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          on:click={() => (activeTab = 'paragraph')}
        >
          문단 완성하기
        </button>

        {#each customProblems as problem}
          <button
            class={`ml-8 py-2 px-4 border-b-2 font-medium text-sm relative group ${
              activeTab === problem.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            on:click={() => (activeTab = problem.id)}
          >
            {problem.type}
            <button
              class="absolute -right-2 -top-2 hidden group-hover:block"
              on:click|stopPropagation={() => handleDelete(problem.id)}
            >
              <svg class="h-4 w-4 text-red-500 hover:text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </button>
        {/each}

        <button
          class={`ml-8 py-2 px-4 border-b-2 font-medium text-sm flex items-center gap-1 ${
            showCreateModal
              ? 'border-green-500 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          on:click={() => (showCreateModal = true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          새 문제 만들기
        </button>
      </nav>
    </div>
  </div>

  {#if activeTab === 'sentence'}
    <SentenceTask />
  {:else if activeTab === 'paragraph'}
    <ParagraphTask />
  {:else}
    {#each customProblems as problem}
      {#if activeTab === problem.id}
        <WritingTask
          title={problem.type}
          description=""
          problem={problem.content}
          examples={problem.example_answer}
          modelAnswer={problem.model_answer}
          taskType="custom"
        />
      {/if}
    {/each}
  {/if}
</div>

{#if showCreateModal}
  <CreateProblemModal 
    on:close={() => {
      showCreateModal = false;
      onMount();
    }} 
  />
{/if} 