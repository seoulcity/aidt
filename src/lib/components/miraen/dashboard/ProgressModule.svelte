<script>
    export let module;
</script>

<div class="bg-white rounded-lg shadow-md p-6">
    <h3 class="text-lg font-medium mb-4">{module.title}</h3>
    {#each module.components as component}
        <div class="mb-4">
            <div class="flex justify-between mb-2">
                <span>{component.name}</span>
                <span class="font-medium">{component.value}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-blue-600 h-2 rounded-full" 
                     style="width: {component.value}"></div>
            </div>
        </div>
    {/each}
</div> 