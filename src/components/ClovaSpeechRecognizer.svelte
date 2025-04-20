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
    
    const INVOKE_URL = 'https://clovaspeech-gw.ncloud.com/recog/v1/stt';
    const SECRET_KEY = '90389110ada444f28569b4b57d8a059f';
    
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
            
            const url = `${INVOKE_URL}?${params.toString()}`;
            
            // API 요청 보내기
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'X-CLOVASPEECH-API-KEY': SECRET_KEY
                },
                body: audioBlob
            });
            
            if (!response.ok) {
                throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
            }
            
            const result = await response.json();
            
            // 결과를 부모 컴포넌트로 전달
            dispatch('recognitionResult', result);
            
        } catch (err) {
            console.error('음성 인식 오류:', err);
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