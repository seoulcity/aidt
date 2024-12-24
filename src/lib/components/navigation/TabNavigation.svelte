<!-- src/lib/components/navigation/TabNavigation.svelte -->
<script lang="ts">
    import type { TabItem } from '$lib/types/navigation';

    export let tabs: TabItem[];
    export let activeTab: string;
    export let onTabChange: (tabId: string) => void;
</script>

<nav class="max-w-6xl mx-auto mb-8">
    <div class="border-b border-gray-200">
        <ul class="flex flex-wrap -mb-px text-sm font-medium text-center text-gray-500">
            {#each tabs as tab}
                <li class="flex-1">
                    <button
                        class="inline-flex items-center justify-center p-4 w-full border-b-2 
                            {activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent'} 
                            hover:text-gray-600 hover:border-gray-300 group"
                        on:click={() => onTabChange(tab.id)}
                    >
                        <span class="material-symbols-rounded mr-2">{tab.icon}</span>
                        {tab.title}
                        <span class="bg-{tab.countColor || 'gray'}-100 text-{tab.countColor || 'gray'}-600 
                            text-xs font-medium px-2 py-0.5 rounded-full ml-2">{tab.count}</span>
                    </button>
                </li>
            {/each}
        </ul>
    </div>
</nav> 