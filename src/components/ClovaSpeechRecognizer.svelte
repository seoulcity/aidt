<!-- src/components/ClovaSpeechRecognizer.svelte -->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    
    export let audioBlob: Blob | null = null;
    export let language: 'Kor' | 'Eng' | 'Jpn' | 'Chn' = 'Eng';
    export let enableAssessment: boolean = true;
    export let referenceText: string = '';
    export let enableGraph: boolean = false;
    
    const dispatch = createEventDispatcher();
    
    let isLoading = false;
    let error: string | null = null;
    
    async function sendAudioToClova() {
        if (!audioBlob) {
            error = "오디오 파일이 없습니다.";
            return;
        }
        
        isLoading = true;
        error = null;
        
        try {
            // 쿼리 파라미터 구성
            const params = new URLSearchParams({
                lang: language,
                assessment: enableAssessment.toString(),
            });
            
            if (enableAssessment && referenceText) {
                params.append('utterance', referenceText);
            }
            
            if (enableGraph) {
                params.append('graph', 'true');
            }
            
            // 내부 API 프록시 URL
            const url = `/api/clova/speech?${params.toString()}`;
            
            console.log('[CLOVA 클라이언트] 요청 URL:', url);
            console.log('[CLOVA 클라이언트] 파라미터:', {
                language,
                enableAssessment,
                referenceText: enableAssessment ? referenceText : '(사용 안함)',
                enableGraph,
                audioSize: audioBlob?.size || 0
            });
            
            // API 요청 보내기
            const response = await fetch(url, {
                method: 'POST',
                body: audioBlob
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('[CLOVA 클라이언트] 응답 오류:', errorData);
                throw new Error(errorData.error || `API 요청 실패: ${response.status}`);
            }
            
            const result = await response.json();
            
            // 콘솔에 결과 로그 찍기
            console.log('[CLOVA 클라이언트] 응답 결과:', result);
            
            // 특정 필드들 자세히 로깅
            if (result.text) {
                console.log('[CLOVA 클라이언트] 인식된 텍스트:', result.text);
            }
            
            if (result.assessment_score !== undefined) {
                console.log('[CLOVA 클라이언트] 발음 평가 점수:', result.assessment_score);
            }
            
            if (result.assessment_details) {
                console.log('[CLOVA 클라이언트] 발음 평가 상세:', result.assessment_details);
            }
            
            // 결과를 부모 컴포넌트로 전달
            dispatch('recognitionResult', result);
            
        } catch (err) {
            console.error('[CLOVA 클라이언트] 오류:', err);
            error = err instanceof Error ? err.message : '음성 인식 중 오류가 발생했습니다.';
            dispatch('error', { message: error });
        } finally {
            isLoading = false;
        }
    }
</script>

{#if audioBlob}
    <div class="mt-4 space-y-4">
        <button
            class="w-full py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            on:click={sendAudioToClova}
            disabled={isLoading || !audioBlob}
        >
            {#if isLoading}
                <div class="inline-block animate-spin mr-2">⟳</div>음성 인식 중...
            {:else}
                음성 인식하기
            {/if}
        </button>
        
        {#if error}
            <div class="p-3 bg-red-100 border border-red-300 text-red-800 rounded-lg">
                {error}
            </div>
        {/if}
    </div>
{/if} 