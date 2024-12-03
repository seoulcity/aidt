// src/routes/api/math-hint/+server.js
import { json } from '@sveltejs/kit';
import { CLOVA_STUDIO_API_URL, CLOVA_STUDIO_API_KEY, CLOVA_STUDIO_APIGW_KEY } from '$env/static/private';

export async function POST({ request }) {
    try {
        const requestData = await request.json();
        console.log('API 요청 데이터:', requestData);
        
        const { problem } = requestData;
        if (!problem || !problem.question) {
            console.error('잘못된 요청 데이터:', requestData);
            throw new Error('올바른 문제 데이터가 제공되지 않았습니다.');
        }

        const systemPrompt = `당신은 수학 문제의 단계별 힌트를 제공하는 AI입니다.
반드시 아래 JSON 형식으로 3단계 힌트를 제공해야 합니다:

{
  "hints": [
    {
      "step": 1,
      "content": "문제 해결의 시작점을 제시하는 기초적인 힌트"
    },
    {
      "step": 2,
      "content": "구체적인 풀이 방향을 안내하는 중간 단계 힌트"
    },
    {
      "step": 3,
      "content": "정답 직전까지 이끄는 구체적인 힌트"
    }
  ]
}

주의사항:
1. 모든 수식은 반드시 LaTeX 형식으로 \\(...\\) 안에 작성
2. 직접적인 답을 알려주지 않음
3. 정확히 위 JSON 형식을 따를 것

현재 문제: ${problem.question.text}
정답: ${problem.answer}`;

        const userPrompt = `위 문제에 대한 3단계 힌트를 정확한 JSON 형식으로 제공해주세요.`;

        const clovaRequestBody = {
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
            includeAiFilters: true
        };

        console.log('CLOVA Studio 요청 데이터:', {
            systemPrompt,
            userPrompt,
            requestBody: clovaRequestBody
        });

        const response = await fetch(CLOVA_STUDIO_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-NCP-CLOVASTUDIO-API-KEY': CLOVA_STUDIO_API_KEY,
                'X-NCP-APIGW-API-KEY': CLOVA_STUDIO_APIGW_KEY,
            },
            body: JSON.stringify(clovaRequestBody),
        });

        const responseText = await response.text();
        console.log('CLOVA Studio 원본 응답:', responseText);

        if (!response.ok) {
            console.error('CLOVA Studio API 오류:', {
                status: response.status,
                statusText: response.statusText,
                body: responseText
            });
            throw new Error(`CLOVA Studio API 오류: ${response.status} ${response.statusText}`);
        }

        const data = JSON.parse(responseText);
        console.log('파싱된 CLOVA Studio 응답:', data);

        if (!data.result?.message?.content) {
            console.error('잘못된 응답 형식:', data);
            throw new Error('CLOVA Studio API가 올바른 형식으로 응답하지 않았습니다.');
        }

        // API 응답에서 JSON 문자열을 파싱
        const hintContent = data.result.message.content;
        console.log('힌트 콘텐츠:', hintContent);

        const hintData = JSON.parse(hintContent);
        console.log('파싱된 힌트 데이터:', hintData);

        return json(hintData);
    } catch (error) {
        console.error('힌트 생성 상세 오류:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
        });
        return new Response(JSON.stringify({ 
            error: error.message,
            hint: "힌트를 생성하는 중 오류가 발생했습니다. 다시 시도해주세요." 
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
} 