<script>
    export let cards = [];
    export let cols = 3;
</script>

<div class="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-{cols}">
    {#each cards as card}
        <div class="border rounded-lg p-4 hover:shadow-lg transition-shadow">
            <div class="flex justify-between items-start mb-3">
                <h3 class="text-lg font-medium">{card.title}</h3>
                {#if card.badge}
                    <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {card.badge}
                    </span>
                {/if}
            </div>
            <p class="text-gray-600 text-sm mb-4">{card.description}</p>
            {#if card.footer}
                <div class="flex justify-between items-center">
                    <slot name="footer" {card}>
                        {card.footer}
                    </slot>
                </div>
            {/if}
        </div>
    {/each}
</div> 