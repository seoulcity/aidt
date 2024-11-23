<script>
    export let title;
    export let buttonText = null;
    export let onButtonClick = () => {};
</script>

<div class="flex justify-between mb-6">
    <h2 class="text-xl font-semibold">{title}</h2>
    {#if buttonText}
        <button 
            class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            on:click={onButtonClick}
        >
            {buttonText}
        </button>
    {/if}
</div> 