import { json } from '@sveltejs/kit';
import { CLOVA_STUDIO_API_KEY, CLOVA_STUDIO_API_URL, CLOVA_STUDIO_APIGW_KEY } from '$env/static/private';

export async function POST({ request }) {
  try {
    const { systemPrompt, userPrompt } = await request.json();

    console.log('Request to CLOVA Studio:', {
      systemPrompt,
      userPrompt,
      url: CLOVA_STUDIO_API_URL
    });

    const response = await fetch(CLOVA_STUDIO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CLOVA_STUDIO_API_KEY}`,
        'X-NCP-CLOVASTUDIO-REQUEST-ID': `generate-problem-${Date.now()}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        topP: 0.8,
        topK: 0,
        maxTokens: 1000,
        temperature: 0.5,
        repeatPenalty: 5.0,
        stopBefore: [],
        includeAiFilters: true,
        stream: false
      }),
    });

    const responseData = await response.json();
    console.log('CLOVA Studio Response:', responseData);

    if (!response.ok || !responseData.result) {
      console.error('CLOVA Studio Error:', responseData);
      return json({ error: responseData.status?.message || 'Failed to generate problem' }, { status: response.status });
    }

    if (responseData.result && responseData.result.message && responseData.result.message.content) {
      try {
        const result = JSON.parse(responseData.result.message.content);
        return json(result);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        return json({ error: 'Invalid JSON response from CLOVA Studio' }, { status: 500 });
      }
    } else {
      throw new Error('Invalid response format from CLOVA Studio API');
    }
  } catch (error) {
    console.error('Server Error:', error);
    return json({ 
      error: error.message || 'Internal Server Error',
      details: error.stack
    }, { status: 500 });
  }
} 