<!-- src/lib/components/math-chat/ProblemDetail.svelte -->
<script lang="ts">
  import { slide } from 'svelte/transition';
  import { parseXML } from '../../../routes/miraen/middle-math-pro/utils/xmlParser';
  import { renderElement } from '../../../routes/miraen/middle-math-pro/utils/renderElement';

  export let problem: any;
  export let showAnswer: boolean = false;
  export let showExplanation: boolean = false;
</script>

<div class="flex-none mb-4 grid grid-cols-2 gap-4 max-h-[40vh] overflow-y-auto">
  <!-- 문제 영역 -->
  <div>
    <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
      <h3 class="font-medium text-gray-900 mb-3">문제</h3>
      <div class="bg-gray-50 rounded-lg p-4">
        {#each parseXML(problem.problem) as element}
          {@html renderElement(element)}
        {/each}
      </div>
    </div>
  </div>
  
  <!-- 정답/해설 영역 -->
  <div class="space-y-4">
    <!-- 정답 섹션 -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
      <button
        class="w-full flex items-center justify-between text-left mb-3"
        on:click={() => showAnswer = !showAnswer}
        aria-expanded={showAnswer}
      >
        <h3 class="font-medium text-gray-900">정답</h3>
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
        <div class="bg-gray-50 rounded-lg p-4" transition:slide>
          {#each parseXML(problem.correct_answer) as element}
            {@html renderElement(element)}
          {/each}
        </div>
      {/if}
    </div>

    <!-- 해설 섹션 -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
      <button
        class="w-full flex items-center justify-between text-left mb-3"
        on:click={() => showExplanation = !showExplanation}
        aria-expanded={showExplanation}
      >
        <h3 class="font-medium text-gray-900">해설</h3>
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
        <div class="bg-gray-50 rounded-lg p-4" transition:slide>
          {#each parseXML(problem.explanation) as element}
            {@html renderElement(element)}
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div> 