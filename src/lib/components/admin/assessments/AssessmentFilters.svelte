<script>
    import SearchFilters from '$lib/components/common/SearchFilters.svelte';
    import { assessmentTypes } from '$lib/data/admin';

    export let values;

    const filters = [
        {
            key: 'type',
            placeholder: '유형 선택',
            options: assessmentTypes.map(type => ({
                value: type.id,
                label: type.name
            }))
        },
        {
            key: 'status',
            placeholder: '상태 선택',
            options: [
                { value: 'draft', label: '임시저장' },
                { value: 'published', label: '출제됨' },
                { value: 'completed', label: '완료됨' }
            ]
        }
    ];
</script>

<SearchFilters
    {filters}
    bind:values
    searchPlaceholder="평가 검색..."
/> 