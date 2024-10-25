<!-- src/routes/+page.svelte -->

<script>
  import { chatCompletion } from '$lib/clovaStudioService';
  import { onMount } from 'svelte';

  let userInput = '';
  let chatHistory = [];
  let isLoading = false;

  async function handleSubmit() {
    if (!userInput.trim()) return;

    isLoading = true;
    chatHistory = [...chatHistory, { role: 'user', content: userInput }];
    const userMessage = userInput;
    userInput = '';

    try {
      const response = await chatCompletion(userMessage);
      chatHistory = [...chatHistory, { role: 'assistant', content: response }];
    } catch (error) {
      console.error('Error:', error);
      chatHistory = [...chatHistory, { role: 'assistant', content: '죄송합니다. 오류가 발생했습니다.' }];
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    const chatContainer = document.getElementById('chat-container');
    chatContainer.scrollTop = chatContainer.scrollHeight;
  });
</script>

<div class="container mx-auto px-4 py-8">
	<header class="mb-8">
		<h1 class="text-4xl font-bold mb-4">CLOVA Studio Chat</h1>
		<p class="text-xl text-gray-600">CLOVA Studio API를 사용한 간단한 채팅 인터페이스입니다.</p>
	</header>

	<div id="chat-container" class="bg-white rounded-lg shadow-md p-6 mb-4 h-96 overflow-y-auto">
		{#each chatHistory as message}
			<div class={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
				<span class={`inline-block p-2 rounded-lg ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
					{message.content}
				</span>
			</div>
		{/each}
		{#if isLoading}
			<div class="text-center">
				<span class="inline-block p-2 bg-gray-200 text-gray-800 rounded-lg">응답을 생성 중입니다...</span>
			</div>
		{/if}
	</div>

	<form on:submit|preventDefault={handleSubmit} class="flex">
		<input
			type="text"
			bind:value={userInput}
			placeholder="메시지를 입력하세요..."
			class="flex-grow p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
		/>
		<button
			type="submit"
			class="bg-blue-500 text-white p-2 rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
			disabled={isLoading}
		>
			전송
		</button>
	</form>
</div>

<style>
	/* 여기에 필요한 스타일을 추가하세요 */
</style>
