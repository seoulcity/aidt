<!-- src/routes/miraen/middle-math/+page.svelte -->
<script>
  import { onMount } from 'svelte';
  import { tick } from 'svelte';
  import 'katex/dist/katex.min.css';
  import { mathProblems } from '$lib/data/mathProblems.js';

  let activeTab = 0;
  let katexLoaded = false;
  let hints = mathProblems.map(() => ({
    currentStep: 0,
    allHints: null,
    loading: false,
    error: null
  }));

  const buttonTexts = ['힌트 보기', '힌트 더 보기', '마지막 힌트 보기'];

  function getButtonText(problemIndex) {
    const currentStep = hints[problemIndex].currentStep;
    console.log('버튼 텍스트 결정:', {
        problemIndex,
        currentStep,
        hasAllHints: hints[problemIndex].allHints !== null,
        totalHints: hints[problemIndex].allHints?.length
    });
    
    if (currentStep >= 2) {
        return {
            text: '힌트 모두 제공됨',
            disabled: true
        };
    }
    return {
        text: buttonTexts[currentStep],
        disabled: false
    };
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
    if (hints[problemIndex].currentStep >= 3) return;

    // 이미 힌트를 받아온 경우 다음 단계만 보여줌
    if (hints[problemIndex].allHints) {
        console.log('기존 힌트 데이터:', {
            currentStep: hints[problemIndex].currentStep,
            allHints: hints[problemIndex].allHints,
            nextStep: hints[problemIndex].currentStep + 1
        });
        
        hints[problemIndex].currentStep += 1;
        hints = [...hints];
        
        console.log('힌트 단계 증가 후:', {
            currentStep: hints[problemIndex].currentStep,
            visibleHints: hints[problemIndex].allHints.slice(0, hints[problemIndex].currentStep + 1)
        });

        await tick();
        await renderMath();
        return;
    }

    hints[problemIndex].loading = true;
    hints = [...hints];

    try {
        const response = await fetch('/api/math-hint', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                problem: mathProblems[problemIndex]
            })
        });

        if (!response.ok) throw new Error('Hint request failed');
        const data = await response.json();
        
        console.log('API 응답 데이터:', data);
        console.log('받아온 힌트 개수:', data.hints?.length);
        
        hints[problemIndex].allHints = data.hints;
        hints[problemIndex].currentStep = 0;
        
        console.log('초기 힌트 설정:', {
            currentStep: hints[problemIndex].currentStep,
            visibleHints: hints[problemIndex].allHints.slice(0, hints[problemIndex].currentStep + 1)
        });
        
        await tick();
        await renderMath();
    } catch (error) {
        console.error('Error fetching hint:', error);
        hints[problemIndex].error = error.message;
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
          <button
            class="px-4 py-2 rounded-lg mb-4 {hints[i].loading ? 'opacity-50 cursor-not-allowed' : ''} 
                {getButtonText(i).disabled 
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : 'bg-green-500 hover:bg-green-600 text-white'}"
            on:click={() => requestHint(i)}
            disabled={hints[i].loading || getButtonText(i).disabled}
          >
            {hints[i].loading ? '힌트 불러오는 중...' : getButtonText(i).text}
          </button>

          {#if hints[i].allHints}
            <div class="space-y-4">
                {#each hints[i].allHints.slice(0, hints[i].currentStep + 1) as hint, index}
                    <div class="bg-gray-50 p-4 rounded-lg" 
                         class:animate-fade-in={index === hints[i].currentStep}>
                        <h3 class="font-semibold mb-2">힌트 {hint.step}</h3>
                        <div class="math-container" data-content={hint.content}></div>
                    </div>
                {/each}
            </div>
          {/if}

          {#if hints[i].error}
            <div class="text-red-500 mt-2">
              {hints[i].error}
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

  .animate-fade-in {
    animation: fadeIn 0.5s ease-in;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
</style> 