<script>
    import DataTable from '$lib/components/common/DataTable.svelte';
    import { assessmentTypes } from '$lib/data/admin';
    
    export let assessments = [];

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
            key: 'questionCount', 
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
            handler: (assessment) => console.log('수정:', assessment)
        },
        { 
            label: '삭제', 
            class: 'text-red-600 hover:text-red-800',
            handler: (assessment) => console.log('삭제:', assessment)
        }
    ];
</script>

<DataTable
    columns={columns}
    data={assessments}
    actions={actions}
/> 