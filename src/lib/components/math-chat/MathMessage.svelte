<!-- src/lib/components/math-chat/MathMessage.svelte -->
<script>
  import katex from 'katex';
  
  export let content = '';
  
  function renderMathContent(text) {
    // KaTeX 수식을 찾아서 렌더링
    const inlineMathRegex = /\$([^\$]+)\$/g;
    const displayMathRegex = /\$\$([^\$]+)\$\$/g;
    // 일반 텍스트에서 수식 패턴을 찾기 위한 정규식
    const dotNotationRegex = /(\d+)\s*\.\s*\\?dot\s*\{\s*(\d+)\s*\}/g;  // 2.\dot{3} 패턴
    const fractionRegex = /(\d+)\s*\/\s*(\d+[a-zA-Z]*)/g;  // 분수 패턴 (예: 35/20a)
    const exponentRegex = /(\d+)\^(\d+)/g;  // 거듭제곱 패턴 (예: 2^2)
    const complexFractionRegex = /(\d+)\s*\/\s*\(([^)]+)\)/g;  // 복잡한 분수 패턴 (예: 7/(2^2 * a))
    const multiplicationRegex = /(\d+|\([^)]+\))\s*\*\s*(\d+|\([^)]+\))/g;  // 곱하기 패턴 (예: 2^2 * a)
    
    // 줄바꿈을 임시 마커로 변환 (KaTeX 처리 중 보존하기 위해)
    let result = text.replace(/\n/g, '{{NEWLINE}}');
    
    // 점 표기법 처리 (2.\dot{3} 형태)
    result = result.replace(dotNotationRegex, (match, before, after) => {
      try {
        return katex.renderToString(`${before}.\\dot{${after}}`, {
          displayMode: false,
          throwOnError: false
        });
      } catch (e) {
        console.error('KaTeX 렌더링 에러:', e);
        return match;
      }
    });
    
    // 디스플레이 수식 처리
    result = result.replace(displayMathRegex, (match, formula) => {
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
    
    // 임시 마커를 실제 줄바꿈으로 변환하고 단락 처리
    result = result
      .split('{{NEWLINE}}{{NEWLINE}}')  // 빈 줄로 단락 구분
      .map(paragraph => {
        // 각 단락 내의 줄들을 처리
        const lines = paragraph.split('{{NEWLINE}}').map(line => {
          // 리스트 항목('-'로 시작하는 줄) 처리
          if (line.trim().startsWith('-')) {
            return `<li class="ml-4 list-disc">${line.trim().substring(1).trim()}</li>`;
          }
          return `<div class="mb-2">${line}</div>`;  // 각 줄을 div로 감싸서 줄바꿈 유지
        }).join('');
        
        // 리스트 항목이 있는 경우 ul로 감싸기
        if (lines.includes('<li')) {
          return `<ul class="mb-4 space-y-2">${lines}</ul>`;
        }
        return `<div class="mb-4">${lines}</div>`;  // 단락을 div로 감싸기
      })
      .join('');
    
    return result || text;  // 렌더링 결과가 없으면 원본 텍스트 반환
  }
</script>

<div class="math-message">
  {@html renderMathContent(content) || content}
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