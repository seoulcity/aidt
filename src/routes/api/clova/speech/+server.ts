// src/routes/api/clova/speech/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const CLOVA_API_URL = 'https://clovaspeech-gw.ncloud.com/recog/v1/stt';
const CLOVA_API_KEY = '90389110ada444f28569b4b57d8a059f';

export const POST: RequestHandler = async ({ request, url }) => {
    try {
        // URL 쿼리 파라미터 추출
        const lang = url.searchParams.get('lang') || 'Eng';
        const assessment = url.searchParams.get('assessment') || 'true';
        const utterance = url.searchParams.get('utterance') || '';
        const graph = url.searchParams.get('graph') || 'false';
        
        // CLOVA API URL 구성
        const apiUrl = new URL(CLOVA_API_URL);
        apiUrl.searchParams.set('lang', lang);
        apiUrl.searchParams.set('assessment', assessment);
        
        if (utterance) {
            apiUrl.searchParams.set('utterance', utterance);
        }
        
        if (graph === 'true') {
            apiUrl.searchParams.set('graph', graph);
        }
        
        // 오디오 바이너리 데이터 가져오기
        const audioBlob = await request.arrayBuffer();
        
        // CLOVA API로 요청 전송
        const response = await fetch(apiUrl.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/octet-stream',
                'X-CLOVASPEECH-API-KEY': CLOVA_API_KEY
            },
            body: audioBlob
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('CLOVA API 요청 실패:', response.status, errorText);
            return json({
                error: `API 요청 실패: ${response.status} ${response.statusText}`
            }, { status: response.status });
        }
        
        const result = await response.json();
        
        // 성공 응답 반환
        return json(result);
    } catch (error) {
        console.error('CLOVA API 요청 중 오류:', error);
        return json({
            error: error instanceof Error ? error.message : '서버 오류가 발생했습니다.'
        }, { status: 500 });
    }
}; 