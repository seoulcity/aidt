<script>
    import { onMount } from 'svelte';
    import { createEventDispatcher } from 'svelte';
    import { loading } from '$lib/stores/loading';
    import { createAssessment, updateAssessment } from '$lib/api/assessments';
    import { getAssessmentTypes } from '$lib/api/assessmentTypes';

    export let assessment = null;
    export let subjectId;
    export let isEdit = false;

    let assessmentTypes = [];
    let assessmentData = assessment ? { ...assessment } : {
        title: '',
        description: '',
        type: '',
        question_count: 0,
        start_date: null,
        end_date: null,
        status: 'draft'
    };

    onMount(async () => {
        try {
            assessmentTypes = await getAssessmentTypes();
            
            // 기존 데이터의 날짜를 input[type="datetime-local"]에 맞는 형식으로 변환
            if (assessment) {
                if (assessment.start_date) {
                    assessmentData.start_date = new Date(assessment.start_date)
                        .toISOString().slice(0, 16);
                }
                if (assessment.end_date) {
                    assessmentData.end_date = new Date(assessment.end_date)
                        .toISOString().slice(0, 16);
                }
            }
        } catch (error) {
            console.error('Failed to load assessment types:', error);
        }
    });

    const dispatch = createEventDispatcher();

    async function handleSubmit() {
        try {
            $loading = true;
            const data = {
                ...assessmentData,
                subject_id: subjectId,
                // 날짜가 비어있으면 null로 설정
                start_date: assessmentData.start_date || null,
                end_date: assessmentData.end_date || null
            };

            if (isEdit) {
                await updateAssessment(assessmentData.id, data);
            } else {
                await createAssessment(data);
            }
            
            dispatch('success');
        } catch (error) {
            console.error('Failed to save assessment:', error);
            dispatch('error', error);
        } finally {
            $loading = false;
        }
    }

    // assessment prop이 변경될 때마다 assessmentData 업데이트
    $: if (assessment) {
        assessmentData = { 
            ...assessment,
            start_date: assessment.start_date ? 
                new Date(assessment.start_date).toISOString().slice(0, 16) : null,
            end_date: assessment.end_date ? 
                new Date(assessment.end_date).toISOString().slice(0, 16) : null
        };
    }
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-6">
    <div>
        <label class="block text-sm font-medium text-gray-700">제목</label>
        <input
            type="text"
            bind:value={assessmentData.title}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            required
        />
    </div>

    <div>
        <label class="block text-sm font-medium text-gray-700">설명</label>
        <textarea
            bind:value={assessmentData.description}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            rows="3"
        ></textarea>
    </div>

    <div>
        <label class="block text-sm font-medium text-gray-700">유형</label>
        <select
            bind:value={assessmentData.type}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            required
        >
            <option value="">선택하세요</option>
            {#each assessmentTypes as type}
                <option value={type.id}>{type.name}</option>
            {/each}
        </select>
    </div>

    <div>
        <label class="block text-sm font-medium text-gray-700">문항 수</label>
        <input
            type="number"
            bind:value={assessmentData.question_count}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            min="0"
        />
    </div>

    <div class="grid grid-cols-2 gap-4">
        <div>
            <label class="block text-sm font-medium text-gray-700">시작일</label>
            <input
                type="datetime-local"
                bind:value={assessmentData.start_date}
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700">종료일</label>
            <input
                type="datetime-local"
                bind:value={assessmentData.end_date}
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
        </div>
    </div>

    <div>
        <label class="block text-sm font-medium text-gray-700">상태</label>
        <select
            bind:value={assessmentData.status}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        >
            <option value="draft">임시저장</option>
            <option value="published">출제됨</option>
            <option value="completed">완료됨</option>
        </select>
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