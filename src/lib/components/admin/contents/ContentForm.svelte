<script>
    import { onMount } from 'svelte';
    import { createEventDispatcher } from 'svelte';
    import { loading } from '$lib/stores/loading';
    import { createContent, updateContent } from '$lib/api/contents';
    import { getContentTypes } from '$lib/api/contentTypes';

    export let content = null;
    export let subjectId;
    export let isEdit = false;

    let contentTypes = [];
    let contentData = content ? { ...content } : {
        title: '',
        description: '',
        type: '',
        level: 'basic',
        status: 'draft'
    };

    onMount(async () => {
        try {
            contentTypes = await getContentTypes();
        } catch (error) {
            console.error('Failed to load content types:', error);
        }
    });

    const dispatch = createEventDispatcher();

    async function handleSubmit() {
        try {
            $loading = true;
            const data = {
                ...contentData,
                subject_id: subjectId
            };

            if (isEdit) {
                await updateContent(contentData.id, data);
            } else {
                await createContent(data);
            }
            
            dispatch('success');
        } catch (error) {
            console.error('Failed to save content:', error);
            dispatch('error', error);
        } finally {
            $loading = false;
        }
    }

    // content prop이 변경될 때마다 contentData 업데이트
    $: if (content) {
        contentData = { ...content };
    }
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-6">
    <div>
        <label class="block text-sm font-medium text-gray-700">제목</label>
        <input
            type="text"
            bind:value={contentData.title}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            required
        />
    </div>

    <div>
        <label class="block text-sm font-medium text-gray-700">설명</label>
        <textarea
            bind:value={contentData.description}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            rows="3"
        ></textarea>
    </div>

    <div>
        <label class="block text-sm font-medium text-gray-700">유형</label>
        <select
            bind:value={contentData.type}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            required
        >
            <option value="">선택하세요</option>
            {#each contentTypes as type}
                <option value={type.id}>{type.name}</option>
            {/each}
        </select>
    </div>

    <div>
        <label class="block text-sm font-medium text-gray-700">난이도</label>
        <select
            bind:value={contentData.level}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        >
            <option value="basic">기초</option>
            <option value="intermediate">중급</option>
            <option value="advanced">심화</option>
        </select>
    </div>

    <div>
        <label class="block text-sm font-medium text-gray-700">상태</label>
        <select
            bind:value={contentData.status}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        >
            <option value="draft">임시저장</option>
            <option value="published">공개</option>
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