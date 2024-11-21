export async function generateProblem(type, content, example) {
  try {
    const response = await fetch('/api/generate-problem', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        type, 
        content,
        systemPrompt: `당신은 영어 교육 전문가입니다. 주어진 요청과 예시 문제를 참고하여 새로운 영어 문제를 생성해주세요.
응답은 반드시 아래 형식의 유효한 JSON이어야 합니다:

{
  "content": {
    "korean": "한국어로 된 문제 설명과 지시사항을 한 줄로 작성",
    "english": "영어로 된 실제 문제 내용을 한 줄로 작성"
  }
}

주의사항:
1. 모든 텍스트는 한 줄로 작성하고, 줄바꿈은 \\n으로 표시
2. 따옴표는 \\"로 이스케이프 처리
3. 특수문자는 모두 이스케이프 처리
4. JSON.parse()로 파싱 가능해야 함
5. 예시 문제의 형식을 참고하되 줄바꿈은 \\n으로 변환`,
        userPrompt: `다음 조건에 맞는 영어 문제를 만들어주세요:

문제 유형: ${type}
요청 사항: ${content}

참고할 예시 문제:
${example.replace(/\n/g, '\\n')}

응답은 반드시 위에서 지정한 JSON 형식을 따라야 하며, 모든 줄바꿈은 \\n으로 처리해야 합니다.`
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('API Error:', data);
      throw new Error(data.error || 'Failed to generate problem');
    }

    // 줄바꿈 문자열을 실제 줄바꿈으로 변환
    return {
      content: `${data.content.korean.replace(/\\n/g, '\n')}\n\n${data.content.english.replace(/\\n/g, '\n')}`,
      retryCount: data.retryCount || 0
    };
  } catch (error) {
    console.error('Service Error:', error);
    throw error;
  }
} 