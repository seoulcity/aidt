<script>
  export let messages = [];
</script>

{#if messages.length === 0}
  <div class="text-center text-gray-500 mt-8">
    <p class="text-lg mb-2">👋 안녕하세요!</p>
    <p class="mb-4">영문법에 대해 궁금한 점을 물어보세요.</p>
    <div class="space-y-2 text-sm">
      <p class="text-gray-400">예시 질문:</p>
      <p>"현재완료와 과거시제의 차이점이 무엇인가요?"</p>
      <p>"가정법 과거의 용법을 설명해주세요."</p>
      <p>"분사구문은 언제 사용하나요?"</p>
    </div>
  </div>
{/if} 