<script>
    import SearchFilters from '$lib/components/common/SearchFilters.svelte';
    import { contentTypes } from '$lib/data/admin';

    export let values;

    const filters = [
        {
            key: 'type',
            placeholder: '유형 선택',
            options: contentTypes.map(type => ({
                value: type.id,
                label: type.name
            }))
        },
        {
            key: 'level',
            placeholder: '난이도 선택',
            options: [
                { value: 'basic', label: '기초' },
                { value: 'intermediate', label: '중급' },
                { value: 'advanced', label: '심화' }
            ]
        }
    ];
</script>

<SearchFilters
    {filters}
    bind:values
    searchPlaceholder="컨텐츠 검색..."
/> 