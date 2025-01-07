<!-- src/lib/components/adaptive-chat/ChatGuide.svelte -->
<script>
  export let messages = [];
  export let onExampleClick;
</script>

{#if messages.length === 0}
  <div class="p-8 text-center">
    <div class="max-w-lg mx-auto">
      <h3 class="text-xl font-bold text-gray-800 mb-4">
        💡 AI 튜터에게 질문해보세요
      </h3>
      <div class="bg-blue-50 p-6 rounded-lg mb-6">
        <p class="text-blue-800 font-medium mb-3">예시 질문</p>
        <ul class="space-y-2 text-blue-700">
          <li class="hover:bg-blue-100 p-2 rounded cursor-pointer transition-colors"
              on:click={() => onExampleClick('수학 공부를 효율적으로 하는 방법을 알려주세요.')}>
            • 수학 공부를 효율적으로 하는 방법을 알려주세요.
          </li>
          <li class="hover:bg-blue-100 p-2 rounded cursor-pointer transition-colors"
              on:click={() => onExampleClick('수학 시험 전날에는 어떻게 공부하는 것이 좋을까요?')}>
            • 수학 시험 전날에는 어떻게 공부하는 것이 좋을까요?
          </li>
          <li class="hover:bg-blue-100 p-2 rounded cursor-pointer transition-colors"
              on:click={() => onExampleClick('수학 문제를 풀 때 실수를 줄이는 방법이 있을까요?')}>
            • 수학 문제를 풀 때 실수를 줄이는 방법이 있을까요?
          </li>
          <li class="hover:bg-blue-100 p-2 rounded cursor-pointer transition-colors"
              on:click={() => onExampleClick('수학에 대한 자신감이 부족한데 어떻게 극복할 수 있을까요?')}>
            • 수학에 대한 자신감이 부족한데 어떻게 극복할 수 있을까요?
          </li>
        </ul>
      </div>
      <p class="text-gray-600 text-sm">
        AI 튜터가 학습 방법, 시험 준비, 정서적 지원 등 다양한 관점에서 도움을 드립니다.
      </p>
    </div>
  </div>
{/if} 