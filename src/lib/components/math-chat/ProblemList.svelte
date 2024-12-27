<!-- src/lib/components/math-chat/ProblemList.svelte -->
<script lang="ts">
  import LoadingSpinner from '../common/LoadingSpinner.svelte';
  import LoadingDots from '../common/LoadingDots.svelte';
  import { parseXML } from '../../../routes/miraen/middle-math-pro/utils/xmlParser';
  import { renderElement } from '../../../routes/miraen/middle-math-pro/utils/renderElement';
  export let loading: boolean;
  export let problems: any[];
  export let selectedProblem: any;
  export let selectedActivityType: string = '전체';
  export let activityTypes: string[] = ['전체'];
  export let visibleProblems: any[];
  export let isLoadingMore: boolean;
  export let hasMoreProblems: boolean;

  export let onActivityTypeSelect: (type: string) => void;
  export let onProblemSelect: (problem: any) => void;
  export let onScroll: (event: Event) => void;
</script>

<div class="col-span-4 bg-white rounded-lg shadow-sm border border-gray-100 h-[calc(100vh-8rem)] flex flex-col">
  <div class="p-4 border-b border-gray-100">
    <h2 class="text-lg font-medium text-gray-900">문제 목록</h2>
    <div class="mt-3 flex flex-wrap gap-2">
      {#each activityTypes as type}
        <button
          class="px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 
            {selectedActivityType === type 
              ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-500 ring-offset-2' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
          on:click={() => onActivityTypeSelect(type)}
        >
          {type}
        </button>
      {/each}
    </div>
  </div>
  
  <div class="flex-1 overflow-y-auto p-4" on:scroll={onScroll}>
    {#if loading}
      <LoadingSpinner />
    {:else}
      <div class="space-y-3">
        {#each visibleProblems as problem}
          <button
            class="w-full text-left p-3 rounded-lg transition-colors duration-200 border-2
                   {selectedProblem?.id === problem.id ? 
                     'border-blue-500 bg-blue-50' : 
                     'border-transparent hover:bg-gray-50'}"
            on:click={() => onProblemSelect(problem)}
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-900">
                {problem.episode}
              </span>
              <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {problem.activity_category}
              </span>
            </div>
            <div class="text-sm text-gray-600 line-clamp-2">
              {#each parseXML(problem.problem)
                .filter(el => el.type !== 'input')
                .slice(0, 3) as element}
                {@html renderElement(element)}
              {/each}...
            </div>
          </button>
        {/each}

        {#if isLoadingMore}
          <LoadingDots />
        {/if}

        {#if !hasMoreProblems && visibleProblems.length > 0}
          <div class="py-4 text-center text-gray-500 text-sm">
            모든 문제를 모두 로딩했습니다
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div> 