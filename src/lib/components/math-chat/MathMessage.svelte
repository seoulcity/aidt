<script>
  import katex from 'katex';
  
  export let content = '';
  
  function renderMathContent(text) {
    // KaTeX 수식을 찾아서 렌더링
    const inlineMathRegex = /\$([^\$]+)\$/g;
    const displayMathRegex = /\$\$([^\$]+)\$\$/g;
    
    // 디스플레이 수식 먼저 처리
    let result = text.replace(displayMathRegex, (match, formula) => {
      try {
        return katex.renderToString(formula.trim(), {
          displayMode: true,
          throwOnError: false
        });
      } catch (e) {
        console.error('KaTeX 렌더링 에러:', e);
        return match;
      }
    });
    
    // 인라인 수식 처리
    result = result.replace(inlineMathRegex, (match, formula) => {
      try {
        return katex.renderToString(formula.trim(), {
          displayMode: false,
          throwOnError: false
        });
      } catch (e) {
        console.error('KaTeX 렌더링 에러:', e);
        return match;
      }
    });
    
    // 일반 텍스트를 단락으로 분리
    return result.split('\n\n').map(paragraph => 
      `<p class="mb-4">${paragraph.trim()}</p>`
    ).join('');
  }
</script>

<div class="math-message">
  {@html renderMathContent(content)}
</div>

<style>
  .math-message :global(.katex-display) {
    margin: 1em 0;
    overflow-x: auto;
    overflow-y: hidden;
  }
  
  .math-message :global(.katex) {
    font-size: 1.1em;
  }
  
  .math-message :global(p:last-child) {
    margin-bottom: 0;
  }
</style> 