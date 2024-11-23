<script>
    import SearchFilters from '$lib/components/common/SearchFilters.svelte';

    export let values;

    const filters = [
        {
            key: 'grade',
            placeholder: '학년 선택',
            options: [
                { value: '1', label: '1학년' },
                { value: '2', label: '2학년' },
                { value: '3', label: '3학년' }
            ]
        },
        {
            key: 'class',
            placeholder: '반 선택',
            options: [
                { value: '1', label: '1반' },
                { value: '2', label: '2반' },
                { value: '3', label: '3반' }
            ]
        }
    ];
</script>

<SearchFilters
    {filters}
    bind:values
    searchPlaceholder="학생 검색..."
/> 