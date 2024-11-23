<!-- src/routes/admin/+page.svelte -->
<script>
    import SubjectCard from '$lib/components/admin/home/SubjectCard.svelte';

    const subjects = [
        {
            id: 'elementary-math',
            title: '초등수학',
            description: '초등학교 수학 학습관리',
            icon: '📐',
            color: 'orange'
        },
        {
            id: 'elementary-english',
            title: '초등영어',
            description: '초등학교 영어 학습관리',
            icon: '📚',
            color: 'green'
        },
        {
            id: 'common-english',
            title: '공통영어',
            description: '중학교 공통 영어 학습관리',
            icon: '✏️',
            color: 'blue'
        }
    ];
</script>

<div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold text-center mb-12">클라시스 관리자</h1>
    
    <div class="max-w-4xl mx-auto grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {#each subjects as subject}
            <SubjectCard {subject} />
        {/each}
    </div>
</div> 