<script>
    import { createEventDispatcher } from 'svelte';
    import { loading } from '$lib/stores/loading';
    import { createStudent, updateStudent } from '$lib/api/students';

    export let student = null;
    export let subjectId;
    export let isEdit = false;

    // 학생 정보 초기값 설정
    let studentData = student ? { ...student } : {
        name: '',
        grade: '',
        class: '',
        subjects: []
    };

    const dispatch = createEventDispatcher();

    async function handleSubmit() {
        try {
            $loading = true;
            if (isEdit) {
                await updateStudent(studentData.id, {
                    name: studentData.name,
                    grade: studentData.grade,
                    class: studentData.class
                });
            } else {
                await createStudent(
                    {
                        name: studentData.name,
                        grade: studentData.grade,
                        class: studentData.class
                    },
                    [subjectId]
                );
            }
            
            dispatch('success');
        } catch (error) {
            console.error('Failed to save student:', error);
            dispatch('error', error);
        } finally {
            $loading = false;
        }
    }

    // student prop이 변경될 때마다 studentData 업데이트
    $: if (student) {
        studentData = { ...student };
    }
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-6">
    <div>
        <label class="block text-sm font-medium text-gray-700">이름</label>
        <input
            type="text"
            bind:value={studentData.name}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            required
        />
    </div>

    <div class="grid grid-cols-2 gap-4">
        <div>
            <label class="block text-sm font-medium text-gray-700">학년</label>
            <select
                bind:value={studentData.grade}
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                required
            >
                <option value="">선택하세요</option>
                {#each Array(6) as _, i}
                    <option value={i + 1}>{i + 1}학년</option>
                {/each}
            </select>
        </div>

        <div>
            <label class="block text-sm font-medium text-gray-700">반</label>
            <select
                bind:value={studentData.class}
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                required
            >
                <option value="">선택하세요</option>
                {#each Array(10) as _, i}
                    <option value={i + 1}>{i + 1}반</option>
                {/each}
            </select>
        </div>
    </div>

    <div class="flex justify-end space-x-3">
        <button
            type="button"
            on:click={() => dispatch('cancel')}
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
        >
            취소
        </button>
        <button
            type="submit"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
            disabled={$loading}
        >
            {$loading ? '저장 중...' : (isEdit ? '수정' : '생성')}
        </button>
    </div>
</form> 