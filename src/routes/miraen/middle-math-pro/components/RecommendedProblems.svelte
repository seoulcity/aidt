<!-- src/routes/miraen/middle-math-pro/components/RecommendedProblems.svelte -->
<script>
  import { parseXML } from '../utils/xmlParser';
  import { renderElement } from '../utils/renderElement';
  import { fetchRecommendedProblems } from '../utils/recommendationService';

  export let wrongEpisodes = [];
  export let score = 0;

  let loading = false;
  let showRecommendations = false;
  let recommendedProblems = [];

  // 점수대별 추천 로직 설명
  const getRecommendationStrategy = (score) => {
    if (score <= 40) {
      return {
        level: '하: 기초',
        description: '틀린 에피소드별로 기초 다지기를 위해 "이해" 문제와 "계산" 문제를 최대 각 1개씩 추천합니다.'
      };
    } else if (score <= 70) {
      return {
        level: '중: 심화',
        description: '틀린 에피소드별로 개념 이해 강화를 위해 "이해" 유형 문제를 최대 2개씩 추천합니다.'
      };
    } else {
      return {
        level: '상: 발전',
        description: '틀린 에피소드의 "이해" 문제 1개와 함께, 더 높은 수준의 "추론"이나 "문��� 해결" 유형 문제를 최대 5개 추천합니다.'
      };
    }
  };

  async function loadRecommendations() {
    loading = true;
    showRecommendations = true;
    try {
      const { problems, error } = await fetchRecommendedProblems(wrongEpisodes, score);
      if (!error) {
        recommendedProblems = problems;
      }
    } finally {
      loading = false;
    }
  }

  function renderWithoutInputBox(elements) {
    return elements.filter(element => element.type !== 'input')
      .map(renderElement)
      .join('');
  }

  $: strategy = getRecommendationStrategy(score);
</script>

<div class="mt-6">
  <!-- IRT 차시별 분석 이미지 -->
  <div class="mb-4 p-4 bg-white rounded-lg shadow">
    <h3 class="font-bold text-lg mb-3">차시별 문항반응이론(IRT) 기반 맞춤추천 모형</h3>
    <div class="relative w-full" style="padding-top: 56.25%"> <!-- 16:9 비율 유지 -->
      <img
        src="/static/irt-class-episodic.svg"
        alt="차시별 IRT 분석 그래프"
        class="absolute inset-0 w-full h-full object-contain"
      />
    </div>
  </div>

  <button
    class="w-full px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
    on:click={loadRecommendations}
  >
    맞춤문항 추천
  </button>

  {#if showRecommendations}
    <div class="mt-4">
      {#if loading}
        <div class="flex justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      {:else if recommendedProblems.length > 0}
        <!-- 추천 전략 설명 -->
        <div class="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 class="font-bold text-lg text-blue-800 mb-2">
            {strategy.level} 수준 맞춤 추천
          </h3>
          <p class="text-blue-700">{strategy.description}</p>
        </div>

        <!-- 틀린 에피소드 목록 -->
        <div class="mb-4 p-4 bg-yellow-50 rounded-lg">
          <h4 class="font-bold text-yellow-800 mb-2">틀린 에피소드</h4>
          <div class="flex flex-wrap gap-2">
            {#each wrongEpisodes as episode}
              <span class="px-3 py-1 bg-yellow-100 text-yellow-800 rounded">
                {episode}
              </span>
            {/each}
          </div>
        </div>

        <h3 class="font-bold text-lg mb-4">맞춤 추천 문항</h3>
        <div class="grid grid-cols-1 gap-4">
          {#each recommendedProblems as problem}
            <div class="p-4 bg-white rounded-lg shadow">
              <div class="flex flex-col gap-2 mb-4">
                <div class="flex justify-between items-start">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-gray-600">
                      에피소드: {problem.episode}
                    </span>
                    {#if score > 70 && (problem.activity_category === '추론' || problem.activity_category === '문제 해결')}
                      <span class="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                        상위 수준 문항
                      </span>
                    {/if}
                  </div>
                  <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                    종류: {problem.activity_category}
                  </span>
                </div>
                {#if score <= 70}
                  <div class="text-xs text-gray-500">
                    ※ 이 문항은 "{problem.episode}" 에피소드 오답 보완을 위해 추천되었습니다.
                  </div>
                {/if}
              </div>
              <div class="p-4 bg-gray-50 rounded">
                {@html renderWithoutInputBox(parseXML(problem.problem))}
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-center text-gray-600">추천할 문항이 없습니다.</p>
      {/if}
    </div>
  {/if}
</div> 