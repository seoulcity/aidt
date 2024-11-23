<script>
    import { createEventDispatcher } from 'svelte';
    import DataTable from '$lib/components/common/DataTable.svelte';
    import { deleteStudent } from '$lib/api/students';
    
    export let students = [];
    
    const dispatch = createEventDispatcher();

    async function handleDelete(student) {
        if (confirm('정말 삭제하시겠습니까?')) {
            try {
                await deleteStudent(student.id);
                dispatch('delete', student);
            } catch (error) {
                console.error('Failed to delete student:', error);
            }
        }
    }

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
            label: '수정', 
            class: 'text-blue-600 hover:text-blue-800',
            handler: (student) => dispatch('edit', student)
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
    data={students}
    actions={actions}
/> 