<!-- src/routes/admin/[subject]/contents/+page.svelte -->
<script>
    import { page } from '$app/stores';
    import { contents } from '$lib/data/admin';
    import PageContainer from '$lib/components/admin/PageContainer.svelte';
    import PageHeader from '$lib/components/admin/PageHeader.svelte';
    import ContentFilters from '$lib/components/admin/contents/ContentFilters.svelte';
    import ContentGrid from '$lib/components/admin/contents/ContentGrid.svelte';
    
    let filterValues = {
        searchTerm: '',
        type: '',
        level: ''
    };

    $: filteredContents = contents.filter(content => {
        const matchesSearch = content.title.includes(filterValues.searchTerm) || 
                            content.description.includes(filterValues.searchTerm);
        const matchesType = !filterValues.type || content.type === filterValues.type;
        const matchesLevel = !filterValues.level || content.level === filterValues.level;
        const matchesSubject = content.subject === $page.params.subject;
        
        return matchesSearch && matchesType && matchesLevel && matchesSubject;
    });
</script>

<PageContainer>
    <PageHeader 
        title="컨텐츠 관리" 
        buttonText="새 컨텐츠 추가"
        onButtonClick={() => console.log('새 컨텐츠 추가')}
    />
    <ContentFilters bind:values={filterValues} />
    <ContentGrid contents={filteredContents} />
</PageContainer> 