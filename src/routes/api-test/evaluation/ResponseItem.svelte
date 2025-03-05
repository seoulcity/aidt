<!-- src/routes/api-test/evaluation/ResponseItem.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { truncateText, formatDate, ensureFeedbackValue, categories } from './evaluationService';
  import type { ResponseData } from './types';

  export let response: ResponseData;
  export let expanded: boolean = false;
  
  const dispatch = createEventDispatcher();
  
  // RAGAS 테스트 관련 상태
  let isRagasLoading = false;
  let ragasResults: any = null;
  let ragasError: string | null = null;
  let activeTab: 'human' | 'ragas' = 'human';
  let showRagasConfirmation = false;
  
  // 탭 전환 함수
  function switchTab(tab: 'human' | 'ragas') {
    activeTab = tab;
  }
  
  // 응답 확장/축소 토글
  function toggleExpand() {
    dispatch('toggleExpand', { id: response.id });
  }
  
  // 평가 업데이트 함수
  function updateEvaluation(feedback: 0 | 1) {
    dispatch('evaluate', {
      id: response.id,
      feedback,
      note: response.human_feedback_note || '',
      category: response.query_category
    });
  }
  
  // 카테고리 변경 함수
  function updateCategory(event: Event) {
    const select = event.target as HTMLSelectElement;
    dispatch('evaluate', {
      id: response.id,
      feedback: ensureFeedbackValue(response.human_feedback),
      note: response.human_feedback_note || '',
      category: select.value
    });
  }
  
  // 평가 노트 변경 함수
  function updateNote(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    dispatch('evaluate', {
      id: response.id,
      feedback: ensureFeedbackValue(response.human_feedback),
      note: textarea.value,
      category: response.query_category
    });
  }
  
  // RAGAS 버튼 클릭 핸들러
  function handleRagasButtonClick() {
    if (!expanded) {
      toggleExpand();
    }
    activeTab = 'ragas';
    
    if (hasRagasResults) {
      showRagasConfirmation = true;
    } else {
      runRagasTest();
    }
  }
  
  // RAGAS 확인 대화상자 닫기
  function closeRagasConfirmation() {
    showRagasConfirmation = false;
  }
  
  // RAGAS 테스트 실행 함수
  async function runRagasTest() {
    if (isRagasLoading) return;
    
    showRagasConfirmation = false;
    isRagasLoading = true;
    ragasError = null;
    
    try {
      const apiResponse = await fetch('http://localhost:8001/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_input: response.input_text,
          response: response.response_text,
          metrics: ["answer_relevancy", "faithfulness"]
        }),
      });
      
      if (!apiResponse.ok) {
        throw new Error(`API 응답 오류: ${apiResponse.status}`);
      }
      
      ragasResults = await apiResponse.json();
      console.log('RAGAS 결과:', ragasResults);
      
      // 결과 저장 이벤트 발생
      dispatch('saveRagasResults', {
        id: response.id,
        results: ragasResults
      });
      
    } catch (error) {
      console.error('RAGAS 테스트 오류:', error);
      ragasError = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    } finally {
      isRagasLoading = false;
    }
  }
  
  // RAGAS 결과 표시 함수
  function getRagasScoreClass(score: unknown) {
    const numScore = Number(score);
    if (numScore >= 0.8) return 'text-green-600';
    if (numScore >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  }
  
  // RAGAS 결과가 이미 있는지 확인
  $: hasRagasResults = response.ragas_feedback && Object.keys(response.ragas_feedback).length > 0;
</script>

<div class="border rounded-lg bg-white">
  <!-- 접힌 상태의 헤더 -->
  <div class="p-4 flex items-center justify-between gap-4">
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2">
        <button
          class="flex-shrink-0"
          on:click={toggleExpand}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            class="h-5 w-5 transform transition-transform {expanded ? 'rotate-90' : ''}" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
          </svg>
        </button>
        <div class="truncate">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-sm text-gray-500">{response.query_category || '분류 없음'}</span>
            {#if response.evaluated_at}
              <span class="text-xs text-gray-400">• {formatDate(response.evaluated_at)}</span>
            {/if}
          </div>
          <span class="font-medium">Q:</span> {truncateText(response.input_text)}
          <br />
          <span class="font-medium">A:</span> {truncateText(response.response_text)}
        </div>
      </div>
    </div>
    
    <div class="flex items-center gap-4 flex-shrink-0">
      <!-- 휴먼 테스트 버튼 그룹 -->
      <div class="flex flex-col items-center">
        <span class="text-xs text-gray-500 mb-1">휴먼 테스트</span>
        <div class="flex gap-1">
          <button
            class="px-3 py-1.5 rounded text-sm {response.human_feedback === 1 ? 'bg-green-500 text-white' : 'bg-gray-100'}"
            on:click={() => updateEvaluation(1)}
          >
            Pass
          </button>
          <button
            class="px-3 py-1.5 rounded text-sm {response.human_feedback === 0 ? 'bg-red-500 text-white' : 'bg-gray-100'}"
            on:click={() => updateEvaluation(0)}
          >
            Fail
          </button>
        </div>
      </div>
      
      <!-- AI 테스트 버튼 그룹 -->
      <div class="flex flex-col items-center">
        <span class="text-xs text-gray-500 mb-1">AI 테스트</span>
        <button
          class="px-4 py-1.5 rounded text-sm {hasRagasResults 
            ? 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50' 
            : 'bg-blue-500 text-white hover:bg-blue-600'}"
          on:click={handleRagasButtonClick}
        >
          {hasRagasResults ? 'RAGAS ✅' : 'RAGAS'}
        </button>
      </div>
    </div>
  </div>

  <!-- 펼쳐진 상태의 상세 내용 -->
  {#if expanded}
    <div class="px-4 pb-4 border-t">
      <!-- 탭 메뉴 -->
      <div class="flex border-b mt-2">
        <button 
          class="py-2 px-4 {activeTab === 'human' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}"
          on:click={() => switchTab('human')}
        >
          Human 평가
        </button>
        <button 
          class="py-2 px-4 {activeTab === 'ragas' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}"
          on:click={() => switchTab('ragas')}
        >
          RAGAS 평가
        </button>
      </div>

      <!-- 질문과 응답 내용 (공통) -->
      <div class="mt-4">
        <h3 class="font-medium mb-2">Query:</h3>
        <p class="whitespace-pre-wrap bg-gray-50 p-3 rounded">{response.input_text}</p>
      </div>

      <div class="mt-4">
        <h3 class="font-medium mb-2">Response:</h3>
        <p class="whitespace-pre-wrap bg-gray-50 p-3 rounded">{response.response_text}</p>
      </div>

      <!-- Human 평가 탭 내용 -->
      {#if activeTab === 'human'}
        <div class="mt-4 space-y-4">
          <div>
            <label for="category-{response.id}" class="block text-sm font-medium text-gray-700 mb-1">
              질의 분류
            </label>
            <select
              id="category-{response.id}"
              class="w-full p-2 border rounded-md"
              value={response.query_category || '분류 없음'}
              on:change={updateCategory}
            >
              {#each categories as category}
                <option value={category}>{category}</option>
              {/each}
            </select>
          </div>

          <div>
            <label for="note-{response.id}" class="block text-sm font-medium text-gray-700 mb-1">
              평가 비고
            </label>
            <textarea
              id="note-{response.id}"
              class="w-full p-2 border rounded-md"
              rows="2"
              placeholder="평가에 대한 의견을 입력하세요..."
              value={response.human_feedback_note || ''}
              on:change={updateNote}
            />
          </div>
        </div>
      {/if}

      <!-- RAGAS 평가 탭 내용 -->
      {#if activeTab === 'ragas'}
        <div class="mt-4 space-y-4">
          <!-- RAGAS 평가 지표 설명 -->
          <div class="bg-blue-50 p-4 rounded-md border border-blue-100 mb-4">
            <h3 class="font-medium text-blue-800 mb-2">RAGAS 평가 지표 설명</h3>
            <ul class="list-disc pl-5 text-sm text-blue-700 space-y-2">
              <li class="relative group">
                <div class="flex items-center">
                  <strong>답변 관련성 (Answer Relevancy)</strong>: 질문과 응답 간의 관련성을 평가합니다. 
                  질문에 직접적으로 관련된 응답일수록 높은 점수를 받습니다.
                  <button class="ml-1 text-blue-500 hover:text-blue-700 focus:outline-none">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </div>
                <div class="hidden group-hover:block absolute left-0 top-full mt-2 w-96 p-4 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                  <h4 class="font-bold text-gray-800 mb-2">답변 관련성 계산 방식</h4>
                  <p class="mb-2 text-gray-700">응답이 사용자의 질문에 얼마나 관련되어 있는지를 측정합니다.</p>
                  
                  <h5 class="font-semibold text-gray-800 mt-3 mb-1">계산 과정:</h5>
                  <ol class="list-decimal pl-5 text-gray-700 mb-3">
                    <li>응답 내용을 기반으로 인공 질문 세트(기본 3개)를 생성합니다.</li>
                    <li>사용자 질문과 각 생성된 질문 간의 코사인 유사도를 계산합니다.</li>
                    <li>이러한 코사인 유사도 점수의 평균을 구해 최종 관련성 점수를 산출합니다.</li>
                  </ol>
                  
                  <h5 class="font-semibold text-gray-800 mt-3 mb-1">예시:</h5>
                  <p class="mb-1 text-gray-700"><strong>질문:</strong> 프랑스는 어디에 있고 수도는 무엇인가요?</p>
                  <p class="mb-1 text-gray-700"><strong>낮은 관련성 응답:</strong> 프랑스는 서유럽에 있습니다.</p>
                  <p class="mb-3 text-gray-700"><strong>높은 관련성 응답:</strong> 프랑스는 서유럽에 있으며 수도는 파리입니다.</p>
                  
                  <p class="text-xs text-gray-500 mt-2">* 점수는 0~1 사이이며, 1에 가까울수록 질문과 응답의 관련성이 높음을 의미합니다.</p>
                </div>
              </li>
              <li class="relative group">
                <div class="flex items-center">
                  <strong>답변 충실도 (Faithfulness)</strong>: 응답이 사실에 얼마나 충실한지 평가합니다. 
                  정확하고 신뢰할 수 있는 정보를 제공할수록 높은 점수를 받습니다.
                  <button class="ml-1 text-blue-500 hover:text-blue-700 focus:outline-none">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </div>
                <div class="hidden group-hover:block absolute left-0 top-full mt-2 w-96 p-4 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                  <h4 class="font-bold text-gray-800 mb-2">답변 충실도 계산 방식</h4>
                  <p class="mb-2 text-gray-700">응답이 검색된 컨텍스트와 얼마나 사실적으로 일치하는지 측정합니다.</p>
                  
                  <h5 class="font-semibold text-gray-800 mt-3 mb-1">계산 과정:</h5>
                  <ol class="list-decimal pl-5 text-gray-700 mb-3">
                    <li>응답에서 모든 주장(사실 진술)을 식별합니다.</li>
                    <li>각 주장이 검색된 컨텍스트에서 추론될 수 있는지 확인합니다.</li>
                    <li>다음 공식을 사용하여 충실도 점수를 계산합니다:</li>
                  </ol>
                  
                  <div class="bg-gray-100 p-2 rounded text-center mb-3">
                    <p class="text-gray-800">충실도 점수 = 컨텍스트로 뒷받침되는 주장 수 / 전체 주장 수</p>
                  </div>
                  
                  <h5 class="font-semibold text-gray-800 mt-3 mb-1">예시:</h5>
                  <p class="mb-1 text-gray-700"><strong>질문:</strong> 아인슈타인은 언제 어디서 태어났나요?</p>
                  <p class="mb-1 text-gray-700"><strong>컨텍스트:</strong> 알버트 아인슈타인(1879년 3월 14일 출생)은 독일에서 태어난 이론 물리학자로, 역사상 가장 위대하고 영향력 있는 과학자 중 한 명으로 널리 인정받고 있습니다.</p>
                  <p class="mb-1 text-gray-700"><strong>높은 충실도 응답:</strong> 아인슈타인은 1879년 3월 14일 독일에서 태어났습니다.</p>
                  <p class="mb-3 text-gray-700"><strong>낮은 충실도 응답:</strong> 아인슈타인은 1879년 3월 20일 독일에서 태어났습니다.</p>
                  
                  <p class="text-xs text-gray-500 mt-2">* 점수는 0~1 사이이며, 1에 가까울수록 응답이 사실에 더 충실함을 의미합니다.</p>
                </div>
              </li>
            </ul>
          </div>
          
          {#if isRagasLoading}
            <div class="bg-gray-50 p-8 rounded-md flex justify-center items-center">
              <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
              <span class="ml-3 text-gray-600">RAGAS 평가 진행 중...</span>
            </div>
          {:else if ragasError}
            <div class="bg-red-50 p-4 rounded-md border border-red-200">
              <h3 class="font-medium text-red-700 mb-2">평가 오류 발생</h3>
              <p class="text-red-600">{ragasError}</p>
              <button 
                class="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                on:click={runRagasTest}
              >
                다시 시도
              </button>
            </div>
          {:else if hasRagasResults}
            <!-- 이미 RAGAS 결과가 있는 경우 -->
            <div class="bg-white p-4 rounded-md border">
              <h3 class="font-medium mb-4 text-gray-800">RAGAS 평가 결과</h3>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                {#each Object.entries(response.ragas_feedback.scores) as [metric, score]}
                  {@const numScore = Number(score)}
                  {@const scoreClass = numScore >= 0.8 ? 'bg-green-50 border-green-200' : 
                                      numScore >= 0.5 ? 'bg-yellow-50 border-yellow-200' : 
                                      'bg-red-50 border-red-200'}
                  {@const textClass = numScore >= 0.8 ? 'text-green-700' : 
                                     numScore >= 0.5 ? 'text-yellow-700' : 
                                     'text-red-700'}
                  {@const icon = numScore >= 0.8 ? '✓' : 
                               numScore >= 0.5 ? '⚠' : 
                               '✗'}
                  
                  <div class={`p-4 rounded-lg border ${scoreClass}`}>
                    <div class="flex justify-between items-center mb-2">
                      <span class="font-medium">
                        {#if metric === 'answer_relevancy'}
                          답변 관련성
                        {:else if metric === 'faithfulness'}
                          답변 충실도
                        {:else}
                          {metric}
                        {/if}
                      </span>
                      <span class={`text-lg font-bold ${textClass}`}>{icon}</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2.5">
                      <div style="width: {numScore * 100}%" class={`h-2.5 rounded-full ${numScore >= 0.8 ? 'bg-green-600' : numScore >= 0.5 ? 'bg-yellow-500' : 'bg-red-600'}`}></div>
                    </div>
                    <div class="mt-2 text-right font-medium {textClass}">
                      {(numScore * 100).toFixed(1)}%
                    </div>
                    <div class="mt-3 text-xs text-gray-600">
                      {#if metric === 'answer_relevancy'}
                        <p>질문과 응답 간의 관련성을 평가합니다. 높은 점수는 응답이 질문에 직접적으로 관련되어 있음을 의미합니다.</p>
                        <button class="mt-1 text-blue-500 hover:text-blue-700 focus:outline-none flex items-center" 
                                on:click|stopPropagation={() => {
                                  const detailsEl = document.getElementById(`${metric}-details-${response.id}`);
                                  if (detailsEl) detailsEl.classList.toggle('hidden');
                                }}>
                          <span class="mr-1">자세히 보기</span>
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                          </svg>
                        </button>
                        <div id="{metric}-details-{response.id}" class="hidden mt-2 p-2 bg-gray-50 rounded-md border border-gray-200">
                          <p class="mb-2">응답 관련성은 다음 공식으로 계산됩니다:</p>
                          <div class="bg-white p-2 rounded text-center mb-2 border border-gray-200">
                            <p>Answer Relevancy = (1/N) × Σ cosine_similarity(E<sub>qi</sub>, E<sub>o</sub>)</p>
                          </div>
                          <p class="mb-1">여기서:</p>
                          <ul class="list-disc pl-5 mb-2">
                            <li>E<sub>qi</sub>: 생성된 i번째 질문의 임베딩</li>
                            <li>E<sub>o</sub>: 사용자 질문의 임베딩</li>
                            <li>N: 생성된 질문의 수 (기본값 3)</li>
                          </ul>
                          <p>이 메트릭은 응답이 질문의 의도와 내용에 얼마나 부합하는지 평가하며, 불완전하거나 불필요한 정보를 포함한 응답은 낮은 점수를 받습니다.</p>
                        </div>
                      {:else if metric === 'faithfulness'}
                        <p>응답이 사실에 얼마나 충실한지 평가합니다. 높은 점수는 응답이 정확하고 신뢰할 수 있음을 의미합니다.</p>
                        <button class="mt-1 text-blue-500 hover:text-blue-700 focus:outline-none flex items-center" 
                                on:click|stopPropagation={() => {
                                  const detailsEl = document.getElementById(`${metric}-details-${response.id}`);
                                  if (detailsEl) detailsEl.classList.toggle('hidden');
                                }}>
                          <span class="mr-1">자세히 보기</span>
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                          </svg>
                        </button>
                        <div id="{metric}-details-{response.id}" class="hidden mt-2 p-2 bg-gray-50 rounded-md border border-gray-200">
                          <p class="mb-2">충실도는 다음 공식으로 계산됩니다:</p>
                          <div class="bg-white p-2 rounded text-center mb-2 border border-gray-200">
                            <p>Faithfulness Score = 컨텍스트로 뒷받침되는 주장 수 / 전체 주장 수</p>
                          </div>
                          <p class="mb-2">계산 과정:</p>
                          <ol class="list-decimal pl-5 mb-2">
                            <li>응답에서 모든 주장(사실 진술)을 식별합니다.</li>
                            <li>각 주장이 검색된 컨텍스트에서 추론될 수 있는지 확인합니다.</li>
                            <li>위 공식을 사용하여 충실도 점수를 계산합니다.</li>
                          </ol>
                          <p>이 메트릭은 응답이 제공된 컨텍스트에 얼마나 충실한지 평가하며, 사실과 다른 정보를 포함한 응답은 낮은 점수를 받습니다.</p>
                        </div>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
              
              <div class="mt-6 flex justify-end">
                <button 
                  class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 flex items-center"
                  on:click={runRagasTest}
                  disabled={isRagasLoading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
                  </svg>
                  재평가
                </button>
              </div>
            </div>
          {:else}
            <div class="bg-blue-50 p-6 rounded-md border border-blue-200 text-center">
              <p class="text-blue-700 mb-4">아직 RAGAS 평가가 수행되지 않았습니다.</p>
              <button 
                class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                on:click={runRagasTest}
              >
                RAGAS 평가 실행
              </button>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}

  <!-- RAGAS 재평가 확인 모달 -->
  {#if showRagasConfirmation}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 class="text-xl font-semibold mb-4">RAGAS 재평가 확인</h2>
        
        <p class="mb-6 text-gray-700">
          이 항목은 이미 RAGAS 평가가 완료되었습니다. 다시 평가를 진행하시겠습니까?
        </p>
        
        <div class="flex justify-end space-x-3">
          <button 
            class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            on:click={closeRagasConfirmation}
          >
            취소
          </button>
          <button 
            class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            on:click={runRagasTest}
          >
            재평가
          </button>
        </div>
      </div>
    </div>
  {/if}
</div> 