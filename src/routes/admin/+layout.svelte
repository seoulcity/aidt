<!-- src/routes/admin/+layout.svelte -->
<script>
    import { page } from '$app/stores';
    import AdminLayout from '$lib/components/admin/layout/AdminLayout.svelte';
    import AdminNav from '$lib/components/admin/layout/AdminNav.svelte';
    
    const subjectTitles = {
        'elementary-math': '초등수학',
        'elementary-english': '초등영어',
        'common-english': '공통영어'
    };

    $: currentSubject = $page.params.subject ? subjectTitles[$page.params.subject] : '';
    $: isSubjectRoute = !!$page.params.subject;
</script>

<AdminLayout>
    <AdminNav 
        slot="nav"
        {currentSubject}
        {isSubjectRoute}
    />
    <slot />
</AdminLayout> 