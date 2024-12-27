<!-- src/lib/components/math-chat/MathChatGuide.svelte -->
<script>
  export let messages = [];
  export let onExampleClick;
</script>

{#if messages.length === 0}
  <div class="p-8 text-center">
    <div class="max-w-lg mx-auto">
      <h3 class="text-xl font-bold text-gray-800 mb-4">
        💡 선택한 문제에 대해 질문해보세요
      </h3>
      <div class="bg-blue-50 p-6 rounded-lg mb-6">
        <p class="text-blue-800 font-medium mb-3">예시 질문</p>
        <ul class="space-y-2 text-blue-700">
          <li class="hover:bg-blue-100 p-2 rounded cursor-pointer transition-colors"
              on:click={() => onExampleClick('이 문제의 핵심 개념은 무엇인가요?')}>
            • 이 문제의 핵심 개념은 무엇인가요?
          </li>
          <li class="hover:bg-blue-100 p-2 rounded cursor-pointer transition-colors"
              on:click={() => onExampleClick('문제 해결을 위한 첫 번째 단계는 무엇인가요?')}>
            • 문제 해결을 위한 첫 번째 단계는 무엇인가요?
          </li>
          <li class="hover:bg-blue-100 p-2 rounded cursor-pointer transition-colors"
              on:click={() => onExampleClick('이 문제와 관련된 중요한 공식이나 정의가 있나요?')}>
            • 이 문제와 관련된 중요한 공식이나 정의가 있나요?
          </li>
          <li class="hover:bg-blue-100 p-2 rounded cursor-pointer transition-colors"
              on:click={() => onExampleClick('이 문제에서 주의해야 할 점은 무엇인가요?')}>
            • 이 문제에서 주의해야 할 점은 무엇인가요?
          </li>
        </ul>
      </div>
      <p class="text-gray-600 text-sm">
        선생님이 문제 내용과 해설을 바탕으로 자세히 설명해드립니다.
      </p>
    </div>
  </div>
{/if} 