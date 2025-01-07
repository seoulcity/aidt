<script>
    export let filters = [];
    export let searchPlaceholder = "검색...";
    
    // 각 필터의 값을 저장할 객체
    export let values = {};
</script>

<div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-{filters.length + 1}">
    <input
        type="text"
        bind:value={values.searchTerm}
        placeholder={searchPlaceholder}
        class="border rounded-lg px-4 py-2"
    />
    
    {#each filters as filter}
        <select 
            bind:value={values[filter.key]}
            class="border rounded-lg px-4 py-2"
        >
            <option value="">{filter.placeholder}</option>
            {#each filter.options as option}
                <option value={option.value}>{option.label}</option>
            {/each}
        </select>
    {/each}
</div> 