<!-- src/lib/components/grammar-search/StreamingText.svelte -->
<script>
  import { onDestroy } from 'svelte';
  
  export let text = '';
  export let onComplete = () => {};
  export let chatContainer = null;
  
  let streamingMessage = '';
  let streamingInterval;
  let isStreaming = false;
  let index = 0;

  $: if (text && !isStreaming) {
    startStreaming();
  }

  function startStreaming() {
    index = 0;
    streamingMessage = '';
    isStreaming = true;
    
    streamingInterval = setInterval(() => {
      if (index < text.length) {
        streamingMessage += text[index];
        index++;
      } else {
        clearInterval(streamingInterval);
        isStreaming = false;
        onComplete(text);
      }
    }, 20);
  }

  onDestroy(() => {
    if (streamingInterval) {
      clearInterval(streamingInterval);
    }
  });
</script>

<p class="whitespace-pre-wrap">{streamingMessage}</p> 