<!-- src/routes/miraen/middle-math-pro/components/FormativeQuiz.svelte -->
<script>
  import { parseXML } from '../utils/xmlParser';
  import { renderElement } from '../utils/renderElement';

  export let classOrderTitles = [];
  export let selectedClassOrderTitle = null;
  export let formativeProblems = [];
  export let totalEpisodes = 0;

  // 이벤트 핸들러를 props로 받음
  export let onClassOrderTitleSelect;
  export let onAnswerSelect;

  // input box를 제외한 요소만 렌더링하는 함수
  function renderWithoutInputBox(elements) {
    return elements.filter(element => element.type !== 'input')
      .map(renderElement)
      .join('');
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
  {/if}
</div> 