<!-- src/components/PronunciationExamples.svelte -->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    
    const dispatch = createEventDispatcher();
    
    export let showExamples = false;
    
    const exampleSentences = [
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
    
    function selectSentence(sentence: string) {
        dispatch('select', sentence);
        showExamples = false;
    }
</script>

{#if showExamples}
    <div class="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-gray-700">예시 문장 선택</h2>
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
        예시 문장 선택하기
    </button>
{/if} 