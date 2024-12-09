<!-- src/routes/miraen/middle-math-pro/components/ProblemCard.svelte -->
<script>
  import { renderElement } from '../utils/renderElement';
  import { parseXML } from '../utils/xmlParser';
  export let problem;
</script>

<style>
  :global(.bbox-highlight) {
    border: 2px solid #000;
    padding: 2px;
    border-radius: 2px;
  }
</style>

<div class="mb-8 p-6 bg-white rounded-lg shadow-md">
  <div class="space-y-4">
    {#each [
      { title: '문제', content: problem.problem },
      { title: '정답', content: problem.correct_answer },
      { title: '해설', content: problem.explanation }
    ] as { title, content }}
      <div>
        <h3 class="font-semibold text-lg mb-2">{title}</h3>
        <div class="p-4 bg-gray-50 rounded min-h-[100px]">
          {#each parseXML(content) as element}
            {@html renderElement(element)}
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div> 