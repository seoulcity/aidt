<!-- src/lib/components/adaptive-chat/StreamingText.svelte -->
<script lang="ts">
  import { onDestroy } from 'svelte';
  
  export let text: string = '';
  export let onComplete: (text: string) => void;
  export let chatContainer: HTMLElement | null = null;
  
  let streamingMessage = '';
  let streamingInterval: number | undefined;
  let isStreaming = false;
  let index = 0;

  $: if (text && !isStreaming) {
    startStreaming();
  }

  function startStreaming() {
    index = 0;
    streamingMessage = '';
    isStreaming = true;
    
    streamingInterval = window.setInterval(() => {
      if (index < text.length) {
        streamingMessage += text[index];
        index++;
        
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
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