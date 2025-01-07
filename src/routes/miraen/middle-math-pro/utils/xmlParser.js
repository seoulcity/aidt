// src/routes/miraen/middle-math-pro/utils/xmlParser.js
function processNode(node) {
  const elements = [];
  
  node.childNodes.forEach(child => {
    if (child.nodeType === 3) { // 텍스트 노드
      const text = child.textContent.trim();
      if (text) elements.push({ type: 'text', content: text });
    } 
    else if (child.nodeType === 1) { // 엘리먼트 노드
      const styles = {};
      
      // 스타일 속성 처리
      if (child.getAttribute('forecolor')) {
        styles.color = child.getAttribute('forecolor');
      }
      if (child.getAttribute('backcolor')) {
        styles.backgroundColor = child.getAttribute('backcolor');
      }
      if (child.getAttribute('border')) {
        styles.border = child.getAttribute('border');
      }
      
      switch(child.tagName) {
        case 'TEXT':
          if (elements.length > 0) {
            elements.push({ type: 'linebreak' });
          }
          elements.push(...processNode(child));
          break;
          
        case 'TABLE':
          elements.push({ 
            type: 'table',
            width: child.getAttribute('width'),
            children: processNode(child)
          });
          break;
          
        case 'ROW':
          elements.push({
            type: 'row',
            children: processNode(child)
          });
          break;
          
        case 'CELL':
          elements.push({
            type: 'cell',
            width: child.getAttribute('width'),
            height: child.getAttribute('height'),
            styles: {
              borderLeft: child.getAttribute('borderleft'),
              borderRight: child.getAttribute('borderright'),
              borderTop: child.getAttribute('bordertop'),
              borderBottom: child.getAttribute('borderbottom'),
            },
            children: processNode(child)
          });
          break;
          
        case 'CHAR':
          elements.push({
            type: 'char',
            styles,
            children: processNode(child)
          });
          break;
          
        case 'EQ':
          elements.push({ 
            type: 'equation', 
            content: child.getAttribute('latexeq'),
            styles
          });
          break;
          
        case 'INPUTBOX':
          elements.push({ 
            type: 'input',
            width: child.getAttribute('width'),
            height: child.getAttribute('height'),
            styles: {
              ...styles,
              border: child.getAttribute('border'),
              backgroundColor: child.getAttribute('backcolor'),
            }
          });
          break;
          
        case 'CHOICE':
          elements.push({
            type: 'choice',
            count: child.getAttribute('count'),
            children: processNode(child)
          });
          break;
          
        case 'ITEM':
          elements.push({
            type: 'item',
            num: child.getAttribute('num'),
            children: processNode(child)
          });
          break;
          
        case 'ITEMPOINT':
          elements.push({
            type: 'itempoint',
            group: child.getAttribute('group'),
            num: child.getAttribute('num')
          });
          break;
          
        case 'UNDERLINE':
          elements.push({
            type: 'underline',
            children: processNode(child)
          });
          break;
          
        case 'IMAGE':
          elements.push({
            type: 'image',
            data: child.getAttribute('data'),
            width: child.getAttribute('width'),
            height: child.getAttribute('height'),
            styles
          });
          break;
          
        default:
          elements.push(...processNode(child));
      }
    }
  });
  
  return elements;
}

export function parseXML(xmlString) {
  if (!xmlString) return [];
  
  try {
    const wrappedXml = `<?xml version="1.0" encoding="UTF-8"?><root>${xmlString}</root>`;
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(wrappedXml, 'text/xml');
    
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      console.error('XML 파싱 에러:', parserError.textContent);
      return [{ type: 'text', content: xmlString }];
    }
    
    return processNode(xmlDoc.documentElement);
  } catch (error) {
    console.error('XML 처리 에러:', error);
    return [{ type: 'text', content: xmlString }];
  }
} 