<script>
    export let module;
</script>

<div class="bg-white rounded-lg shadow-md p-6">
    <h3 class="text-lg font-medium mb-4">{module.title}</h3>
    <div class="space-y-4">
        {#each module.components as component}
            <div class="flex justify-between items-center">
                <span>{component.type}</span>
                <span class="text-sm text-gray-600">
                    {component.count}문항 / {component.timeLimit}분
                </span>
            </div>
        {/each}
    </div>
</div> 