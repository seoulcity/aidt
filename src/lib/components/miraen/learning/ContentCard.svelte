<script>
    export let card;
</script>

<div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
    <h3 class="text-lg font-medium mb-2">{card.title}</h3>
    <p class="text-gray-600 mb-4">{card.description}</p>
    {#if card.progress !== undefined}
        <div class="mb-4">
            <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-green-600 h-2 rounded-full" 
                     style="width: {card.progress}%"></div>
            </div>
        </div>
    {/if}
    <div class="flex flex-wrap gap-2">
        {#each card.aiSupport as support}
            <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                {support}
            </span>
        {/each}
    </div>
</div> 