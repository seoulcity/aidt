<!-- src/routes/miraen/middle-math-pro/components/FormativeQuiz.svelte -->
<script>
  import { parseXML } from '../utils/xmlParser';
  import { renderElement } from '../utils/renderElement';
  import ResultPopup from './ResultPopup.svelte';

  export let classOrderTitles = [];
  export let selectedClassOrderTitle = null;
  export let formativeProblems = [];
  export let totalEpisodes = 0;

  export let onClassOrderTitleSelect;
  export let onAnswerSelect;

  let totalScore = 0;
  let showResultPopup = false;
  let episodeResults = [];

  function renderWithoutInputBox(elements) {
    return elements.filter(element => element.type !== 'input')
      .map(renderElement)
      .join('');
  }

  // 자동 답안 선택 함수
  function autoSelectAnswers(correctPercentage) {
    const totalProblems = formativeProblems.length;
    const correctCount = Math.round(totalProblems * (correctPercentage / 100));
    
    // 문제 인덱스 배열 생성 및 섞기
    const indices = [...Array(totalProblems).keys()];
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    
    // 정답/오답 설정
    indices.forEach((index, i) => {
      const isCorrect = i < correctCount;
      onAnswerSelect(index, isCorrect);
    });

    // 총점 계산
    calculateTotalScore();
  }

  // 총점 계산 함수
  function calculateTotalScore() {
    const answeredProblems = formativeProblems.filter(p => p.userAnswer !== null);
    if (answeredProblems.length === 0) {
      totalScore = 0;
      return;
    }
    
    const correctAnswers = answeredProblems.filter(p => p.userAnswer === true).length;
    totalScore = Math.round((correctAnswers / formativeProblems.length) * 1000) / 10;
  }

  // 답안 선택 시 총점 업데이트
  $: {
    if (formativeProblems.length > 0) {
      calculateTotalScore();
    }
  }

  function calculateEpisodeResults() {
    const episodeMap = new Map();
    
    formativeProblems.forEach(problem => {
      if (!episodeMap.has(problem.episode)) {
        episodeMap.set(problem.episode, {
          episode: problem.episode,
          problems: [],
          correct: 0,
          total: 0
        });
      }
      
      const episodeData = episodeMap.get(problem.episode);
      episodeData.problems.push({
        isCorrect: problem.userAnswer,
        answered: problem.userAnswer !== null
      });
      if (problem.userAnswer === true) {
        episodeData.correct++;
      }
      episodeData.total++;
    });

    return Array.from(episodeMap.values())
      .sort((a, b) => a.episode.localeCompare(b.episode, undefined, { numeric: true }));
  }

  function handleSubmit() {
    episodeResults = calculateEpisodeResults();
    showResultPopup = true;
  }

  function closePopup() {
    showResultPopup = false;
  }
</script>

<div class="mb-6">
  <select
    class="w-full p-2 border rounded"
    on:change={onClassOrderTitleSelect}
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
      
      <!-- 자동 답안 선택 버튼들 -->
      <div class="mt-4 flex gap-2">
        <button
          class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          on:click={() => autoSelectAnswers(40)}
        >
          하 (40% 정답)
        </button>
        <button
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          on:click={() => autoSelectAnswers(70)}
        >
          중 (70% 정답)
        </button>
        <button
          class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          on:click={() => autoSelectAnswers(90)}
        >
          상 (90% 정답)
        </button>
      </div>

      <!-- 총점 표시 -->
      <div class="mt-4 text-lg font-bold">
        총점: {totalScore}점
      </div>

      <div class="mt-4">
        <button
          class="px-6 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
          on:click={handleSubmit}
        >
          제출
        </button>
      </div>
    </div>
  {/if}

  {#if formativeProblems.length > 0}
    <div class="flex gap-6">
      <div class="flex-1 mt-6 grid grid-cols-2 gap-4">
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
                  on:change={() => onAnswerSelect(index, true)}
                />
                <span>정답</span>
              </label>
              <label class="flex items-center gap-2">
                <input
                  type="radio"
                  name="answer-{problem.id}"
                  value="false"
                  checked={problem.userAnswer === false}
                  on:change={() => onAnswerSelect(index, false)}
                />
                <span>오답</span>
              </label>
            </div>
          </div>
        {/each}
      </div>

      <div class="mt-6 w-32 bg-white rounded-lg shadow p-4">
        <h3 class="font-bold mb-3 text-center border-b pb-2">답안 현황</h3>
        <div class="space-y-2">
          {#each formativeProblems as problem, index}
            <div class="flex items-center justify-between">
              <span class="font-medium">{index + 1}.</span>
              {#if problem.userAnswer === true}
                <span class="text-green-600 font-bold">O</span>
              {:else if problem.userAnswer === false}
                <span class="text-red-600 font-bold">X</span>
              {:else}
                <span class="text-gray-300">-</span>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}

  <ResultPopup
    show={showResultPopup}
    onClose={closePopup}
    score={totalScore}
    {formativeProblems}
    {episodeResults}
  />
</div> 