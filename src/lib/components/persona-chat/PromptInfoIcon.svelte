<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { PersonaPrompt } from '$lib/types/persona';
  
  export let type: 'learning_tip' | 'emotional_support' | 'normal';
  export let currentLevel: string;
  export let prompts: PersonaPrompt[];
  
  const dispatch = createEventDispatcher();

  function handleClick() {
    if (type === 'normal') {
      dispatch('showPrompt', { 
        type: 'normal',
        prompts: [{
          level: currentLevel,
          type: 'normal',
          prompt: `${levelLabels[currentLevel]} 학생을 위한 기본 답변 프롬프트:
1. 친근하고 이해하기 쉬운 언어 사용
2. 학생의 수준에 맞는 설명 제공
3. 긍정적이고 격려하는 톤 유지
4. 필요한 경우 추가 질문 유도`
        }],
        currentLevel
      });
      return;
    }

    const promptsByType = prompts.filter(p => p.type === type);
    dispatch('showPrompt', { 
      type,
      prompts: promptsByType,
      currentLevel
    });
  }

  const levelLabels = {
    '상': '상위권',
    '중': '중위권',
    '하': '하위권'
  };

  $: icon = type === 'learning_tip' ? 'school' :
           type === 'emotional_support' ? 'psychology' :
           'chat';
</script>

<button
  class="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 transition-colors"
  on:click={handleClick}
  title="프롬프트 정보 보기"
>
  <span class="material-symbols-rounded text-sm">
    {icon}
  </span>
</button> 