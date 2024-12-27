<!-- src/routes/miraen/middle-math-pro/components/ProblemCard.svelte -->
<script>
  import { renderElement } from '../utils/renderElement';
  import { parseXML } from '../utils/xmlParser';
  import { slide } from 'svelte/transition';
  export let problem;
  
  let showAnswer = false;
  let showExplanation = false;
</script>

<div class="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
  <!-- 문제 섹션 -->
  <div class="p-4">
    <h3 class="font-medium text-gray-900 mb-3">문제</h3>
    <div class="bg-gray-50 rounded-lg p-4">
      {#each parseXML(problem.problem) as element}
        {@html renderElement(element)}
      {/each}
    </div>
  </div>

  <!-- 정답 섹션 -->
  <div class="border-t border-gray-100">
    <button
      class="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
      on:click={() => showAnswer = !showAnswer}
      aria-expanded={showAnswer}
    >
      <span class="font-medium text-gray-900">정답</span>
      <svg
        class="w-5 h-5 text-gray-500 transform transition-transform {showAnswer ? 'rotate-180' : ''}"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    {#if showAnswer}
      <div class="px-4 pb-4" transition:slide>
        <div class="bg-gray-50 rounded-lg p-4">
          {#each parseXML(problem.correct_answer) as element}
            {@html renderElement(element)}
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <!-- 해설 섹션 -->
  <div class="border-t border-gray-100">
    <button
      class="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
      on:click={() => showExplanation = !showExplanation}
      aria-expanded={showExplanation}
    >
      <span class="font-medium text-gray-900">해설</span>
      <svg
        class="w-5 h-5 text-gray-500 transform transition-transform {showExplanation ? 'rotate-180' : ''}"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    {#if showExplanation}
      <div class="px-4 pb-4" transition:slide>
        <div class="bg-gray-50 rounded-lg p-4">
          {#each parseXML(problem.explanation) as element}
            {@html renderElement(element)}
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  :global(.bbox-highlight) {
    @apply border-2 border-black p-0.5 rounded;
  }
</style> 