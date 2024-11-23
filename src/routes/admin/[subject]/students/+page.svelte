<!-- src/routes/admin/[subject]/students/+page.svelte -->
<script>
    import { page } from '$app/stores';
    import { students } from '$lib/data/admin';
    import PageContainer from '$lib/components/admin/PageContainer.svelte';
    import PageHeader from '$lib/components/admin/PageHeader.svelte';
    import StudentFilters from '$lib/components/admin/students/StudentFilters.svelte';
    import StudentTable from '$lib/components/admin/students/StudentTable.svelte';
    
    let filterValues = {
        searchTerm: '',
        grade: '',
        class: ''
    };

    $: filteredStudents = students.filter(student => {
        const matchesSearch = student.name.includes(filterValues.searchTerm) || 
                            student.id.toString().includes(filterValues.searchTerm);
        const matchesGrade = !filterValues.grade || student.grade === filterValues.grade;
        const matchesClass = !filterValues.class || student.class === filterValues.class;
        const matchesSubject = student.subjects.includes($page.params.subject);
        
        return matchesSearch && matchesGrade && matchesClass && matchesSubject;
    });
</script>

<PageContainer>
    <PageHeader title="학생 관리" />
    <StudentFilters bind:values={filterValues} />
    <StudentTable students={filteredStudents} />
</PageContainer> 