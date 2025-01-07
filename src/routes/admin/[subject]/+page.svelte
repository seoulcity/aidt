<!-- src/routes/admin/[subject]/+page.svelte -->s
<script>
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import LoadingSpinner from '$lib/components/common/LoadingSpinner.svelte';

    onMount(() => {
        goto(`/admin/${$page.params.subject}/students`);
    });
</script>

<div class="flex items-center justify-center p-8">
    <LoadingSpinner />
</div> 