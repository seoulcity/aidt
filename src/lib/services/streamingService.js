export function createStreamingService() {
  let streamingInterval;
  
  function streamText(text, onProgress, onComplete) {
    let index = 0;
    let streamingMessage = '';
    
    streamingInterval = setInterval(() => {
      if (index < text.length) {
        streamingMessage += text[index];
        index++;
        onProgress(streamingMessage);
      } else {
        clearInterval(streamingInterval);
        onComplete(text);
      }
    }, 20);
  }

  function clearStreaming() {
    if (streamingInterval) {
      clearInterval(streamingInterval);
    }
  }

  return {
    streamText,
    clearStreaming
  };
} 