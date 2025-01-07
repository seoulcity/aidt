<script>
  export let type = '';

  const defaultTypes = [
    { id: 'sentence', label: '문장 완성하기' },
    { id: 'paragraph', label: '문단 완성하기' },
    { id: 'grammar', label: '문법 연습' },
    { id: 'translation', label: '번역하기' }
  ];
</script>

<div>
  <label class="block text-sm font-medium text-gray-700 mb-1">
    종류
  </label>
  <div class="relative">
    <input
      type="text"
      bind:value={type}
      list="problem-types"
      required
      class="w-full border border-gray-300 rounded-md px-3 py-2"
      placeholder="문제 종류를 선택하거나 입력하세요..."
    />
    <datalist id="problem-types">
      {#each defaultTypes as option}
        <option value={option.id}>{option.label}</option>
      {/each}
    </datalist>
  </div>
  <p class="mt-1 text-sm text-gray-500">
    기존 종류를 선택하거나 새로운 종류를 입력할 수 있습니다
  </p>
</div> 