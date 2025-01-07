<!-- src/routes/miraen/middle-math-pro/components/ResultPopup.svelte -->
<script lang="ts">
  import RecommendedProblems from './RecommendedProblems.svelte';

  interface FormativeProblem {
    userAnswer: boolean | null;
  }

  interface EpisodeResult {
    episode: string;
    correct: number;
    total: number;
  }

  export let show = false;
  export let onClose: () => void;
  export let score = 0;
  export let formativeProblems: FormativeProblem[] = [];
  export let episodeResults: EpisodeResult[] = [];

  $: wrongEpisodes = episodeResults
    .filter(result => result.correct < result.total)
    .map(result => result.episode);
</script>

{#if show}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold">평가 결과</h2>
        <button
          class="text-gray-500 hover:text-gray-700"
          on:click={onClose}
        >
          ✕
        </button>
      </div>

      <div class="mb-6">
        <div class="text-lg font-bold text-indigo-600 mb-2">
          최종 점수: {score}점 
          <span class="text-gray-600">
            ({formativeProblems.filter(p => p.userAnswer === true).length}/{formativeProblems.length}, 
            오답 {formativeProblems.filter(p => p.userAnswer === false).length}문항)
          </span>
        </div>

        <div class="mt-4 bg-gray-50 p-4 rounded-lg">
          <h3 class="font-bold mb-3">문항별 정오표</h3>
          <div class="grid grid-cols-10 gap-2">
            {#each formativeProblems as problem, index}
              <div class="flex flex-col items-center border rounded p-2 bg-white">
                <span class="text-sm font-medium">{index + 1}</span>
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

        <div class="mt-6 grid grid-cols-2 gap-4">
          {#each episodeResults as result}
            <div class="border rounded p-4 bg-white">
              <h3 class="font-bold mb-2">{result.episode}</h3>
              <div class="flex gap-4">
                <div class="text-green-600">
                  정답: {result.correct}문제
                </div>
                <div class="text-red-600">
                  오답: {result.total - result.correct}문제
                </div>
              </div>
            </div>
          {/each}
        </div>

        <RecommendedProblems {wrongEpisodes} {score} />
      </div>
    </div>
  </div>
{/if} 