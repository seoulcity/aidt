<script lang="ts">
  export let size: string = "8";
  export let center: boolean = true;
</script>

<div class={`${center ? "flex justify-center items-center h-32" : ""}`}>
  <div class={`animate-spin rounded-full h-${size} w-${size} border-b-2 border-blue-500`}></div>
</div> 