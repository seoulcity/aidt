<!-- src/routes/miraen/middle-math-pro/components/ProblemCard.svelte -->
<script>
  import katex from 'katex';
  export let problem;
  
  function parseXML(xmlString) {
    if (!xmlString) return [];
    
    try {
      // XML 문자열을 적절한 형식으로 감싸기
      const wrappedXml = `<?xml version="1.0" encoding="UTF-8"?><root>${xmlString}</root>`;
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(wrappedXml, 'text/xml');
      
      // 파싱 에러 체크
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        console.error('XML 파싱 에러:', parserError);
        return [{ type: 'text', content: xmlString }];
      }
      
      function processNode(node) {
        const elements = [];
        
        node.childNodes.forEach(child => {
          if (child.nodeType === 3) { // Text node
            const text = child.textContent.trim();
            if (text) elements.push({ type: 'text', content: text });
          } 
          else if (child.nodeType === 1) { // Element node
            if (child.tagName === 'EQ') {
              const latexEq = child.getAttribute('latexeq');
              elements.push({ type: 'equation', content: latexEq });
            }
            else if (child.tagName === 'CHAR') {
              elements.push(...processNode(child));
            }
            else if (child.tagName === 'INPUTBOX') {
              elements.push({ type: 'input', width: child.getAttribute('width') });
            }
            else {
              elements.push(...processNode(child));
            }
          }
        });
        
        return elements;
      }
      
      return processNode(xmlDoc.documentElement);
    } catch (error) {
      console.error('XML 처리 에러:', error);
      return [{ type: 'text', content: xmlString }];
    }
  }

  function renderElement(element) {
    if (!element) return '';
    
    if (element.type === 'equation') {
      try {
        const html = katex.renderToString(element.content || '', {
          throwOnError: false,
          displayMode: false
        });
        return `<span class="inline-block mx-1">${html}</span>`;
      } catch (e) {
        console.error('LaTeX 렌더링 에러:', e);
        return element.content || '';
      }
    }
    else if (element.type === 'input') {
      return `<input type="text" class="border border-gray-300 rounded px-2 py-1 w-32">`;
    }
    return element.content || '';
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
        <div class="p-4 bg-gray-50 rounded min-h-[100px]">
          {#each parseXML(content) as element}
            {@html renderElement(element)}
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div> 