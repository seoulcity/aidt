<!-- src/routes/miraen/middle-math-pro/+page.svelte -->
<script>
  import { onMount } from 'svelte';
  import 'katex/dist/katex.min.css';
  import { mathProSupabase } from '$lib/mathProSupabaseClient';
  import ProblemCard from './components/ProblemCard.svelte';
  import Pagination from './components/Pagination.svelte';

  // 상태 관리
  let problems = [];
  let classOrders = [];
  let selectedClassOrder = null;
  let selectedTopic = null;
  let currentPage = 1;
  const ITEMS_PER_PAGE = 5;
  let loading = true;

  // 데이터 페치
  async function fetchProblems() {
    try {
      const { data, error } = await mathProSupabase
        .from('problems')
        .select('id, problem, correct_answer, explanation, class_order, topic')
        .order('id');

      if (error) throw error;

      problems = data;
      classOrders = [...new Set(data.map(item => item.class_order))];
    } catch (err) {
      console.error('데이터 로딩 에러:', err);
    } finally {
      loading = false;
    }
  }

  // 필터링 및 페이지네이션
  function getPaginatedProblems() {
    const filteredProblems = problems.filter(
      p => p.class_order === selectedClassOrder && p.topic === selectedTopic
    );
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProblems.slice(start, start + ITEMS_PER_PAGE);
  }

  function getTopicsForClass(classOrder) {
    return [...new Set(problems
      .filter(p => p.class_order === classOrder)
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

  // 반응형 상태
  $: filteredTopics = selectedClassOrder ? getTopicsForClass(selectedClassOrder) : [];
  $: totalPages = Math.ceil(
    problems.filter(p => p.class_order === selectedClassOrder && p.topic === selectedTopic).length / ITEMS_PER_PAGE
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
    <!-- 학년 탭 -->
    <div class="flex flex-wrap gap-2 mb-6 border-b">
      {#each classOrders as order}
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
            {#each getPaginatedProblems() as problem (problem.id)}
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
</div> 