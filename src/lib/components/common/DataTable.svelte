<script>
    export let columns = [];
    export let data = [];
    export let actions = null;
</script>

<div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200">
        <thead>
            <tr>
                {#each columns as column}
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {column.label}
                    </th>
                {/each}
                {#if actions}
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        관리
                    </th>
                {/if}
            </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
            {#each data as row}
                <tr>
                    {#each columns as column}
                        <td class="px-6 py-4 whitespace-nowrap">
                            {#if column.format}
                                {@html column.format(row[column.key])}
                            {:else}
                                {row[column.key]}
                            {/if}
                        </td>
                    {/each}
                    {#if actions}
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            {#each actions as action}
                                <button 
                                    class={action.class}
                                    on:click={() => action.handler(row)}
                                >
                                    {action.label}
                                </button>
                            {/each}
                        </td>
                    {/if}
                </tr>
            {/each}
        </tbody>
    </table>
</div> 