<!-- src/lib/components/subjects/EnglishFeatures.svelte -->
<script lang="ts">
    import type { FeatureSection } from '$lib/types/feature';
    import FeatureCard from '../FeatureCard.svelte';

    const englishSections: FeatureSection[] = [
        {
            title: '영어 쓰기 평가',
            icon: 'translate',
            features: [
                {
                    href: '/miraen/common-writing',
                    title: '공통 영어 쓰기',
                    description: '공통 영어 쓰기 활동을 평가해보세요',
                    icon: 'edit',
                    color: 'blue'
                },
                {
                    href: '/miraen/elementary-writing',
                    title: '초등 영어 쓰기',
                    description: '초등 영어 쓰기 활동을 평가해보세요',
                    icon: 'school',
                    color: 'green'
                },
                {
                    href: '/miraen/grammar-search',
                    title: '영문법 검색형 챗봇',
                    description: '영문법을 쉽게 검색해보세요',
                    icon: 'search',
                    color: 'purple'
                },
                {
                    href: '/miraen/pronunciation',
                    title: '영어 발음 평가',
                    description: '영어 발음을 평가하고 교정받아보세요',
                    icon: 'record_voice_over',
                    color: 'orange'
                }
            ]
        }
    ];
</script>

<div class="space-y-8">
    {#each englishSections as section}
        <div>
            <h3 class="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                <span class="material-symbols-rounded mr-2">{section.icon}</span>
                {section.title}
            </h3>
            <div class="grid gap-6 md:grid-cols-3">
                {#each section.features as feature}
                    <FeatureCard {...feature} />
                {/each}
            </div>
        </div>
    {/each}
</div> 