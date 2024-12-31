<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let showModal = false;
  export let forbiddenInfo: { category: string; keyword: string; } | null = null;
  export let analysisInfo: {
    type: 'harmful' | 'violent';
    reason: string;
    helpline?: string[];
  }[] | null = null;

  function handleClose() {
    dispatch('close');
  }
</script>

{#if showModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
      <div class="flex justify-between items-start mb-4">
        <h3 class="text-lg font-semibold text-gray-900">
          {#if forbiddenInfo}
            금칙어 정보
          {:else if analysisInfo}
            부적절한 내용 감지
          {/if}
        </h3>
        <button
          class="text-gray-400 hover:text-gray-500"
          on:click={handleClose}
        >
          <span class="material-symbols-rounded">close</span>
        </button>
      </div>

      {#if forbiddenInfo}
        <div class="space-y-4">
          <div>
            <p class="text-sm font-medium text-gray-500">카테고리</p>
            <p class="mt-1">{forbiddenInfo.category}</p>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500">감지된 키워드</p>
            <p class="mt-1">{forbiddenInfo.keyword}</p>
          </div>
        </div>
      {:else if analysisInfo}
        <div class="space-y-6">
          {#each analysisInfo as info}
            <div class="space-y-4">
              <div>
                <p class="text-sm font-medium text-gray-500">
                  {info.type === 'harmful' ? '자살/자해 감지' : '반사회적/폭력적 내용 감지'}
                </p>
                <p class="mt-1">{info.reason}</p>
              </div>
              {#if info.helpline}
                <div>
                  <p class="text-sm font-medium text-gray-500">도움받을 수 있는 연락처</p>
                  <div class="mt-2 space-y-2">
                    {#each info.helpline as line}
                      <p class="text-blue-600">{line}</p>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>
          {/each}
          <div class="mt-4 p-4 bg-yellow-50 rounded-lg">
            <p class="text-sm text-yellow-800">
              {#if analysisInfo.some(info => info.type === 'harmful')}
                힘든 상황에 혼자 계신다면, 전문가와의 상담을 통해 도움을 받으실 수 있습니다.
                언제든 위의 상담전화로 연락하실 수 있습니다.
              {:else}
                건전한 대화를 위해 서로를 배려하는 마음으로 대화해주세요.
              {/if}
            </p>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if} 