<script>
    import { onMount } from 'svelte';
    import { createEventDispatcher } from 'svelte';
    import CardGrid from '$lib/components/common/CardGrid.svelte';
    import { deleteContent } from '$lib/api/contents';
    import { getContentTypes } from '$lib/api/contentTypes';
    
    export let contents = [];
    
    let contentTypes = [];
    
    onMount(async () => {
        try {
            contentTypes = await getContentTypes();
        } catch (error) {
            console.error('Failed to load content types:', error);
        }
    });

    const dispatch = createEventDispatcher();

    async function handleDelete(content) {
        if (confirm('정말 삭제하시겠습니까?')) {
            try {
                await deleteContent(content.id);
                dispatch('delete', content);
            } catch (error) {
                console.error('Failed to delete content:', error);
            }
        }
    }

    $: cards = contents.map(content => {
        const type = contentTypes.find(t => t.id === content.type);
        return {
            id: content.id,
            title: content.title,
            description: content.description || '',
            badge: type?.name || content.type,
            footer: `난이도: ${content.level || '-'}`,
            actions: [
                { 
                    label: '수정', 
                    class: 'text-blue-600 hover:text-blue-800',
                    handler: () => dispatch('edit', content)
                },
                { 
                    label: '삭제', 
                    class: 'text-red-600 hover:text-red-800',
                    handler: () => handleDelete(content)
                }
            ]
        };
    });
</script>

<CardGrid {cards}>
    <div slot="footer" let:card>
        <span class="text-sm text-gray-500">{card.footer}</span>
        <div class="space-x-2">
            {#each card.actions as action}
                <button 
                    class={action.class}
                    on:click={() => action.handler(card)}
                >
                    {action.label}
                </button>
            {/each}
        </div>
    </div>
</CardGrid> 