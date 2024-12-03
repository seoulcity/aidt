import { json } from '@sveltejs/kit';
import { HCX_API_URL } from '$env/static/private';

export async function POST({ request }) {
    const { problem, hintLevel } = await request.json();
    
    const systemPrompt = `당신은 중학교 수학 문제의 힌트를 제공하는 수학 교사입니다.
문제를 단계별로 이해하고 해결할 수 있도록 도와주되, 직접적인 답을 알려주지는 않습니다.
힌트는 수식을 포함할 수 있으며 LaTeX 형식으로 작성됩니다.
LaTeX 수식은 반드시 \\(...\\) 안에 작성해주세요.
예시: 분수 \\(\\frac{7}{3}\\)을 계산하면...

현재 문제: ${problem.content}
정답: ${problem.answer}
힌트 레벨: ${hintLevel + 1}단계 (총 3단계)

각 단계별 힌트는 다음과 같은 특징을 가져야 합니다:
1단계: 문제 해결의 시작점을 제시
2단계: 구체적인 접근 방법 안내
3단계: 정답 직전까지의 구체적인 힌트`;

    const userPrompt = `${hintLevel + 1}단계 힌트를 제공해주세요.`;

    try {
        const response = await fetch(HCX_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                systemPrompt,
                userPrompt,
                temperature: 0.2,
                maxTokens: 500,
            }),
        });

        if (!response.ok) {
            throw new Error('API 호출 실패');
        }

        const data = await response.json();
        return json({ hint: data.choices[0].message.content });
    } catch (error) {
        console.error('힌트 생성 오류:', error);
        return json({ 
            hint: "힌트를 생성하는 중 오류가 발생했습니다. 다시 시도해주세요." 
        }, { status: 500 });
    }
} 