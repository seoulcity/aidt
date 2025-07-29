import { json } from '@sveltejs/kit';
import { EMB_V2_API_KEY, EMB_V2_API_URL, EMB_REQUEST_ID, EMB_APIGW_KEY } from '$env/static/private';

export async function POST({ request }) {
    try {
        console.log('=== 임베딩 API 요청 시작 ===');
        const { text } = await request.json();
        
        console.log('요청 텍스트:', text);
        console.log('API URL:', EMB_V2_API_URL);
        
        if (!text) {
            throw new Error('text parameter is required');
        }

        const requestBody = { text };
        console.log('API 요청 바디:', requestBody);

        const response = await fetch(EMB_V2_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${EMB_V2_API_KEY}`,
                'X-NCP-CLOVASTUDIO-REQUEST-ID': `embedding-${Date.now()}`
            },
            body: JSON.stringify(requestBody)
        });

        console.log('API 응답 상태:', response.status, response.statusText);
        console.log('요청 헤더:', {
            'Authorization': `Bearer ${EMB_V2_API_KEY}`,
            'X-NCP-CLOVASTUDIO-REQUEST-ID': `embedding-${Date.now()}`
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('임베딩 API 오류 상세:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                body: errorText
            });
            throw new Error(`임베딩 API 오류: ${response.status} ${response.statusText}\n${errorText}`);
        }

        const data = await response.json();
        console.log('API 응답 데이터:', data);

        if (!data.result?.embedding) {
            console.error('임베딩 결과 누락:', data);
            throw new Error('임베딩 결과가 올바르지 않습니다');
        }

        return json({
            embedding: data.result.embedding
        });
    } catch (error) {
        console.error('임베딩 생성 중 오류:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            cause: error.cause
        });
        return new Response(JSON.stringify({ 
            error: error instanceof Error ? error.message : String(error)
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
} 