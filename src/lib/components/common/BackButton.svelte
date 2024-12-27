<!-- src/lib/components/common/BackButton.svelte -->
<script lang="ts">
  export let href: string = "/";
</script>

<a {href} class="text-blue-500 hover:underline inline-flex items-center gap-1">
  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
  <slot>돌아가기</slot>
</a> 