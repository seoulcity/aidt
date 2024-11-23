<!-- src/routes/admin/[subject]/students/+page.svelte -->
<script>
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { loading } from '$lib/stores/loading';
    import { getStudents } from '$lib/api/students';
    import PageContainer from '$lib/components/admin/PageContainer.svelte';
    import PageHeader from '$lib/components/admin/PageHeader.svelte';
    import StudentFilters from '$lib/components/admin/students/StudentFilters.svelte';
    import StudentTable from '$lib/components/admin/students/StudentTable.svelte';
    import StudentModal from '$lib/components/admin/students/StudentModal.svelte';
    
    let students = [];
    let filterValues = {
        searchTerm: '',
        grade: '',
        class: ''
    };

    let showModal = false;
    let selectedStudent = null;

    async function loadStudents() {
        try {
            $loading = true;
            students = await getStudents($page.params.subject);
        } catch (error) {
            console.error('Failed to load students:', error);
        } finally {
            $loading = false;
        }
    }

    function handleCreateClick() {
        selectedStudent = null;
        showModal = true;
    }

    function handleEditClick(student) {
        selectedStudent = student;
        showModal = true;
    }

    function handleModalClose() {
        showModal = false;
        selectedStudent = null;
    }

    onMount(loadStudents);

    $: filteredStudents = students.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(filterValues.searchTerm.toLowerCase()) || 
                            student.id.toString().includes(filterValues.searchTerm);
        const matchesGrade = !filterValues.grade || student.grade === filterValues.grade;
        const matchesClass = !filterValues.class || student.class === filterValues.class;
        
        return matchesSearch && matchesGrade && matchesClass;
    });
</script>

<PageContainer>
    <PageHeader 
        title="학생 관리" 
        buttonText="새 학생 추가"
        onButtonClick={handleCreateClick}
    />
    <StudentFilters bind:values={filterValues} />
    <StudentTable 
        students={filteredStudents}
        on:edit={e => handleEditClick(e.detail)}
        on:delete={() => loadStudents()}
    />
    <StudentModal
        show={showModal}
        student={selectedStudent}
        subjectId={$page.params.subject}
        on:close={handleModalClose}
        on:success={() => {
            handleModalClose();
            loadStudents();
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