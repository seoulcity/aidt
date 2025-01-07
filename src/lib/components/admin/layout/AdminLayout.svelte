<script>
    export let mainClass = "max-w-7xl mx-auto py-6 sm:px-6 lg:px-8";
</script>

<div class="min-h-screen bg-gray-100">
    <slot name="nav" />
    <main class={mainClass}>
        <slot />
    </main>
</div> 