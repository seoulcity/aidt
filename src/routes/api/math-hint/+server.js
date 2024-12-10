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
문제의 풀이 과정을 바탕으로 학생들이 스스로 해결할 수 있도록 단계적인 힌트를 제공해야 합니다.

수식은 LaTeX 형식으로 작성할 수 있습니다:
- 인라인 수식: \\(...\\) 사용
- 디스플레이 수식: \\[...\\] 사용
예시: "삼각형의 넓이는 \\(\\frac{1}{2}\\times 밑변\\times 높이\\) 입니다"

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
      "content": "정답 직전까지 이끄는 구체적인 힌트 (반드시 정답을 LaTeX 수식으로 포함: \\(...\\))"
    }
  ]
}

주의사항:
1. 수식이 필요한 경우 반드시 LaTeX 형식으로 작성
2. 마지막 힌트(step 3)에서는 반드시 정답을 LaTeX 수식으로 표시
3. 정확히 위 JSON 형식을 따를 것
4. 풀이 내용을 바탕으로 단계적 힌트 제공

현재 문제: ${problem.question.text}
정답: ${problem.answer}
풀이: ${problem.explanation || '풀이 없음'}`;

        const userPrompt = `위 문제의 풀이를 바탕으로 3단계 힌트를 제공해주세요. 
각 단계는 이전 단계보다 더 구체적인 도움을 주되, 마지막 힌트에서는 반드시 정답을 LaTeX 수식으로 표시해주세요.
예를 들어, 정답이 2라면 마지막 힌트에서 "정답은 \\(2\\) 입니다" 와 같이 표시합니다.`;

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

        console.log('CLOVA Studio 응답 상태:', {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
        });

        const responseText = await response.text();
        console.log('=== CLOVA Studio 원본 응답 시작 ===');
        console.log(responseText);
        console.log('=== CLOVA Studio 원본 응답 끝 ===');
        console.log('응답 길이:', responseText.length);

        if (!response.ok) {
            console.error('CLOVA Studio API 오류 응답:', {
                status: response.status,
                statusText: response.statusText,
                body: responseText
            });
            throw new Error(`CLOVA Studio API 오류 (${response.status}): ${responseText}`);
        }

        try {
            console.log('첫 번째 JSON 파싱 시도...');
            const data = JSON.parse(responseText);
            console.log('첫 번째 JSON 파싱 결과:', JSON.stringify(data, null, 2));
            
            if (!data.result?.message?.content) {
                console.error('잘못된 응답 구조:', data);
                throw new Error('CLOVA Studio API 응답 구조가 올바르지 않습니다.');
            }

            let hintContent = data.result.message.content;
            console.log('=== 원본 힌트 콘텐츠 ===');
            console.log(hintContent);

            // LaTeX 수식 이스케이프 처리
            try {
                // JSON 파싱 전에 LaTeX 수식의 백슬래시를 추가로 이스케이프
                hintContent = hintContent.replace(/\\(?!["])/g, '\\\\');
                console.log('=== 이스케이프 처리된 힌트 콘텐츠 ===');
                console.log(hintContent);

                const hintData = JSON.parse(hintContent);
                
                // 파싱 후 다시 원래 형태로 복원
                hintData.hints = hintData.hints.map(hint => ({
                    ...hint,
                    content: hint.content.replace(/\\\\/g, '\\')
                }));

                console.log('=== 최종 힌트 데이터 ===');
                console.log(JSON.stringify(hintData, null, 2));
                
                return json(hintData);
            } catch (parseError) {
                console.error('힌트 JSON 파싱 실패:', {
                    errorName: parseError.name,
                    errorMessage: parseError.message,
                    originalContent: data.result.message.content,
                    escapedContent: hintContent
                });
                throw new Error(`힌트 JSON 파싱 실패: ${parseError.message}`);
            }
        } catch (error) {
            console.error('전체 처리 실패:', {
                errorName: error.name,
                errorMessage: error.message,
                responseText
            });
            throw error;
        }
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