import { json } from '@sveltejs/kit';
import { CLOVA_STUDIO_API_URL, CLOVA_STUDIO_API_KEY, CLOVA_STUDIO_APIGW_KEY } from '$env/static/private';

export async function POST({ request }) {
  const { userMessage } = await request.json();

  try {
    const response = await fetch(CLOVA_STUDIO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-NCP-CLOVASTUDIO-API-KEY': CLOVA_STUDIO_API_KEY,
        'X-NCP-APIGW-API-KEY': CLOVA_STUDIO_APIGW_KEY,
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: '' },
          { role: 'user', content: userMessage }
        ],
        topP: 0.8,
        topK: 0,
        maxTokens: 256,
        temperature: 0.5,
        repeatPenalty: 5.0,
        stopBefore: [],
        includeAiFilters: true,
        seed: 0
      }),
    });

    if (!response.ok) {
      throw new Error('API 요청 실패');
    }

    const data = await response.json();
    return json({ content: data.result.message.content });
  } catch (error) {
    console.error('Error:', error);
    return json({ error: '오류가 발생했습니다.' }, { status: 500 });
  }
}
