<script>
    import CardGrid from '$lib/components/common/CardGrid.svelte';
    import { contentTypes } from '$lib/data/admin';
    
    export let contents = [];

    $: cards = contents.map(content => {
        const type = contentTypes.find(t => t.id === content.type);
        return {
            title: content.title,
            description: content.description || '',
            badge: type?.name || content.type,
            footer: `난이도: ${content.level || '-'}`,
            actions: [
                { label: '수정', class: 'text-blue-600 hover:text-blue-800' },
                { label: '삭제', class: 'text-red-600 hover:text-red-800' }
            ]
        };
    });
</script>

<CardGrid {cards}>
    <div slot="footer" let:card>
        <span class="text-sm text-gray-500">{card.footer}</span>
        <div class="space-x-2">
            {#each card.actions as action}
                <button class={action.class}>{action.label}</button>
            {/each}
        </div>
    </div>
</CardGrid> 