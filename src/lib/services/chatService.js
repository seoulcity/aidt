export async function searchRelatedContexts(query) {
    try {
        console.log('\n=== 임베딩 검색 시작 ===');
        console.log('검색 쿼리:', query);
        
        const response = await fetch('/api/search-embeddings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query })
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error('검색 API 에러:', data);
            throw new Error(data.error || '검색 실패');
        }

        logSearchResults(data);
        
        return data.results || [];
    } catch (error) {
        console.error('임베딩 검색 오류:', {
            message: error.message,
            error: error
        });
        return [];
    }
}

export async function sendChatMessage(systemPrompt, userMessage) {
    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            systemPrompt,
            userMessage
        })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '응답을 받아올 수 없습니다.');
    
    return data.content;
}

function logSearchResults(data) {
    if (data.similarities) {
        console.log('\n=== 유사도 비교 결과 ===');
        console.table(
            data.similarities.map(item => ({
                파일명: item.filename,
                교과서: item.textbook,
                단원: item.unit,
                유사도: Number(item.similarity).toFixed(4),
                선택여부: item.similarity > 0.5 ? '✓' : '✗'
            }))
        );
    }
    
    // ... 나머지 로깅 함수들
} 