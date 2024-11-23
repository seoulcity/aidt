<!-- src/routes/miraen/elementary-math/+page.svelte -->
<script>
    import { dashboardModules, contentModules, assessmentModules } from '$lib/data/dashboard';
    import MiraenNav from '$lib/components/miraen/layout/MiraenNav.svelte';
    import ProgressModule from '$lib/components/miraen/dashboard/ProgressModule.svelte';
    import ContentCard from '$lib/components/miraen/learning/ContentCard.svelte';
    import AssessmentModule from '$lib/components/miraen/assessment/AssessmentModule.svelte';

    let activeTab = 'dashboard';
</script>

<div class="container mx-auto px-4 py-8">
    <MiraenNav bind:activeTab />

    {#if activeTab === 'dashboard'}
        <section class="mb-12">
            <h2 class="text-xl font-semibold mb-6">학습 현황 대시보드</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {#each dashboardModules as module}
                    {#if module.type === 'progress'}
                        <ProgressModule {module} />
                    {/if}
                {/each}
            </div>
        </section>
    {/if}

    {#if activeTab === 'learning'}
        <section class="mb-12">
            <h2 class="text-xl font-semibold mb-6">학습 컨텐츠</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {#each contentModules as module}
                    {#each module.cards as card}
                        <ContentCard {card} />
                    {/each}
                {/each}
            </div>
        </section>
    {/if}

    {#if activeTab === 'assessment'}
        <section>
            <h2 class="text-xl font-semibold mb-6">평가</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                {#each assessmentModules as module}
                    <AssessmentModule {module} />
                {/each}
            </div>
        </section>
    {/if}
</div> 