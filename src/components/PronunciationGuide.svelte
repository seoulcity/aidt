<!-- src/components/PronunciationGuide.svelte -->
<script lang="ts">
    export let isOpen = false;
</script>

{#if isOpen}
    <div class="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-gray-700">발음 평가 결과 이해하기</h2>
            <button 
                class="text-gray-500 hover:text-gray-700"
                on:click={() => isOpen = false}
            >
                <span class="text-xl">×</span>
            </button>
        </div>
        
        <div class="space-y-4">
            <div class="border-l-4 border-blue-500 pl-4 py-2">
                <h3 class="font-medium text-gray-800 mb-1">음성 파형 그래프</h3>
                <p class="text-gray-600 text-sm">
                    사용자의 발음과 표준 발음을 시각적으로 비교할 수 있는 그래프입니다.
                </p>
                <ul class="mt-2 text-sm text-gray-600 space-y-1 list-disc list-inside ml-2">
                    <li><span class="font-medium text-indigo-600">참조 그래프</span>: 표준적인 발음의 파형을 나타냅니다.</li>
                    <li><span class="font-medium text-red-600">사용자 그래프</span>: 사용자가 실제로 발음한 음성의 파형입니다.</li>
                </ul>
                <p class="text-gray-600 text-sm mt-1">
                    두 그래프의 유사성이 높을수록 정확한 발음에 가깝습니다.
                </p>
            </div>
            
            <div class="border-l-4 border-green-500 pl-4 py-2">
                <h3 class="font-medium text-gray-800 mb-1">발음 평가 점수</h3>
                <p class="text-gray-600 text-sm">
                    0-100점 사이의 전체적인 발음 정확도 점수입니다. 점수가 높을수록 표준 발음에 가깝습니다.
                </p>
            </div>
            
            <div class="border-l-4 border-yellow-500 pl-4 py-2">
                <h3 class="font-medium text-gray-800 mb-1">상세 평가</h3>
                <p class="text-gray-600 text-sm">
                    단어별, 음소별 세부 발음 평가 정보를 제공합니다.
                </p>
                <div class="mt-2 text-xs p-2 bg-gray-50 rounded font-mono">
                    word|&#123;phoneme1(IPA):score, phoneme2(IPA):score, ...&#125;
                </div>
                <ul class="mt-2 text-sm text-gray-600 space-y-1 list-disc list-inside ml-2">
                    <li>각 단어와 그 안의 개별 음소(발음 단위)에 대한 점수를 보여줍니다.</li>
                    <li>예: <code class="text-xs bg-gray-100 p-1 rounded">old|&#123;o(oʊ):100, l(l):94, d(d):98&#125;</code></li>
                    <li><code class="text-xs bg-gray-100 p-1 rounded">old</code> 단어에서 <code class="text-xs bg-gray-100 p-1 rounded">o</code> 음소는 100점, <code class="text-xs bg-gray-100 p-1 rounded">l</code> 음소는 94점</li>
                </ul>
            </div>
            
            <div class="text-sm text-gray-500 mt-4">
                이 정보를 활용하여 자신의 발음에서 개선이 필요한 부분을 파악하고 집중적으로 연습할 수 있습니다.
            </div>
        </div>
    </div>
{:else}
    <button 
        class="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        on:click={() => isOpen = true}
    >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clip-rule="evenodd" />
        </svg>
        발음 평가 결과 이해하기
    </button>
{/if} 