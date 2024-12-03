<script>
  import { onMount } from 'svelte';
  import { tick } from 'svelte';
  import 'katex/dist/katex.min.css';
  import { mathProblems } from '$lib/data/mathProblems.js';

  let activeTab = 0;
  let katexLoaded = false;
  let hints = mathProblems.map(() => ({
    currentHint: 0,
    hintTexts: [],
    loading: false
  }));

  const buttonTexts = ['힌트 보기', '힌트 더 보기', '마지막 힌트 보기'];

  function getButtonText(problemIndex) {
    const hintCount = hints[problemIndex].hintTexts.length;
    if (hintCount >= 3) return null;
    return buttonTexts[hintCount];
  }

  async function loadKaTeX() {
    if (katexLoaded) return;
    
    try {
      console.log('Loading KaTeX...');
      const katex = await import('katex');
      window.katex = katex.default;
      katexLoaded = true;
      console.log('KaTeX loaded successfully');
      return true;
    } catch (error) {
      console.error('Failed to load KaTeX:', error);
      return false;
    }
  }

  function splitTextAndLatex(text) {
    const parts = [];
    let lastIndex = 0;
    const regex = /\\[\(\[](.+?)\\[\)\]]/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Add text before formula if exists
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.slice(lastIndex, match.index)
        });
      }

      // Add formula
      parts.push({
        type: 'latex',
        content: match[1],
        displayMode: match[0].startsWith('\\[')
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text if exists
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex)
      });
    }

    return parts;
  }

  async function renderMath() {
    if (!katexLoaded) {
      const loaded = await loadKaTeX();
      if (!loaded) return;
    }

    await tick();
    
    document.querySelectorAll('.math-container').forEach(container => {
      try {
        const parts = splitTextAndLatex(container.getAttribute('data-content'));
        container.innerHTML = parts.map(part => {
          if (part.type === 'text') {
            return `<span class="text">${part.content}</span>`;
          } else {
            try {
              return window.katex.renderToString(part.content, {
                displayMode: part.displayMode,
                throwOnError: false
              });
            } catch (err) {
              console.error('LaTeX rendering error:', err);
              return `<span class="text-red-500">[LaTeX Error]</span>`;
            }
          }
        }).join('');
      } catch (error) {
        console.error('Content processing error:', error);
      }
    });
  }

  async function requestHint(problemIndex) {
    if (hints[problemIndex].loading) return;
    if (hints[problemIndex].hintTexts.length >= 3) return;

    hints[problemIndex].loading = true;
    hints = [...hints];

    try {
      const response = await fetch('/api/math-hint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          problem: mathProblems[problemIndex],
          hintLevel: hints[problemIndex].hintTexts.length
        })
      });

      if (!response.ok) throw new Error('Hint request failed');
      const data = await response.json();
      hints[problemIndex].hintTexts = [...hints[problemIndex].hintTexts, data.hint];
      
      await tick();
      await renderMath();
    } catch (error) {
      console.error('Error fetching hint:', error);
    } finally {
      hints[problemIndex].loading = false;
      hints = [...hints];
    }
  }

  $: {
    if (activeTab !== undefined) {
      Promise.resolve().then(async () => {
        await renderMath();
      });
    }
  }

  onMount(async () => {
    await loadKaTeX();
    await renderMath();
  });
</script>

<div class="container mx-auto px-4 py-8 max-w-4xl">
  <h1 class="text-3xl font-bold mb-8 text-center">중등수학 맞춤추천</h1>

  <div class="mb-6 flex space-x-2">
    {#each mathProblems as _, i}
      <button
        class="px-4 py-2 rounded-lg {activeTab === i ? 'bg-blue-500 text-white' : 'bg-gray-200'}"
        on:click={() => activeTab = i}
      >
        문제 {i + 1}
      </button>
    {/each}
  </div>

  {#each mathProblems as problem, i}
    {#if activeTab === i}
      <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div class="mb-4">
          <div class="math-container" data-content={problem.question.text}></div>
        </div>

        <div class="mt-6">
          {#if getButtonText(i)}
            <button
              class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg mb-4 {hints[i].loading ? 'opacity-50 cursor-not-allowed' : ''}"
              on:click={() => requestHint(i)}
              disabled={hints[i].loading}
            >
              {hints[i].loading ? '힌트 불러오는 중...' : getButtonText(i)}
            </button>
          {/if}

          {#if hints[i].hintTexts.length > 0}
            <div class="space-y-4">
              {#each hints[i].hintTexts as hint, hintIndex}
                <div class="bg-gray-50 p-4 rounded-lg">
                  <h3 class="font-semibold mb-2">힌트 {hintIndex + 1}</h3>
                  <div class="math-container" data-content={hint}></div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    {/if}
  {/each}
</div>

<style>
  :global(.katex) {
    font-size: 1.2em;
  }
  
  :global(.katex-display) {
    overflow-x: auto;
    overflow-y: hidden;
  }

  :global(.math-container) {
    line-height: 1.5;
  }

  :global(.math-container .text) {
    margin: 0 0.2em;
  }
</style> 