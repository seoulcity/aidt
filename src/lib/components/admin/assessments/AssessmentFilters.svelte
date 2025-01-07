<script>
    import { onMount } from 'svelte';
    import SearchFilters from '$lib/components/common/SearchFilters.svelte';
    import { getAssessmentTypes } from '$lib/api/assessmentTypes';

    export let values;
    let assessmentTypes = [];

    onMount(async () => {
        try {
            assessmentTypes = await getAssessmentTypes();
        } catch (error) {
            console.error('Failed to load assessment types:', error);
        }
    });

    $: filters = [
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