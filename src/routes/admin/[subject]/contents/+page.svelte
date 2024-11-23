<!-- src/routes/admin/[subject]/contents/+page.svelte -->
<script>
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { loading } from '$lib/stores/loading';
    import { getContents } from '$lib/api/contents';
    import PageContainer from '$lib/components/admin/PageContainer.svelte';
    import PageHeader from '$lib/components/admin/PageHeader.svelte';
    import ContentFilters from '$lib/components/admin/contents/ContentFilters.svelte';
    import ContentGrid from '$lib/components/admin/contents/ContentGrid.svelte';
    import ContentModal from '$lib/components/admin/contents/ContentModal.svelte';
    
    let contents = [];
    let filterValues = {
        searchTerm: '',
        type: '',
        level: ''
    };

    let showModal = false;
    let selectedContent = null;

    async function loadContents() {
        try {
            $loading = true;
            contents = await getContents($page.params.subject);
        } catch (error) {
            console.error('Failed to load contents:', error);
        } finally {
            $loading = false;
        }
    }

    function handleCreateClick() {
        selectedContent = null;
        showModal = true;
    }

    function handleEditClick(content) {
        selectedContent = content;
        showModal = true;
    }

    function handleModalClose() {
        showModal = false;
        selectedContent = null;
    }

    onMount(loadContents);

    $: filteredContents = contents.filter(content => {
        const matchesSearch = content.title.toLowerCase().includes(filterValues.searchTerm.toLowerCase()) || 
                            content.description?.toLowerCase().includes(filterValues.searchTerm.toLowerCase());
        const matchesType = !filterValues.type || content.type === filterValues.type;
        const matchesLevel = !filterValues.level || content.level === filterValues.level;
        
        return matchesSearch && matchesType && matchesLevel;
    });
</script>

<PageContainer>
    <PageHeader 
        title="컨텐츠 관리" 
        buttonText="새 컨텐츠 추가"
        onButtonClick={handleCreateClick}
    />
    <ContentFilters bind:values={filterValues} />
    <ContentGrid 
        contents={filteredContents}
        on:edit={e => handleEditClick(e.detail)}
    />
    <ContentModal
        show={showModal}
        content={selectedContent}
        subjectId={$page.params.subject}
        on:close={handleModalClose}
        on:success={() => {
            handleModalClose();
            loadContents();
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