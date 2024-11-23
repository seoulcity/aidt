<script>
    import DataTable from '$lib/components/common/DataTable.svelte';
    
    export let students = [];

    const columns = [
        { key: 'id', label: '학번' },
        { key: 'name', label: '이름' },
        { 
            key: 'gradeClass', 
            label: '학년/반',
            format: (_, row) => row?.grade && row?.class ? 
                `${row.grade}학년 ${row.class}반` : '-'
        }
    ];

    const actions = [
        { 
            label: '상세보기', 
            class: 'text-blue-600 hover:text-blue-800',
            handler: (student) => console.log('상세보기:', student)
        }
    ];
</script>

<DataTable
    columns={columns}
    data={students}
    actions={actions}
/> 