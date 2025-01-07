<script>
    import { createEventDispatcher } from 'svelte';
    import AssessmentForm from './AssessmentForm.svelte';

    export let show = false;
    export let assessment = null;
    export let subjectId;

    const dispatch = createEventDispatcher();

    function handleClose() {
        dispatch('close');
    }

    function handleSuccess() {
        dispatch('success');
        handleClose();
    }
</script>

{#if show}
    <div class="fixed inset-0 z-50 overflow-y-auto">
        <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 transition-opacity" on:click={handleClose}>
                <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div class="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div class="px-4 pt-5 pb-4 bg-white sm:p-6 sm:pb-4">
                    <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4">
                        {assessment ? '평가 수정' : '새 평가 생성'}
                    </h3>
                    <AssessmentForm
                        {assessment}
                        {subjectId}
                        isEdit={!!assessment}
                        on:success={handleSuccess}
                        on:cancel={handleClose}
                        on:error
                    />
                </div>
            </div>
        </div>
    </div>
{/if} 