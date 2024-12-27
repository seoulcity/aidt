<script>
  import katex from 'katex';
  
  export let content = '';
  
  function renderMathContent(text) {
    // KaTeX 수식을 찾아서 렌더링
    const inlineMathRegex = /\$([^\$]+)\$/g;
    const displayMathRegex = /\$\$([^\$]+)\$\$/g;
    // 일반 텍스트에서 수식 패턴을 찾기 위한 정규식
    const fractionRegex = /(\d+)\s*\/\s*(\d+[a-zA-Z]*)/g;  // 분수 패턴 (예: 35/20a)
    const exponentRegex = /(\d+)\^(\d+)/g;  // 거듭제곱 패턴 (예: 2^2)
    const complexFractionRegex = /(\d+)\s*\/\s*\(([^)]+)\)/g;  // 복잡한 분수 패턴 (예: 7/(2^2 * a))
    const multiplicationRegex = /(\d+|\([^)]+\))\s*\*\s*(\d+|\([^)]+\))/g;  // 곱하기 패턴 (예: 2^2 * a)
    
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

    // 일반 텍스트의 분수를 KaTeX로 변환
    result = result.replace(fractionRegex, (match, numerator, denominator) => {
      try {
        return katex.renderToString(`\\frac{${numerator}}{${denominator}}`, {
          displayMode: false,
          throwOnError: false
        });
      } catch (e) {
        console.error('KaTeX 렌더링 에러:', e);
        return match;
      }
    });

    // 일반 텍스트의 거듭제곱을 KaTeX로 변환
    result = result.replace(exponentRegex, (match, base, exponent) => {
      try {
        return katex.renderToString(`${base}^{${exponent}}`, {
          displayMode: false,
          throwOnError: false
        });
      } catch (e) {
        console.error('KaTeX 렌더링 에러:', e);
        return match;
      }
    });

    // 복잡한 분수 처리 (괄호가 있는 경우)
    result = result.replace(complexFractionRegex, (match, numerator, denominator) => {
      try {
        // 분모에서 곱하기 기호를 KaTeX 형식으로 변환
        const processedDenominator = denominator.replace(/\*/g, '\\times ');
        return katex.renderToString(`\\frac{${numerator}}{${processedDenominator}}`, {
          displayMode: false,
          throwOnError: false
        });
      } catch (e) {
        console.error('KaTeX 렌더링 에러:', e);
        return match;
      }
    });

    // 곱하기 처리
    result = result.replace(multiplicationRegex, (match, a, b) => {
      try {
        return katex.renderToString(`${a} \\times ${b}`, {
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