<!-- src/routes/miraen/middle-math/+page.svelte -->
<script>
  import { onMount } from 'svelte';
  import { tick } from 'svelte';
  import 'katex/dist/katex.min.css';
  import { mathProblems } from '$lib/data/mathProblems.js';
  import { slide } from 'svelte/transition';

  let katexLoaded = false;
  let episodeGroups = groupProblemsByEpisode(mathProblems);
  let activeEpisode = episodeGroups[0]?.episode || '';
  let activeProblemId = episodeGroups[0]?.problems[0]?.id || null;

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
      if (typeof window !== 'undefined') {
        window.katex = katex.default;
      }
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
    const regex = /\\[\(\[]((?:[^\\]|\\(?!\)|])|\\[^\)\]])*?)\\[\)\]]/g;
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
    
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
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
  }

  async function requestHint(problemIndex) {
    console.log('힌트 요청 시작:', {
        problemIndex,
        problem: mathProblems[problemIndex],
        currentState: hints[problemIndex]
    });

    if (hints[problemIndex].loading) {
        console.log('이미 로딩 중');
        return;
    }
    if (hints[problemIndex].currentStep >= 3) {
        console.log('모든 힌트가 미 표시됨');
        return;
    }

    // 이미 힌트를 받아온 경우 다음 단계만 보여줌
    if (hints[problemIndex].allHints) {
        console.log('기존 힌트 데이터 사용:', {
            currentStep: hints[problemIndex].currentStep,
            allHints: hints[problemIndex].allHints,
            nextStep: hints[problemIndex].currentStep + 1
        });
        
        hints[problemIndex].currentStep += 1;
        hints = [...hints];
        
        console.log('힌트 단계 증가 후 상태:', {
            currentStep: hints[problemIndex].currentStep,
            visibleHints: hints[problemIndex].allHints.slice(0, hints[problemIndex].currentStep + 1)
        });

        await tick();
        await renderMath();
        return;
    }

    try {
        hints[problemIndex].loading = true;
        hints = [...hints];

        console.log('API 요청 준비:', {
            problem: mathProblems[problemIndex]
        });

        const response = await fetch('/api/math-hint', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                problem: mathProblems[problemIndex]
            })
        });

        console.log('API 응답 상태:', {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API 오류 응답:', errorText);
            throw new Error('힌트 요청 실패: ' + errorText);
        }

        const data = await response.json();
        console.log('API 응답 데이터:', data);
        
        if (!data.hints || !Array.isArray(data.hints)) {
            console.error('잘못된 힌트 데이터:', data);
            throw new Error('서버에서 올바른 힌트 데이터를 받지 못했습니다.');
        }

        hints[problemIndex].allHints = data.hints;
        hints[problemIndex].currentStep = 0;
        
        console.log('힌트 상태 업데이트 완료:', {
            currentStep: hints[problemIndex].currentStep,
            allHints: hints[problemIndex].allHints
        });
        
        await tick();
        await renderMath();
    } catch (error) {
        console.error('힌트 요청 오류:', {
            message: error.message,
            stack: error.stack
        });
        hints[problemIndex].error = error.message;
    } finally {
        hints[problemIndex].loading = false;
        hints = [...hints];
    }
  }

  $: {
    if (activeEpisode !== undefined || activeProblemId !== null) {
      Promise.resolve().then(async () => {
        await tick();
        await renderMath();
      });
    }
  }

  onMount(async () => {
    showExplanations = mathProblems.map(() => false);
    await loadKaTeX();
    await renderMath();
  });

  function groupProblemsByEpisode(problems) {
    const episodeMap = new Map();
    
    problems.forEach(problem => {
      if (!episodeMap.has(problem.episode)) {
        episodeMap.set(problem.episode, []);
      }
      episodeMap.get(problem.episode).push(problem);
    });
    
    return Array.from(episodeMap.entries()).map(([episode, problems]) => ({
      episode,
      problems
    }));
  }

  // 에피소드 변경 핸들러
  function handleEpisodeChange(episode, firstProblemId) {
    // 에피소드 변경 시 모든 풀이 상태를 숨김
    showExplanations = showExplanations.map(() => false);
    activeEpisode = episode;
    activeProblemId = firstProblemId;
  }

  // 문제 변경 핸들러
  async function handleProblemChange(problemId) {
    // 이전 문제의 풀이 상태를 숨김
    showExplanations = showExplanations.map(() => false);
    activeProblemId = problemId;
    await tick();
    await renderMath();
  }

  // 풀이 표시 상태를 관리하기 위해 배열 추가
  let showExplanations = mathProblems.map(() => false);

  // 풀이 토글 함수 추가
  async function toggleExplanation(index) {
    // 다른 문제의 풀이는 모두 숨기고 현재 문제의 풀이만 토글
    showExplanations = showExplanations.map((_, i) => i === index ? !showExplanations[i] : false);
    
    // 풀이가 표시될 때 LaTeX 렌더링
    await tick();
    await renderMath();
  }

  // LaTeX 수식을 추출하고 렌더링하는 함수 추가
  function renderLastHint(content) {
    // LaTeX 수식 패턴 매칭
    const parts = content.split(/(\\[\(\[].*?\\[\)\]])/g);
    
    return parts.map((part, index) => {
      if (part.match(/^\\[\(\[]/)) {
        // LaTeX 수식인 경우
        return `<span class="math-container" data-content="${part}"></span>`;
      } else {
        // 일반 텍스트인 경우
        return `<span>${part}</span>`;
      }
    }).join('');
  }

  // 원본 텍스트 표시 상태 관리
  let showOriginalTexts = mathProblems.map(() => false);

  function toggleOriginalText(problemIndex) {
    showOriginalTexts[problemIndex] = !showOriginalTexts[problemIndex];
    showOriginalTexts = [...showOriginalTexts];
  }
</script>

<div class="container mx-auto px-4 py-8 max-w-4xl">
  <h1 class="text-3xl font-bold mb-8 text-center">중등수학 맞춤추천(문항)</h1>

  <!-- 에피소드 탭 -->
  <div class="mb-6 flex space-x-2 overflow-x-auto pb-2">
    {#each episodeGroups as group}
      <button
        class="px-4 py-2 whitespace-nowrap rounded-lg {
          activeEpisode === group.episode 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-200 hover:bg-gray-300'
        }"
        on:click={() => handleEpisodeChange(group.episode, group.problems[0].id)}
      >
        {group.episode}
      </button>
    {/each}
  </div>

  <!-- 문제 탭 -->
  {#if activeEpisode}
    <div class="mb-6">
      <div class="border-b border-gray-200">
        <nav class="-mb-px flex flex-wrap gap-2">
          {#each episodeGroups.find(g => g.episode === activeEpisode).problems as problem}
            <button
              class={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeProblemId === problem.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              on:click={() => handleProblemChange(problem.id)}
            >
              문제 {problem.id}
            </button>
          {/each}
        </nav>
      </div>
    </div>

    <!-- 선택된 문제 표시 -->
    {#if activeProblemId}
      {#each episodeGroups.find(g => g.episode === activeEpisode).problems as problem}
        {#if activeProblemId === problem.id}
          <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
            <!-- 문제 번 -->
            <div class="text-lg font-semibold mb-4 text-blue-600">
              문제 {problem.id}
            </div>

            <!-- 문제 내용 -->
            <div class="mb-6">
              <!-- 문제 텍스트를 보기와 구분하여 표시 -->
              {#if problem.question.text.includes('【보기】')}
                <!-- 보기가 있는 경우 -->
                <div class="mb-4 whitespace-pre-line">
                  {problem.question.text.split('【보기】')[0]}
                </div>
                <div class="bg-gray-50 p-4 rounded-lg mb-4">
                  <div class="font-semibold mb-2">【보기】</div>
                  <div class="math-container whitespace-pre-line pl-4" 
                       data-content={problem.question.text.split('【보기】')[1]}>
                  </div>
                </div>
              {:else}
                <!-- 일반 문제의 우 -->
                <div class="math-container whitespace-pre-line" 
                     data-content={problem.question.text}>
                </div>
              {/if}
            </div>

            <!-- 힌트 버튼 -->
            <div class="mt-6">
              <button
                class="px-4 py-2 bg-white text-[#AC4FF0] border-2 border-[#AC4FF0] rounded-lg shadow-sm hover:shadow-md active:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:text-white hover:border-transparent hover:bg-gradient-to-r hover:from-[#FF3B9A] hover:via-[#AC4FF0] hover:to-[#4CC9F0] hover:-translate-y-0.5 active:translate-y-0 mb-4"
                on:click={() => requestHint(problem.id - 1)}
                disabled={hints[problem.id - 1].loading || getButtonText(problem.id - 1).disabled}
              >
                {#if hints[problem.id - 1].loading}
                  <div class="flex items-center justify-center gap-2">
                    <div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    <span>힌트 불러오는 중...</span>
                  </div>
                {:else}
                  <div class="flex items-center justify-center gap-2">
                    <span class="material-symbols-rounded text-sm">auto_awesome</span>
                    <span class="font-medium">{getButtonText(problem.id - 1).text}</span>
                  </div>
                {/if}
              </button>

              <!-- 힌트 표시 -->
              {#if hints[problem.id - 1].allHints}
                <div class="space-y-4">
                  {#each hints[problem.id - 1].allHints.slice(0, hints[problem.id - 1].currentStep + 1) as hint, index}
                    <div class="bg-gray-50 p-4 rounded-lg" 
                         class:animate-fade-in={index === hints[problem.id - 1].currentStep}>
                      <h3 class="font-semibold mb-2 text-green-600">힌트 {hint.step}</h3>
                      <!-- 마지막 힌트는 LaTeX 수식 렌더링과 원본 보기 버튼 추가 -->
                      {#if hint.step === 3}
                        <div class="relative">
                          <!-- 렌더링된 힌트 -->
                          {@html renderLastHint(hint.content)}
                          
                          <!-- 원본 보기 버튼 -->
                          <button 
                            class="absolute top-0 right-0 text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-gray-600"
                            on:click={() => toggleOriginalText(problem.id - 1)}
                          >
                            {showOriginalTexts[problem.id - 1] ? '원본 닫기' : '원본 보기'}
                          </button>

                          <!-- 원본 텍스트 (토글) -->
                          {#if showOriginalTexts[problem.id - 1]}
                            <div class="mt-4 p-3 bg-gray-100 rounded-lg text-sm font-mono whitespace-pre-wrap break-all">
                              {hint.content}
                            </div>
                          {/if}
                        </div>
                      {:else}
                        <div class="math-container whitespace-pre-line" 
                             data-content={hint.content}>
                        </div>
                      {/if}
                    </div>
                  {/each}
                </div>
              {/if}

              {#if hints[problem.id - 1].error}
                <div class="text-red-500 mt-2">
                  {hints[problem.id - 1].error}
                </div>
              {/if}
            </div>
          </div>

          <!-- 풀이를 별도의 카드로 분리 -->
          {#if problem.explanation}
            <div class="bg-white rounded-lg shadow-lg p-6">
              <button
                class="w-full flex justify-between items-center py-2 text-left font-semibold text-gray-700 hover:text-gray-900"
                on:click={() => toggleExplanation(problem.id - 1)}
              >
                <span>풀이 보기</span>
                <svg
                  class="w-5 h-5 transform transition-transform duration-200 {showExplanations[problem.id - 1] ? 'rotate-180' : ''}"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {#if showExplanations[problem.id - 1]}
                <div 
                  class="math-container mt-4 pt-4 border-t border-gray-200 leading-relaxed whitespace-pre-line" 
                  data-content={problem.explanation}
                  transition:slide
                  on:introend={renderMath}
                >
                </div>
              {/if}
            </div>
          {/if}
        {/if}
      {/each}
    {/if}
  {/if}
</div>

<!-- KaTeX 관련 스타일을 Tailwind 클래스로 대체 -->
<div class="hidden">
  <div class="text-lg leading-7"></div> <!-- katex 기본 크기 대체 -->
  <div class="overflow-x-auto overflow-y-hidden my-2"></div> <!-- katex-display 대체 -->
  <div class="leading-relaxed"></div> <!-- math-container 대체 -->
  <div class="max-w-full overflow-x-auto overflow-y-hidden"></div> <!-- katex-html 대체 -->
  <div class="animate-[fadeIn_0.5s_ease-in]"></div> <!-- animate-fade-in 대체 -->
  <div class="whitespace-pre-line"></div> <!-- whitespace-pre-line 대체 -->
</div>

<style>
  /* KaTeX 기본 타일만 유지 (Tailwind로 대체할 수 없는 부분) */
  :global(.katex) {
    font-size: 1.2em;
  }
</style> 