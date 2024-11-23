// src/lib/data/admin.js
export const students = [
    {
        id: 1,
        name: '김철수',
        grade: '5',
        class: '2',
        subjects: ['elementary-math', 'elementary-english'],
        learningTime: 120,
        lastAccess: '2024-03-20',
        progress: {
            math: 75,
            english: 80
        }
    },
    {
        id: 2,
        name: '이영희',
        grade: '5',
        class: '3',
        subjects: ['elementary-math'],
        learningTime: 90,
        lastAccess: '2024-03-19',
        progress: {
            math: 85
        }
    }
];

export const contents = [
    {
        id: 1,
        title: '분수의 덧셈',
        description: '분수의 덧셈을 배워봅시다',
        type: 'basic',
        level: 'basic',
        subject: 'elementary-math',
        lastModified: '2024-03-20',
        status: 'published'
    }
];

export const assessments = [
    {
        id: 1,
        title: '5학년 1학기 중간고사',
        description: '5학년 1학기 중간고사입니다',
        type: 'regular',
        subject: 'elementary-math',
        questionCount: 20,
        startDate: '2024-04-01',
        endDate: '2024-04-07',
        status: 'published'
    }
];

export const contentTypes = [
    { id: 'basic', name: '기초 개념' },
    { id: 'practice', name: '연습 문제' },
    { id: 'advanced', name: '심화 학습' }
];

export const subjects = [
    { id: 'elementary-math', name: '초등 수학' },
    { id: 'elementary-english', name: '초등 영어' },
    { id: 'common-english', name: '공통 영어' }
];

export const assessmentTypes = [
    { id: 'regular', name: '정기평가' },
    { id: 'diagnostic', name: '진단평가' },
    { id: 'formative', name: '형성평가' }
]; 