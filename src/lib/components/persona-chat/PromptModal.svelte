<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { PersonaPrompt } from '$lib/types/persona';
  
  export let showModal = false;
  export let type: 'learning_tip' | 'emotional_support' | 'normal' | null = null;
  export let prompts: PersonaPrompt[] = [];
  export let currentLevel: string;
  
  const dispatch = createEventDispatcher();

  function handleClose() {
    dispatch('close');
  }

  $: typeLabel = type === 'learning_tip' ? '학습 방법/전략' : 
                 type === 'emotional_support' ? '동기/심리 관리' :
                 '기본 답변';
  $: levelLabels = {
    '상': '상위권',
    '중': '중위권',
    '하': '하위권'
  };

  $: icon = type === 'learning_tip' ? 'school' :
           type === 'emotional_support' ? 'psychology' :
           'chat';
</script>

{#if showModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg max-w-2xl w-full shadow-xl max-h-[80vh] flex flex-col">
      <div class="p-4 border-b border-gray-200 flex-shrink-0">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="material-symbols-rounded text-gray-600">{icon}</span>
            <h3 class="text-lg font-medium text-gray-900">
              {typeLabel} 프롬프트
            </h3>
          </div>
          <button
            class="text-gray-400 hover:text-gray-500"
            on:click={handleClose}
          >
            <span class="material-symbols-rounded">close</span>
          </button>
        </div>
      </div>
      
      <div class="p-4 space-y-4 overflow-y-auto">
        {#each prompts as prompt}
          <div class="border rounded-lg p-4 {prompt.level === currentLevel ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}">
            <div class="flex items-center justify-between mb-2">
              <span class="font-medium text-gray-900">
                {levelLabels[prompt.level]} 학생용
              </span>
              {#if prompt.level === currentLevel}
                <span class="text-blue-600 text-sm flex items-center">
                  <span class="material-symbols-rounded text-sm mr-1">check_circle</span>
                  현재 적용됨
                </span>
              {/if}
            </div>
            <p class="text-gray-600 whitespace-pre-wrap">{prompt.prompt}</p>
          </div>
        {/each}
      </div>
    </div>
  </div>
{/if} 