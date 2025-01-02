<script lang="ts">
  import { personaChatQueries } from '$lib/stores/embeddingStore';
  
  export let messages: any[] = [];
  export let onExampleClick: (text: string) => void;

  // 각 카테고리별로 3개의 예시 질문 선택
  const learningTipExamples = personaChatQueries
    .filter(q => q.category === '학습팁')
    .slice(0, 3);

  const motivationExamples = personaChatQueries
    .filter(q => q.category === '동기부여/정서')
    .slice(0, 3);
</script>

{#if messages.length === 0}
  <div class="p-8">
    <div class="max-w-4xl mx-auto">
      <h3 class="text-xl font-bold text-gray-800 mb-6 text-center">
        💡 AI 튜터에게 질문해보세요
      </h3>
      
      <div class="grid gap-8 md:grid-cols-2">
        <!-- 학습 방법/전략 섹션 -->
        <div class="space-y-4">
          <h4 class="font-medium text-blue-800 flex items-center gap-2 mb-4">
            <span class="material-symbols-rounded">school</span>
            학습 방법/전략
          </h4>
          <div class="space-y-4">
            {#each learningTipExamples as example}
              <button
                class="w-full text-left p-4 rounded-lg border border-blue-200 hover:border-blue-400 bg-blue-50 hover:bg-blue-100 transition-colors"
                on:click={() => onExampleClick(example.text)}
              >
                <p class="text-blue-900">{example.text}</p>
                <div class="mt-2 flex flex-wrap gap-2">
                  {#each example.keywords as keyword}
                    <span class="px-2 py-0.5 bg-blue-200 text-blue-800 rounded-full text-xs">
                      {keyword}
                    </span>
                  {/each}
                </div>
              </button>
            {/each}
          </div>
        </div>

        <!-- 동기/심리 관리 섹션 -->
        <div class="space-y-4">
          <h4 class="font-medium text-purple-800 flex items-center gap-2 mb-4">
            <span class="material-symbols-rounded">psychology</span>
            동기/심리 관리
          </h4>
          <div class="space-y-4">
            {#each motivationExamples as example}
              <button
                class="w-full text-left p-4 rounded-lg border border-purple-200 hover:border-purple-400 bg-purple-50 hover:bg-purple-100 transition-colors"
                on:click={() => onExampleClick(example.text)}
              >
                <p class="text-purple-900">{example.text}</p>
                <div class="mt-2 flex flex-wrap gap-2">
                  {#each example.keywords as keyword}
                    <span class="px-2 py-0.5 bg-purple-200 text-purple-800 rounded-full text-xs">
                      {keyword}
                    </span>
                  {/each}
                </div>
              </button>
            {/each}
          </div>
        </div>
      </div>

      <p class="text-gray-600 text-sm text-center mt-8">
        AI 튜터가 학생의 수준에 맞춰 학습 방법과 정서적 지원을 제공합니다.
      </p>
    </div>
  </div>
{/if} 