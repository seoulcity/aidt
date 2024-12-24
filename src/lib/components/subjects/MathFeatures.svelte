<!-- src/lib/components/subjects/MathFeatures.svelte -->
<script lang="ts">
    import type { FeatureSection } from '$lib/types/feature';
    import FeatureCard from '../FeatureCard.svelte';

    const mathSections: FeatureSection[] = [
        {
            title: '맞춤 학습 지원',
            icon: 'psychology',
            features: [
                {
                    href: '/miraen/middle-math',
                    title: '문항 힌트 제공(중학교)',
                    description: '맞춤형 수학 문제 힌트를 받아보세요',
                    icon: 'functions',
                    color: 'orange'
                },
                {
                    href: '/miraen/middle-math-pro',
                    title: '수준별 문항 추천 시스템(중학교)',
                    description: '성취 수준에 따라 다른 난이도/틀린 개념 문항 추천(IRT 기반)',
                    icon: 'analytics',
                    color: 'blue'
                },
                {
                    title: '유사 문항 제공',
                    description: '특정 문항에 대한 유사 문항을 받아보세요',
                    icon: 'content_copy',
                    disabled: true
                },
                {
                    title: '손글씨 풀이 피드백',
                    description: '수식이 포함된 손글씨 풀이에 피드백과 힌트를 제공합니다',
                    icon: 'draw',
                    disabled: true
                },
                {
                    title: '초등 수학',
                    description: '초등수학 학습 현황을 확인해보세요',
                    icon: 'dashboard',
                    disabled: true
                }
            ]
        },
        {
            title: 'AI 튜터',
            icon: 'smart_toy',
            features: [
                {
                    title: '맞춤형 답변 챗봇',
                    description: '컨텐츠 관련, 학습팁/정서관리, 금칙어 설정 등에 따라 답변을 분석하여 알맞은 답변을 제공합니다',
                    icon: 'chat',
                    disabled: true
                },
                {
                    href: '/miraen/middle-math-pro/chat',
                    title: '컨텐츠 및 문제 챗봇',
                    description: '컨텐츠와 문항별로 달라지는 답변을 확인하세요',
                    icon: 'quiz',
                    color: 'purple'
                },
                {
                    title: '페르소나별 피드백 챗봇',
                    description: '학습자의 페르소나별로 달라지는 학습팁과 정서지원 답변을 확인하세요',
                    icon: 'person',
                    disabled: true
                },
                {
                    title: '챗봇 답변 관리',
                    description: '학습과 무관하거나 비윤리적인 답변, 금칙어 설정을 직접 관리해보세요',
                    icon: 'settings',
                    disabled: true
                }
            ]
        },
        {
            title: '대시보드 및 학습 모니터링',
            icon: 'monitoring',
            features: [
                {
                    title: '학습 평어 생성 기능',
                    description: '학습자의 단원별 성취를 바탕으로 정성적인 학습분석 결과를 생성합니다',
                    icon: 'description',
                    disabled: true
                },
                {
                    title: '학습자 알림 기능',
                    description: '문제를 풀지 않고 답안을 제출했거나, 성취도와 참여도가 떨어진 학생을 감지합니다',
                    icon: 'notifications',
                    disabled: true
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