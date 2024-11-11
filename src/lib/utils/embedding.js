import { EMB_V2_API_KEY, EMB_V2_API_URL, EMB_REQUEST_ID } from '$env/static/private';

export async function generateEmbedding(text) {
  try {
    const response = await fetch(EMB_V2_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-NCP-CLOVASTUDIO-API-KEY': EMB_V2_API_KEY,
        'X-NCP-CLOVASTUDIO-REQUEST-ID': EMB_REQUEST_ID
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error('임베딩 생성에 실패했습니다');
    }

    const data = await response.json();
    return data.result.embedding;
  } catch (error) {
    console.error('임베딩 생성 중 오류:', error);
    throw error;
  }
} 