<!-- src/routes/miraen/middle-math-pro/+page.svelte -->
<script>
  import { onMount } from 'svelte';
  import 'katex/dist/katex.min.css';
  import { mathProSupabase } from '$lib/mathProSupabaseClient';
  import ProblemCard from './components/ProblemCard.svelte';
  import Pagination from './components/Pagination.svelte';
  import { parseXML } from './utils/xmlParser';
  import { renderElement } from './utils/renderElement';

  // 상태 관리
  let problems = [];
  let selectedClassOrder = null;
  let selectedTopic = null;
  let currentPage = 1;
  const ITEMS_PER_PAGE = 5;
  let loading = true;
  
  // 형성평가 관련 상태
  let showFormativeAssessment = false;
  let classOrderTitles = [];
  let selectedClassOrderTitle = null;
  let formativeProblems = [];

  // 형성평가 상태
  let totalEpisodes = 0;

  // 데이터 페치
  async function fetchProblems() {
    try {
      const { data, error } = await mathProSupabase
        .from('problems')
        .select('id, problem, correct_answer, explanation, class_order_title, topic, activity_category')
        .order('id');

      if (error) throw error;

      problems = data;
      classOrderTitles = [...new Set(data.map(item => item.class_order_title))];
    } catch (err) {
      console.error('데이터 로딩 에러:', err);
    } finally {
      loading = false;
    }
  }

  // 형성평가 문제 가져오기
  async function fetchFormativeProblems(classOrderTitle) {
    try {
      const { data, error } = await mathProSupabase
        .from('problems')
        .select('id, problem, correct_answer, explanation, class_order_title, topic, activity_category, episode')
        .eq('class_order_title', classOrderTitle)
        .eq('activity_category', '이해');

      if (error) throw error;

      // episode별로 문제 그룹화
      const episodeGroups = {};
      data.forEach(problem => {
        if (!episodeGroups[problem.episode]) {
          episodeGroups[problem.episode] = [];
        }
        episodeGroups[problem.episode].push(problem);
      });
      
      // 각 episode에서 2문제씩 선택
      const selectedProblems = [];
      Object.entries(episodeGroups).forEach(([episode, problems]) => {
        const shuffled = problems.sort(() => Math.random() - 0.5);
        selectedProblems.push(...shuffled.slice(0, 2));
      });
      
      // episode 순서대로 정렬
      formativeProblems = selectedProblems.sort((a, b) => {
        return a.episode.localeCompare(b.episode, undefined, { numeric: true });
      });

      // 각 문제에 대한 사용자 응답 초기화
      formativeProblems = formativeProblems.map(p => ({
        ...p,
        userAnswer: null // true = 정답, false = 오답, null = 미선택
      }));
      
      // episode 개수 저장
      totalEpisodes = Object.keys(episodeGroups).length;
      
    } catch (err) {
      console.error('형성평가 문제 로딩 에러:', err);
    }
  }

  // 정/오답 선택 핸들러
  function handleAnswerSelect(problemIndex, answer) {
    formativeProblems[problemIndex].userAnswer = answer;
    formativeProblems = [...formativeProblems]; // Svelte 반응성 트리거
  }

  // input box를 제외한 요소만 렌더링하는 함수
  function renderWithoutInputBox(elements) {
    return elements.filter(element => element.type !== 'input')
      .map(renderElement)
      .join('');
  }

  // 필터링 및 페이지네이션
  function getPaginatedProblems() {
    const filteredProblems = problems.filter(
      p => p.class_order_title === selectedClassOrder && p.topic === selectedTopic
    );
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProblems.slice(start, start + ITEMS_PER_PAGE);
  }

  function getTopicsForClass(classOrder) {
    return [...new Set(problems
      .filter(p => p.class_order_title === classOrder)
      .map(p => p.topic))];
  }

  // 이벤트 핸들러
  function handleClassOrderSelect(order) {
    selectedClassOrder = order;
    selectedTopic = null;
    currentPage = 1;
  }

  function handleTopicSelect(topic) {
    selectedTopic = topic;
    currentPage = 1;
  }

  function handlePageChange(newPage) {
    currentPage = newPage;
  }

  // 형성평가 탭 선택 핸들러
  function handleFormativeAssessmentSelect() {
    showFormativeAssessment = true;
    selectedClassOrder = null;
    selectedTopic = null;
  }

  // 일반 문제 탭 선택 핸들러
  function handleRegularProblemSelect() {
    showFormativeAssessment = false;
    formativeProblems = [];
    selectedClassOrderTitle = null;
  }

  // 차시 선택 핸들러
  function handleClassOrderTitleSelect(event) {
    selectedClassOrderTitle = event.target.value;
    if (selectedClassOrderTitle) {
      fetchFormativeProblems(selectedClassOrderTitle);
    }
  }

  // 반응형 상태
  $: filteredTopics = selectedClassOrder ? getTopicsForClass(selectedClassOrder) : [];
  $: totalPages = Math.ceil(
    problems.filter(p => 
      p.class_order_title === selectedClassOrder && 
      p.topic === selectedTopic
    ).length / ITEMS_PER_PAGE
  );

  onMount(fetchProblems);
</script>

<div class="container mx-auto px-4 py-8 max-w-6xl">
  <h1 class="text-3xl font-bold mb-8 text-center">중등수학 맞춤추천(PRO)</h1>

  {#if loading}
    <div class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    </div>
  {:else}
    <!-- ��인 탭 -->
    <div class="flex flex-wrap gap-2 mb-6 border-b">
      <button
        class="px-4 py-2 rounded-t-lg transition-colors duration-200 {!showFormativeAssessment ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}"
        on:click={handleRegularProblemSelect}
      >
        전체 문제 목록(중등 수학2 / I. 수와 식 / 1. 유리수와 순환소수 / 1-2차시)
      </button>
      <button
        class="px-4 py-2 rounded-t-lg transition-colors duration-200 {showFormativeAssessment ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}"
        on:click={handleFormativeAssessmentSelect}
      >
        1차시 형성평가 및 맞춤문항 추천
      </button>
    </div>

    {#if showFormativeAssessment}
      <!-- 형성평가 섹션 -->
      <div class="mb-6">
        <select
          class="w-full p-2 border rounded"
          on:change={handleClassOrderTitleSelect}
          value={selectedClassOrderTitle}
        >
          <option value="">차시를 선택하세요</option>
          {#each classOrderTitles as title}
            <option value={title}>{title}</option>
          {/each}
        </select>

        {#if selectedClassOrderTitle && formativeProblems.length > 0}
          <div class="mt-4 p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
            <p>선택된 차시({selectedClassOrderTitle})에는 총 {totalEpisodes}개의 에피소드(소주제)가 있습니다.</p>
            <p>각 에피소드당 최대 2문제씩, 그리고 형성평가의 성격에 맞게 행동영역 '이해'에서 총 {formativeProblems.length}개의 문제가 선택되었습니다.</p>
          </div>
        {/if}

        {#if formativeProblems.length > 0}
          <div class="mt-6 space-y-4">
            {#each formativeProblems as problem, index}
              <div class="p-4 bg-white rounded-lg shadow">
                <div class="flex justify-between items-start mb-2">
                  <div class="flex items-center gap-2">
                    <span class="font-bold">문제 {index + 1}</span>
                    <span class="text-sm text-gray-600">({problem.episode})</span>
                  </div>
                  <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                    종류: {problem.activity_category}
                  </span>
                </div>
                <div class="p-4 bg-gray-50 rounded min-h-[100px]">
                  {@html renderWithoutInputBox(parseXML(problem.problem))}
                </div>
                <div class="mt-4 flex gap-4">
                  <label class="flex items-center gap-2">
                    <input
                      type="radio"
                      name="answer-{problem.id}"
                      value="true"
                      checked={problem.userAnswer === true}
                      on:change={() => handleAnswerSelect(index, true)}
                    />
                    <span>정답</span>
                  </label>
                  <label class="flex items-center gap-2">
                    <input
                      type="radio"
                      name="answer-{problem.id}"
                      value="false"
                      checked={problem.userAnswer === false}
                      on:change={() => handleAnswerSelect(index, false)}
                    />
                    <span>오답</span>
                  </label>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {:else}
      <!-- 기존 문제 표시 섹션 -->
      <div class="flex flex-wrap gap-2 mb-6 border-b">
        {#each classOrderTitles as order}
          <button
            class="px-4 py-2 rounded-t-lg transition-colors duration-200 {selectedClassOrder === order ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}"
            on:click={() => handleClassOrderSelect(order)}
          >
            {order}
          </button>
        {/each}
      </div>

      <div class="grid grid-cols-12 gap-6">
        {#if selectedClassOrder}
          <!-- 토픽 네비게이션 -->
          <div class="col-span-3">
            <div class="flex flex-col gap-2">
              {#each filteredTopics as topic}
                <button
                  class="px-4 py-2 text-left rounded transition-colors duration-200 {selectedTopic === topic ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}"
                  on:click={() => handleTopicSelect(topic)}
                >
                  {topic}
                </button>
              {/each}
            </div>
          </div>

          <!-- 문제 표시 영역 -->
          <div class="col-span-9">
            {#if selectedTopic}
              {#each getPaginatedProblems() as problem (problem.id + '-' + currentPage + '-' + selectedTopic)}
                <ProblemCard {problem} />
              {/each}

              <Pagination
                {currentPage}
                {totalPages}
                onPageChange={handlePageChange}
              />
            {/if}
          </div>
        {/if}
      </div>
    {/if}
  {/if}
</div> 