// src/lib/data/dashboard.js
export const dashboardModules = [
    {
        title: '학습 진행 현황',
        type: 'progress',
        components: [
            {
                name: '학습 목표 시간',
                value: '80%',
                status: 'good', // good, warning, alert
                message: '목표 시간을 잘 지키고 있어요!'
            },
            {
                name: '이번 주 학습량',
                value: '75%',
                trend: 'up'
            }
        ]
    },
    {
        title: '최근 학습 분석',
        type: 'analysis',
        components: [
            {
                subject: '수와 연산',
                strength: ['분수의 덧셈', '소수점 계산'],
                weakness: ['분수의 나눗셈'],
                recommendedContent: ['분수 나눗셈 심화학습']
            }
        ]
    }
];

export const contentModules = [
    {
        title: '학습 컨텐츠',
        type: 'learning',
        cards: [
            {
                title: '기초 개념',
                description: '핵심 개념 학습',
                progress: 80,
                aiSupport: ['용어 사전', '요약 정리']
            },
            {
                title: '심화 학습',
                description: '응용 문제 풀이',
                progress: 60,
                aiSupport: ['문제 추천', '힌트 제공']
            }
        ]
    },
    {
        title: '실험/탐구',
        type: 'experiment',
        cards: [
            {
                title: '가상 실험실',
                description: '기체 압력 실험',
                status: 'available',
                aiSupport: ['실험 가이드', '결과 분석']
            }
        ]
    }
];

export const assessmentModules = [
    {
        title: '진단평가',
        type: 'diagnostic',
        status: 'pending',
        components: [
            {
                type: 'multiple-choice',
                count: 10,
                timeLimit: 20
            },
            {
                type: 'written',
                count: 2,
                aiSupport: ['답안 분석', '피드백 제공']
            }
        ]
    }
]; 