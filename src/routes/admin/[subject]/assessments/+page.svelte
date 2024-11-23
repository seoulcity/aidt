<!-- src/routes/admin/[subject]/assessments/+page.svelte -->
<script>
    import { page } from '$app/stores';
    import { assessments } from '$lib/data/admin';
    import PageContainer from '$lib/components/admin/PageContainer.svelte';
    import PageHeader from '$lib/components/admin/PageHeader.svelte';
    import AssessmentFilters from '$lib/components/admin/assessments/AssessmentFilters.svelte';
    import AssessmentTable from '$lib/components/admin/assessments/AssessmentTable.svelte';
    
    let filterValues = {
        searchTerm: '',
        type: '',
        status: ''
    };

    $: filteredAssessments = assessments.filter(assessment => {
        const matchesSearch = assessment.title.includes(filterValues.searchTerm) || 
                            assessment.description.includes(filterValues.searchTerm);
        const matchesType = !filterValues.type || assessment.type === filterValues.type;
        const matchesStatus = !filterValues.status || assessment.status === filterValues.status;
        const matchesSubject = assessment.subject === $page.params.subject;
        
        return matchesSearch && matchesType && matchesStatus && matchesSubject;
    });
</script>

<PageContainer>
    <PageHeader 
        title="평가 관리" 
        buttonText="새 평가 추가"
        onButtonClick={() => console.log('새 평가 추가')}
    />
    <AssessmentFilters bind:values={filterValues} />
    <AssessmentTable assessments={filteredAssessments} />
</PageContainer> 