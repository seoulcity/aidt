<!-- src/routes/admin/[subject]/assessments/+page.svelte -->
<script>
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { loading } from '$lib/stores/loading';
    import { getAssessments } from '$lib/api/assessments';
    import PageContainer from '$lib/components/admin/PageContainer.svelte';
    import PageHeader from '$lib/components/admin/PageHeader.svelte';
    import AssessmentFilters from '$lib/components/admin/assessments/AssessmentFilters.svelte';
    import AssessmentTable from '$lib/components/admin/assessments/AssessmentTable.svelte';
    import AssessmentModal from '$lib/components/admin/assessments/AssessmentModal.svelte';
    
    let assessments = [];
    let filterValues = {
        searchTerm: '',
        type: '',
        status: ''
    };

    let showModal = false;
    let selectedAssessment = null;

    async function loadAssessments() {
        try {
            $loading = true;
            assessments = await getAssessments($page.params.subject);
        } catch (error) {
            console.error('Failed to load assessments:', error);
        } finally {
            $loading = false;
        }
    }

    function handleCreateClick() {
        selectedAssessment = null;
        showModal = true;
    }

    function handleEditClick(assessment) {
        selectedAssessment = assessment;
        showModal = true;
    }

    function handleModalClose() {
        showModal = false;
        selectedAssessment = null;
    }

    onMount(loadAssessments);

    $: filteredAssessments = assessments.filter(assessment => {
        const matchesSearch = assessment.title.toLowerCase().includes(filterValues.searchTerm.toLowerCase()) || 
                            assessment.description?.toLowerCase().includes(filterValues.searchTerm.toLowerCase());
        const matchesType = !filterValues.type || assessment.type === filterValues.type;
        const matchesStatus = !filterValues.status || assessment.status === filterValues.status;
        
        return matchesSearch && matchesType && matchesStatus;
    });
</script>

<PageContainer>
    <PageHeader 
        title="평가 관리" 
        buttonText="새 평가 추가"
        onButtonClick={handleCreateClick}
    />
    <AssessmentFilters bind:values={filterValues} />
    <AssessmentTable 
        assessments={filteredAssessments}
        on:edit={e => handleEditClick(e.detail)}
        on:delete={() => loadAssessments()}
    />
    <AssessmentModal
        show={showModal}
        assessment={selectedAssessment}
        subjectId={$page.params.subject}
        on:close={handleModalClose}
        on:success={() => {
            handleModalClose();
            loadAssessments();
        }}
    />
</PageContainer>

{#if $loading}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div class="bg-white p-4 rounded-lg">
            Loading...
        </div>
    </div>
{/if} 