<!-- src/components/ClovaSpeechResult.svelte -->
<script lang="ts">
    export let result: any = null;
</script>

{#if result}
    <div class="bg-white rounded-xl shadow-sm p-6">
        <h2 class="text-xl font-semibold text-gray-700 mb-4">음성 인식 결과</h2>
        
        <div class="space-y-4">
            {#if result.text}
                <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 class="font-medium text-gray-700 mb-2">인식된 텍스트</h3>
                    <p class="text-gray-800">{result.text}</p>
                </div>
            {/if}
            
            {#if result.assessment_score !== undefined}
                <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 class="font-medium text-gray-700 mb-2">발음 평가 점수</h3>
                    <div class="flex items-center">
                        <div class="text-3xl font-bold text-green-600">{result.assessment_score}</div>
                        <div class="ml-2 text-gray-500">/100</div>
                    </div>
                </div>
            {/if}
            
            {#if result.assessment_details}
                <div class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 class="font-medium text-gray-700 mb-2">상세 평가</h3>
                    <div class="text-sm text-gray-700 whitespace-pre-wrap">{result.assessment_details}</div>
                </div>
            {/if}
            
            {#if result.ref_graph && result.usr_graph}
                <div class="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <h3 class="font-medium text-gray-700 mb-2">음성 파형 그래프</h3>
                    <div class="flex justify-between space-x-4">
                        <div class="w-1/2">
                            <h4 class="text-xs font-medium text-gray-500 mb-1">참조 그래프</h4>
                            <div class="h-20 bg-white border border-gray-200 rounded p-2">
                                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    <polyline
                                        points={result.ref_graph.map((val: number, i: number) => `${i / (result.ref_graph.length - 1) * 100},${100 - (val / Math.max(...result.ref_graph) * 100)}`).join(' ')}
                                        stroke="rgba(79, 70, 229, 0.8)"
                                        stroke-width="2"
                                        fill="none"
                                    />
                                </svg>
                            </div>
                        </div>
                        <div class="w-1/2">
                            <h4 class="text-xs font-medium text-gray-500 mb-1">사용자 그래프</h4>
                            <div class="h-20 bg-white border border-gray-200 rounded p-2">
                                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    <polyline
                                        points={result.usr_graph.map((val: number, i: number) => `${i / (result.usr_graph.length - 1) * 100},${100 - (val / Math.max(...result.usr_graph) * 100)}`).join(' ')}
                                        stroke="rgba(220, 38, 38, 0.8)"
                                        stroke-width="2"
                                        fill="none"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            {/if}
            
            {#if result.quota !== undefined}
                <div class="mt-2 text-sm text-gray-500">
                    남은 API 호출 기회: {result.quota}
                </div>
            {/if}
        </div>
    </div>
{/if} 