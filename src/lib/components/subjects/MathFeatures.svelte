<!-- src/lib/components/subjects/MathFeatures.svelte -->
<script lang="ts">
    import type { FeatureSection } from '$lib/types/feature';
    import FeatureCard from '../FeatureCard.svelte';

    const mathSections: FeatureSection[] = [
        {
            title: 'AI 튜터',
            icon: 'smart_toy',
            features: [
                {
                    href: '/miraen/middle-math',
                    title: '문항 힌트 제공(중학교)',
                    description: '맞춤형 수학 문제 힌트를 받아보세요',
                    icon: 'functions',
                    color: 'orange'
                },
                {
                    href: '/miraen/middle-math-pro/adaptive-chat',
                    title: '맞춤형 답변 챗봇',
                    description: '컨텐츠 관련, 학습팁/정서관리, 금칙어 설정 등에 따라 답변을 분석하여 알맞은 답변을 제공합니다',
                    icon: 'chat',
                    color: 'green'
                },
                {
                    href: '/miraen/middle-math-pro/persona-chat',
                    title: '페르소나별 피드백 챗봇',
                    description: '학습자의 페르소나별로 달라지는 학습팁과 정서지원 답변을 확인하세요',
                    icon: 'person',
                    color: 'purple'
                }
            ]
        },
        {
            title: '대시보드 및 학습 모니터링',
            icon: 'monitoring',
            features: [
                {
                    href: '/miraen/middle-math-pro/learning-comments',
                    title: '학습 평어 생성 기능',
                    description: '학습자의 단원별 성취를 바탕으로 정성적인 학습분석 결과를 생성합니다',
                    icon: 'description',
                    color: 'purple'
                },
                {
                    href: '/miraen/middle-math-pro/student-alerts',
                    title: '학습자 알림 기능',
                    description: '문제를 풀지 않고 답안을 제출했거나, 성취도와 참여도가 떨어진 학생을 감지합니다',
                    icon: 'notifications',
                    color: 'orange'
                }
            ]
        }
    ];
</script>

<div class="space-y-8">
    {#each mathSections as section}
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