<!-- src/routes/miraen/middle-math-pro/components/ProblemCard.svelte -->
<script>
  export let problem;
  
  function formatXML(xmlString) {
    if (!xmlString) return '';
    return xmlString
      .replace(/></g, '>\n<')
      .replace(/\n/g, '\n  ');
  }
</script>

<div class="mb-8 p-6 bg-white rounded-lg shadow-md">
  <div class="space-y-4">
    {#each [
      { title: '문제', content: problem.problem },
      { title: '정답', content: problem.correct_answer },
      { title: '해설', content: problem.explanation }
    ] as { title, content }}
      <div>
        <h3 class="font-semibold text-lg mb-2">{title}</h3>
        <pre class="p-4 bg-gray-50 rounded min-h-[100px] overflow-x-auto font-mono text-sm">
          {formatXML(content)}
        </pre>
      </div>
    {/each}
  </div>
</div> 