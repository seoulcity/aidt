<!-- src/routes/miraen/common-writing/CreateProblemModal.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import { generateProblem } from '$lib/problemGeneratorService';
  import ModalHeader from './components/ModalHeader.svelte';
  import ProblemTypeInput from './components/ProblemTypeInput.svelte';

  const dispatch = createEventDispatcher();

  let type = '';
  let name = '';
  let content = '';
  let generatedContent = '';
  let modelAnswer = '';
  let isSubmitting = false;
  let isGenerating = false;

  // 예시 답안 배열
  let examples = [
    {
      id: 1,
      answer: '',
      evaluation: '',
      feedback: ''
    }
  ];

  // 각 예시 답안의 토글 상태를 관리하는 배열
  let showDetails = [];

  let retryCount = 0;
  let maxRetries = 3;
  let statusMessage = '';

  let exampleProblem = '';
  let showExampleDropdown = false;

  function addExample() {
    const newId = examples.length + 1;
    examples = [...examples, {
      id: newId,
      answer: '',
      evaluation: '',
      feedback: ''
    }];
    showDetails = [...showDetails, false];
  }

  function removeExample(index) {
    examples = examples.filter((_, i) => i !== index);
    showDetails = showDetails.filter((_, i) => i !== index);
  }

  // 초기 예시 답안의 토글 상태 설정
  $: {
    if (showDetails.length !== examples.length) {
      showDetails = Array(examples.length).fill(false);
    }
  }

  async function handleSubmit() {
    if (!type.trim()) {
      alert('문제 종류를 선택해주세요.');
      return;
    }

    if (!name.trim()) {
      alert('문제 이름을 입력해주세요.');
      return;
    }

    if (!generatedContent.trim()) {
      alert('문항 내용을 생성해주세요.');
      return;
    }

    if (!modelAnswer.trim()) {
      alert('모답안을 입력해주요.');
      return;
    }

    // 빈 답안 필터링
    const validExamples = examples.filter(ex => ex.answer.trim()).map(ex => ({
      ...ex,
      answer: ex.answer.trim(),
      evaluation: ex.evaluation?.trim() || '',
      feedback: ex.feedback?.trim() || ''
    }));
    
    if (validExamples.length === 0) {
      alert('최소 하나의 예시 답안을 입력해주세요.');
      return;
    }

    isSubmitting = true;
    try {
      const { data, error } = await supabase
        .from('problems')
        .insert([
          {
            type: type.trim(),
            name: name.trim(),
            content: generatedContent.trim(),
            model_answer: modelAnswer.trim(),
            example_answer: validExamples,
            is_active: true
          },
        ]);

      if (error) throw error;
      
      alert('문제가 성공적으로 생성되었습니다.');
      dispatch('success');
      dispatch('close');
    } catch (error) {
      console.error('Error creating problem:', error);
      alert('문제 생성 중 오류가 발생했습니다.');
    } finally {
      isSubmitting = false;
    }
  }

  async function generateNewProblem() {
    if (!type.trim() || !content.trim() || !exampleProblem.trim()) {
      alert('문제 종류, 생성 요청 내용, 예시 문제를 모두 입력해주세요.');
      return;
    }

    isGenerating = true;
    retryCount = 0;
    statusMessage = '문제를 생성하는 중입니다...';

    async function tryGenerate() {
      try {
        const generated = await generateProblem(type, content, exampleProblem);
        
        // 생성된 데이터로 폼 업데이트
        generatedContent = generated.content;
        retryCount = generated.retryCount;
        statusMessage = '문제가 성공적으로 생성되었습니다.';
        return true;
      } catch (error) {
        console.error('Generation attempt failed:', error);
        retryCount++;
        
        if (retryCount < maxRetries) {
          statusMessage = `문제 생성 재시도 중... (시도 ${retryCount}/${maxRetries})`;
          return false;
        } else {
          throw error;
        }
      }
    }

    try {
      let success = false;
      while (!success && retryCount < maxRetries) {
        success = await tryGenerate();
        if (!success) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 재시도 전 1초 대기
        }
      }
      
      if (!success) {
        throw new Error('최대 재시도 횟수를 초과했습니다.');
      }
    } catch (error) {
      console.error('Error generating problem:', {
        message: error.message,
        stack: error.stack,
        error
      });
      statusMessage = `문제 생성 중 오류가 발생했습니다: ${error.message}`;
      alert(statusMessage);
    } finally {
      isGenerating = false;
    }
  }

  // 드롭다운 외부 클릭 시 닫기
  function handleClickOutside(event) {
    if (showExampleDropdown && !event.target.closest('.group')) {
      showExampleDropdown = false;
    }
  }
</script>

<!-- 템플릿 시작: 모달 컨테이너 -->
<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
  <div class="bg-white rounded-lg max-w-2xl w-full p-6">
    <ModalHeader on:close={() => dispatch('close')} />

    <form on:submit|preventDefault={handleSubmit} class="space-y-4">
      <ProblemTypeInput bind:type />

      <!-- 문제 이름 입력 필드 추가 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          문제 이름
        </label>
        <input
          type="text"
          bind:value={name}
          required
          class="w-full border border-gray-300 rounded-md px-3 py-2"
          placeholder="문제의 이름을 입력하세요..."
        />
      </div>

      <!-- 예시 문제 입력 섹션 -->
      <div>
        <div class="flex items-center justify-between mb-1">
          <label class="block text-sm font-medium text-gray-700">
            참고할 예시 문제
          </label>
          <div class="flex items-center gap-2">
            <div class="relative">
              <button
                type="button"
                class="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 group"
                on:click={() => showExampleDropdown = !showExampleDropdown}
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
                기존 문제 불러오기
              </button>
              {#if showExampleDropdown}
                <div class="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 border">
                  <button
                    type="button"
                    class="w-full text-left px-4 py-2 text-xs hover:bg-gray-100"
                    on:click={() => {
                      exampleProblem = `문제: Claire is the girl _______. (ride a red bike)

예시 답안:
1. Claire is the girl who is riding a red bike.
2. Claire is the girl who rides a red bike.
3. Claire is the girl that is riding a red bike.`;
                      showExampleDropdown = false;
                    }}
                  >
                    문장 완성하기 예시
                  </button>
                  <button
                    type="button"
                    class="w-full text-left px-4 py-2 text-xs hover:bg-gray-100"
                    on:click={() => {
                      exampleProblem = `문제: Write about your summer vacation plans. Fill in the blanks with appropriate sentences.

My Summer Vacation Plans

This summer, I have exciting plans for my vacation. First, _________________. 
After that, _________________. I can't wait for this amazing summer vacation!

예시 답안:
1. I'm going to visit Jeju Island with my family for a week
2. we will explore famous tourist attractions and try local foods`;
                      showExampleDropdown = false;
                    }}
                  >
                    문단 완성하기 예시
                  </button>
                </div>
              {/if}
            </div>
            <button
              type="button"
              class="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
              on:click={() => {
                exampleProblem = "여행 계획을 세우는 50단어 내외의 영작문 문제를 만들어줘. 문제에 반드시 빈칸('___________')이 포함도록 해줘.";
              }}
            >
            </button>
          </div>
        </div>
        <textarea
          bind:value={exampleProblem}
          required
          class="w-full border border-gray-300 rounded-md px-3 py-2 h-24"
          placeholder="AI가 참고할 예시 문제를 입력하세요. 형식과 난이도의 기준이 됩니다."
        ></textarea>
      </div>

      <!-- 문제 생성 요청 섹션 -->
      <div>
        <div class="flex items-center justify-between mb-1">
          <label class="block text-sm font-medium text-gray-700">
            문제 생성 요청
          </label>
          <button
            type="button"
            class="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
            on:click={() => {
              content = "자기가 좋아하는 취미 활동을 소개하는 50단어 내외의 영작문 문제를 만들어줘. 문제에 반드시 빈칸('___________')이 포함도록 해줘.";
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            예시 문제 입력
          </button>
        </div>
        <div class="relative mb-12">
          <textarea
            bind:value={content}
            required
            class="w-full border border-gray-300 rounded-md px-3 py-2 h-24"
            placeholder="예: '관계대명사 who를 사용하는 문장을 만들어주세요' 또는 '일상생활에서 현재진행형을 사용하는 상황을 설명하는 문단을 만들어주세요'"
          ></textarea>
          <div class="absolute -bottom-10 right-0 flex items-center gap-2">
            {#if statusMessage}
              <div class="text-sm {statusMessage.includes('오류') ? 'text-red-600' : 'text-green-600'}">
                {statusMessage}
              </div>
            {/if}
            <button
              type="button"
              class="px-3 py-1.5 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 disabled:opacity-50 flex items-center gap-1"
              on:click={generateNewProblem}
              disabled={isGenerating || !type.trim() || !content.trim()}
            >
              {#if isGenerating}
                <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>생성 중...</span>
              {:else}
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>새로운 문제 만들기</span>
              {/if}
            </button>
          </div>
        </div>
      </div>

      <!-- 문항 내용 입력 섹션 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          문항 내용
        </label>
        <textarea
          bind:value={generatedContent}
          class="w-full border border-gray-300 rounded-md px-3 py-2 h-24"
          placeholder="생성된 문항 내용이 여기에 표시됩니다. 필요한 경우 직접 수정할 수 있습니다."
        ></textarea>
      </div>

      <!-- 모범답안 입력 섹션 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          모범답안
        </label>
        <textarea
          bind:value={modelAnswer}
          required
          class="w-full border border-gray-300 rounded-md px-3 py-2 h-24"
          placeholder="모범답안을 입력하세요..."
        ></textarea>
      </div>

      <!-- 예시 답안 섹션 -->
      <div class="space-y-4 mt-4">
        <!-- 예시 답안 헤더 -->
        <div class="flex justify-between items-center">
          <label class="block text-sm font-medium text-gray-700">
            예시 답안
          </label>
          <button
            type="button"
            class="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            on:click={addExample}
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            예시 답안 추가
          </button>
        </div>

        <!-- 예시 답안 리스트 -->
        {#each examples as example, index}
          <!-- 개별 예시 답안 카드 -->
          <div class="border rounded-lg p-4 relative">
            {#if examples.length > 1}
              <button
                class="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                on:click={() => removeExample(index)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            {/if}

            <div class="space-y-3">
              <div class="relative">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  답안
                </label>
                <span class="absolute right-2 top-1 text-sm text-gray-500">
                  #{example.id}
                </span>
                <textarea
                  bind:value={example.answer}
                  required
                  class="w-full border border-gray-300 rounded-md px-3 py-2 h-20"
                  placeholder="예시 답안을 입력하세요..."
                ></textarea>
              </div>

              <div class="flex justify-end">
                <button
                  type="button"
                  class="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                  on:click={() => showDetails[index] = !showDetails[index]}
                >
                  <span class="mr-1">{showDetails[index] ? '평가/피드백 숨기기' : '평가/피드백 추가'}</span>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    class="h-4 w-4 transition-transform duration-200 {showDetails[index] ? 'rotate-180' : ''}" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {#if showDetails[index]}
                <div class="space-y-3 pt-2 border-t">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      평가 (선택사항)
                    </label>
                    <input
                      type="text"
                      bind:value={example.evaluation}
                      class="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="예: 타겟 문법- 2개 O"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      피드백 (선택사항)
                    </label>
                    <textarea
                      bind:value={example.feedback}
                      class="w-full border border-gray-300 rounded-md px-3 py-2 h-20"
                      placeholder="피드백 내용을 입력하세요..."
                    ></textarea>
                  </div>
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </div>

      <!-- 모달 푸터: 취소/저장 버튼 -->
      <div class="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
          on:click={() => dispatch('close')}
        >
          취소
        </button>
        <button
          type="submit"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
          disabled={isSubmitting}
          on:click={handleSubmit}
        >
          {isSubmitting ? '저장 중...' : '저장하기'}
        </button>
      </div>
    </form>
  </div>
</div>

<!-- 클릭 이벤트 핸들러 -->
<svelte:window on:click={handleClickOutside} /> 