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
  let editingProblemId = null;
  let editingProblemName = '';
  let originalProblemName = '';

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

  function handleKeydown(event) {
    if (event.key === 'Escape' && editingProblemId) {
      editingProblemName = originalProblemName;
      editingProblemId = null;
    }
  }

  async function handleDelete(id) {
    if (confirm('이 문제를 삭제하시겠습니까?')) {
      try {
        console.log('Deleting problem:', id);
        
        const { data, error } = await supabase
          .from('problems')
          .update({ is_active: false })
          .eq('id', id)
          .select();  // 업데이트된 데이터 반환

        console.log('Delete response:', { data, error });

        if (error) {
          console.error('Delete error:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          throw error;
        }

        if (!data) {
          throw new Error('삭제된 데이터를 찾을 수 없습니다.');
        }

        console.log('Delete successful');
        customProblems = customProblems.filter(p => p.id !== id);
        if (activeTab === id) {
          activeTab = 'sentence';
        }
        
      } catch (error) {
        console.error('Error in handleDelete:', error);
        alert(error.message || '문제 삭제 중 오류가 발생했습니다.');
      }
    }
  }

  async function handleEdit(problem) {
    editingProblemId = problem.id;
    editingProblemName = problem.name;
    originalProblemName = problem.name;
  }

  async function handleEditSubmit(problem) {
    if (editingProblemName.trim() === '') {
      alert('문제 이름을 입력해주세요.');
      return;
    }

    if (editingProblemName === originalProblemName) {
      editingProblemId = null;
      return;
    }

    try {
      console.log('Checking problem existence:', problem.id);
      
      // 먼저 해당 문제가 존재하는지 확인
      const { data: existingProblem, error: checkError } = await supabase
        .from('problems')
        .select('*')
        .eq('id', problem.id)
        .single();

      if (checkError) {
        console.error('Error checking problem:', checkError);
        throw checkError;
      }

      if (!existingProblem) {
        console.error('Problem not found:', problem.id);
        throw new Error('문제를 찾을 수 없습니다.');
      }

      console.log('Existing problem:', existingProblem);
      console.log('Updating problem:', {
        id: problem.id,
        newName: editingProblemName.trim(),
        originalName: originalProblemName
      });

      // 업데이트 쿼리와 데이터 조회를 분리
      const { error: updateError } = await supabase
        .from('problems')
        .update({ name: editingProblemName.trim() })
        .eq('id', problem.id)
        .eq('is_active', true);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      // 업데이트된 데이터 조회
      const { data: updatedData, error: fetchError } = await supabase
        .from('problems')
        .select('*')
        .eq('id', problem.id)
        .single();

      if (fetchError) {
        console.error('Fetch error after update:', fetchError);
        throw fetchError;
      }

      if (!updatedData) {
        console.error('No data returned after update');
        throw new Error('업데이트된 데이터를 찾을 수 없습니다.');
      }

      console.log('Update successful. Updated problem:', updatedData);
      customProblems = customProblems.map(p => 
        p.id === problem.id ? { ...p, name: editingProblemName.trim() } : p
      );
      
    } catch (error) {
      console.error('Error in handleEditSubmit:', error);
      alert(error.message || '문제 이름 수정 중 오류가 발생했습니다.');
      editingProblemName = originalProblemName;
    } finally {
      editingProblemId = null;
    }
  }

  async function handleEditCancel() {
    editingProblemName = originalProblemName;
    editingProblemId = null;
  }
</script>

<svelte:window on:keydown={handleKeydown} />

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
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-500">{problem.type}</span>
              
              {#if editingProblemId !== problem.id}
                <button
                  class="opacity-0 group-hover:opacity-100 transition-opacity"
                  on:click|stopPropagation={() => handleEdit(problem)}
                  title="이름 수정"
                >
                  <svg class="h-3.5 w-3.5 text-gray-500 hover:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              {/if}

              {#if editingProblemId === problem.id}
                <div class="flex items-center gap-1">
                  <input
                    type="text"
                    bind:value={editingProblemName}
                    class="w-24 px-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    on:keydown={(e) => {
                      if (e.key === 'Enter') handleEditSubmit(problem);
                      if (e.key === 'Escape') handleEditCancel();
                    }}
                    on:click|stopPropagation={() => {}}
                    placeholder="문제 이름"
                  />
                  <div class="flex gap-1">
                    <button
                      class="p-1 text-green-600 hover:text-green-700"
                      on:click|stopPropagation={() => handleEditSubmit(problem)}
                      title="변경 사항 저장"
                    >
                      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button
                      class="p-1 text-gray-400 hover:text-gray-600"
                      on:click|stopPropagation={handleEditCancel}
                      title="편집 취소"
                    >
                      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              {:else}
                <span>{problem.name || '제목 없음'}</span>
              {/if}
            </div>

            {#if !editingProblemId}
              <button
                class="absolute -right-2 -top-2 hidden group-hover:block"
                on:click|stopPropagation={() => handleDelete(problem.id)}
                title="문제 삭제"
              >
                <svg class="h-4 w-4 text-red-500 hover:text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            {/if}
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
          title={problem.name}
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
    }}
    on:success={async () => {
      // 데이터 새로고침
      const { data, error } = await supabase
        .from('problems')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });
      
      if (!error) {
        customProblems = data;
      }
    }}
  />
{/if} 