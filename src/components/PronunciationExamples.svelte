<!-- src/components/PronunciationExamples.svelte -->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    
    const dispatch = createEventDispatcher();
    
    export let showExamples = false;
    export let language: 'Eng' | 'Kor' = 'Eng';
    
    // 영어 예시 문장
    const englishSentences = [
        { 
            level: '초급', 
            sentences: [
                "Nice to meet you.",
                "How are you today?",
                "My name is John.",
                "I am a student.",
                "This is my friend.",
                "Where is the bathroom?",
                "Thank you very much."
            ]
        },
        { 
            level: '중급', 
            sentences: [
                "Could you tell me where the station is?",
                "I've been learning English for three years.",
                "The weather is expected to improve tomorrow.",
                "I'm thinking about taking a vacation next month.",
                "Would you mind if I opened the window?",
                "I'd rather stay at home than go to the movies."
            ]
        },
        { 
            level: '상급', 
            sentences: [
                "The stale smell of old beer lingers it takes heat to bring out the odor.",
                "Despite the constant negative press covfefe.",
                "I should have known that you would have a perfect answer for me.",
                "The quick brown fox jumps over the lazy dog.",
                "She sells seashells by the seashore.",
                "How much wood would a woodchuck chuck if a woodchuck could chuck wood?"
            ]
        }
    ];
    
    // 한국어 예시 문장
    const koreanSentences = [
        {
            level: '초급',
            sentences: [
                "안녕하세요. 만나서 반갑습니다.",
                "오늘 날씨가 좋네요.",
                "저는 한국 사람입니다.",
                "지금 몇 시인가요?",
                "이것 얼마인가요?",
                "감사합니다.",
                "죄송합니다."
            ]
        },
        {
            level: '중급',
            sentences: [
                "서울에서 부산까지 얼마나 걸리나요?",
                "한국어를 배운 지 1년 되었습니다.",
                "내일 날씨는 어떨까요?",
                "다음 달에 여행을 가려고 합니다.",
                "창문을 열어도 될까요?",
                "영화 보는 것보다 집에 있는 것이 좋아요."
            ]
        },
        {
            level: '상급',
            sentences: [
                "다람쥐 헌 쳇바퀴에 타고파.",
                "국화꽃 향기가 가을의 정취를 느끼게 해요.",
                "효율적인 시간 관리는 성공의 지름길입니다.",
                "맑고 깨끗한 환경이 우리의 미래를 밝게 합니다.",
                "아버지가 방에 들어가신다.",
                "정성껏 준비한 음식이 여러분의 마음에 들었으면 좋겠습니다."
            ]
        }
    ];
    
    // 현재 선택된 언어에 따른 예시 문장
    $: exampleSentences = language === 'Eng' ? englishSentences : koreanSentences;
    
    function selectSentence(sentence: string) {
        dispatch('select', sentence);
        showExamples = false;
    }
</script>

{#if showExamples}
    <div class="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-gray-700">
                {language === 'Eng' ? '영어' : '한국어'} 예시 문장 선택
            </h2>
            <button 
                class="text-gray-500 hover:text-gray-700"
                on:click={() => showExamples = false}
            >
                <span class="text-xl">×</span>
            </button>
        </div>
        
        <div class="space-y-6">
            {#each exampleSentences as category}
                <div>
                    <h3 class="font-medium text-gray-700 mb-2">{category.level}</h3>
                    <div class="grid gap-2">
                        {#each category.sentences as sentence}
                            <button 
                                class="text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors text-gray-700 hover:text-blue-700 border border-gray-200 hover:border-blue-300"
                                on:click={() => selectSentence(sentence)}
                            >
                                {sentence}
                            </button>
                        {/each}
                    </div>
                </div>
            {/each}
        </div>
    </div>
{:else}
    <button 
        class="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4 ml-4"
        on:click={() => showExamples = true}
    >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
        </svg>
        {language === 'Eng' ? '영어' : '한국어'} 예시 문장 선택하기
    </button>
{/if} 