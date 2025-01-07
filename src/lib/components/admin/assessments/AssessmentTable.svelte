<script>
    import { onMount, createEventDispatcher } from 'svelte';
    import DataTable from '$lib/components/common/DataTable.svelte';
    import { getAssessmentTypes } from '$lib/api/assessmentTypes';
    import { deleteAssessment } from '$lib/api/assessments';
    
    export let assessments = [];
    
    let assessmentTypes = [];
    const dispatch = createEventDispatcher();

    onMount(async () => {
        try {
            assessmentTypes = await getAssessmentTypes();
        } catch (error) {
            console.error('Failed to load assessment types:', error);
        }
    });

    async function handleDelete(assessment) {
        if (confirm('정말 삭제하시겠습니까?')) {
            try {
                await deleteAssessment(assessment.id);
                dispatch('delete', assessment);
            } catch (error) {
                console.error('Failed to delete assessment:', error);
            }
        }
    }

    const columns = [
        { key: 'title', label: '제목' },
        { 
            key: 'type', 
            label: '유형',
            format: (value) => {
                const type = assessmentTypes.find(t => t.id === value);
                return type?.name || value;
            }
        },
        { 
            key: 'question_count', 
            label: '문항 수', 
            format: value => value ? `${value}문항` : '-'
        },
        { 
            key: 'status', 
            label: '상태',
            format: (value) => {
                const statusMap = {
                    'published': '출제됨',
                    'draft': '임시저장',
                    'completed': '완료됨'
                };
                const colorMap = {
                    'published': 'green',
                    'draft': 'gray',
                    'completed': 'blue'
                };
                const status = statusMap[value] || value;
                const color = colorMap[value] || 'gray';
                
                return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-${color}-100 text-${color}-800">
                    ${status}
                </span>`;
            }
        }
    ];

    const actions = [
        { 
            label: '수정', 
            class: 'text-blue-600 hover:text-blue-800',
            handler: (assessment) => dispatch('edit', assessment)
        },
        { 
            label: '삭제', 
            class: 'text-red-600 hover:text-red-800',
            handler: handleDelete
        }
    ];
</script>

<DataTable
    columns={columns}
    data={assessments}
    {actions}
/> 