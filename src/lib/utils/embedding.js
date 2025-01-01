// src/lib/utils/embedding.js
export async function generateEmbedding(text) {
  try {
    console.log('=== 임베딩 생성 요청 시작 ===');
    console.log('요청 텍스트:', text);

    const response = await fetch('/api/embedding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    });

    console.log('서버 응답 상태:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('서버 응답 오류:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error('임베딩 생성에 실패했습니다');
    }

    const data = await response.json();
    console.log('서버 응답 데이터:', data);

    if (!data.embedding) {
      console.error('임베딩 결과 누락:', data);
      throw new Error('임베딩 결과가 올바르지 않습니다');
    }

    return data.embedding;
  } catch (error) {
    console.error('임베딩 생성 중 오류:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    throw error;
  }
} 