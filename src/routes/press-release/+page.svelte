<!-- src/routes/press-release/+page.svelte -->
<script>
  import { onMount } from 'svelte';
  import { createClient } from '@supabase/supabase-js';
  import { validatePressReleaseInput, generatePressRelease } from '$lib/pressReleaseChain';
  import { chatCompletion } from '$lib/clovaStudioService';

  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  let userInput = '';
  let conversationHistory = [];
  let isLoading = false;
  let finalPressRelease = '';
  let isComplete = false;
  let isSidebarOpen = true;
  let sessions = [];
  let currentSessionId = null;

  onMount(async () => {
    await loadSessions();
  });

  async function loadSessions() {
    const { data, error } = await supabase
      .from('press_release_sessions')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading sessions:', error);
      return;
    }

    sessions = data;
  }

  async function generateTitle(content) {
    try {
      const response = await chatCompletion(
        '당신은 보도자료의 제목을 생성하는 전문가입니다. 주어진 내용을 바탕으로 15자 이내의 간단명료한 제목을 생성해주세요.',
        `다음 내용에 대한 15자 이내의 보도자료 제목을 생성해주세요. 제목만 작성하고 다른 설명은 하지 마세요: ${content}`
      );
      return response.trim();
    } catch (error) {
      console.error('Error generating title:', error);
      return '새로운 보도자료';
    }
  }

  async function createNewSession() {
    let title = '새로운 보도자료';
    
    // 새 세션 생성
    const { data, error } = await supabase
      .from('press_release_sessions')
      .insert([
        { title }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      return null;
    }

    // 세션 목록 업데이트
    sessions = [data, ...sessions];
    
    // 현재 대화 초기화
    resetConversation();
    
    // 새 세션 ID 설정
    currentSessionId = data.id;
    return data.id;
  }

  async function loadSession(sessionId) {
    const { data, error } = await supabase
      .from('press_release_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    currentSessionId = sessionId;
    conversationHistory = data;
    isComplete = data.some(msg => msg.content?.includes('판단: 1'));
    finalPressRelease = '';
  }

  async function saveMessage(type, content) {
    if (!currentSessionId) {
      console.error('No current session ID');
      return { error: 'No session ID' };
    }

    const { data, error } = await supabase
      .from('press_release_messages')
      .insert([{
        session_id: currentSessionId,
        type,
        content
      }])
      .select();

    if (error) {
      console.error('Error saving message:', error);
      return { error };
    }

    // Update session's updated_at
    await supabase
      .from('press_release_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', currentSessionId);

    return { data };
  }

  async function handleSubmit() {
    if (!userInput.trim()) return;

    isLoading = true;
    const currentInput = userInput;
    try {
      console.log('Starting handleSubmit with:', {
        userInput: currentInput,
        currentSessionId,
        conversationHistory
      });

      // 세션이 없는 경우에만 새로 생성
      if (!currentSessionId) {
        console.log('Creating new session...');
        const newSessionId = await createNewSession();
        if (!newSessionId) {
          throw new Error('Failed to create new session');
        }
        console.log('New session created:', newSessionId);
      }

      const historyText = conversationHistory.map(item => 
        `${item.type === 'user' ? '사용자' : 'AI'}: ${item.content}`
      ).join('\n');
      
      console.log('Calling validatePressReleaseInput with:', {
        userInput: currentInput,
        historyText
      });

      const response = await validatePressReleaseInput(currentInput, historyText);
      console.log('Got response from validation:', response);
      
      // 메시지 저장 전에 conversationHistory 업데이트
      const updatedHistory = [...conversationHistory, {
        type: 'user',
        content: currentInput,
        session_id: currentSessionId
      }];

      // 메시지 저장
      console.log('Saving user message...');
      const saveUserMessage = await saveMessage('user', currentInput);
      if (saveUserMessage.error) {
        console.error('Failed to save user message:', saveUserMessage.error);
        throw new Error('Failed to save user message');
      }

      console.log('Saving AI response...');
      const saveAIMessage = await saveMessage('assistant', response);
      if (saveAIMessage.error) {
        console.error('Failed to save AI message:', saveAIMessage.error);
        throw new Error('Failed to save AI message');
      }

      // AI 응답을 conversationHistory에 추가
      conversationHistory = [...updatedHistory, {
        type: 'assistant',
        content: response,
        session_id: currentSessionId
      }];

      console.log('Updated conversation history:', conversationHistory);

      const validationResult = response.includes('판단: 1');
      if (validationResult) {
        console.log('Validation passed, generating press release...');
        const allInput = conversationHistory
          .filter(item => item.type === 'user')
          .map(item => item.content)
          .join('\n');
        
        const pressRelease = await generatePressRelease(allInput);
        finalPressRelease = pressRelease;
        isComplete = true;
      }

      userInput = '';
      await loadSessions();
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      const errorMessage = '오류가 발생했습니다. 다시 시도해주세요.';
      await saveMessage('error', errorMessage);
      conversationHistory = [...conversationHistory, {
        type: 'error',
        content: errorMessage,
        session_id: currentSessionId
      }];
    } finally {
      isLoading = false;
    }
  }

  function resetConversation() {
    conversationHistory = [];
    finalPressRelease = '';
    isComplete = false;
    userInput = '';
    // currentSessionId는 여기서 초기화하지 않음
  }
</script>

<div class="flex h-screen">
  <!-- 사이드바 -->
  <div class="relative">
    <button
      class="absolute -right-3 top-4 bg-gray-200 p-1 rounded-full z-10"
      on:click={() => isSidebarOpen = !isSidebarOpen}
    >
      {#if isSidebarOpen}
        <span class="block w-4 h-4">←</span>
      {:else}
        <span class="block w-4 h-4">→</span>
      {/if}
    </button>
    
    <div class={`bg-gray-100 h-full transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-0'} overflow-hidden`}>
      <div class="p-4">
        <button
          class="w-full bg-blue-500 text-white p-2 rounded mb-4 hover:bg-blue-600"
          on:click={createNewSession}
        >
          새 보도자료
        </button>
        
        <div class="space-y-2">
          {#each sessions as session}
            <div class="group flex items-center">
              <button
                class="p-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:text-blue-600"
                on:click|stopPropagation={async () => {
                  const newTitle = prompt('제목을 수정하세요:', session.title);
                  if (newTitle && newTitle.trim()) {
                    const { error } = await supabase
                      .from('press_release_sessions')
                      .update({ title: newTitle.trim() })
                      .eq('id', session.id);
                    
                    if (error) {
                      console.error('Error updating title:', error);
                      return;
                    }
                    
                    await loadSessions();
                  }
                }}
              >
                ✎
              </button>
              <button
                class={`flex-1 text-left p-2 rounded hover:bg-gray-200 ${currentSessionId === session.id ? 'bg-gray-200' : ''}`}
                on:click={() => loadSession(session.id)}
              >
                <div class="truncate">{session.title}</div>
                <div class="text-xs text-gray-500">
                  {new Date(session.updated_at).toLocaleString()}
                </div>
              </button>
              <button
                class="p-2 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:text-red-600"
                on:click|stopPropagation={async () => {
                  if (confirm('이 보도자료를 삭제시겠습니까?')) {
                    const { error } = await supabase
                      .from('press_release_sessions')
                      .delete()
                      .eq('id', session.id);
                    
                    if (error) {
                      console.error('Error deleting session:', error);
                      return;
                    }
                    
                    if (currentSessionId === session.id) {
                      resetConversation();
                    }
                    
                    await loadSessions();
                  }
                }}
              >
                ×
              </button>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>

  <!-- 메인 컨텐츠 -->
  <div class="flex-1 overflow-hidden">
    <div class="container mx-auto px-4 py-8 h-full overflow-y-auto">
      <h1 class="text-3xl font-bold mb-6">AI 보도자료 생성기</h1>

      <div class="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6" role="alert">
        <p class="font-bold">사용 가이드</p>
        <ul class="list-disc list-inside">
          <li>보도자료 작성에 필요한 정보를 입력해주세요.</li>
          <li>AI가 필요한 추가 정보를 요청할 수 있습니다.</li>
          <li>모든 필요 정보가 수집되면 자동으로 보도자료가 생성됩니다.</li>
        </ul>
      </div>

      {#if !isComplete && conversationHistory.length === 0}
        <div class="mb-6 bg-gray-50 p-4 rounded-lg shadow-sm">
          <p class="text-gray-700 mb-2 font-medium">보도자료에 포함할 내용을 입력하세요:</p>
          <div class="flex gap-2">
            <textarea
              bind:value={userInput}
              class="flex-1 p-3 border rounded-lg resize-none h-24"
              placeholder="예: 시청에서 진행되는 행사에 대한 보도자료를 작성하고 싶습니다..."
            ></textarea>
            <button
              on:click={handleSubmit}
              class="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 h-24"
              disabled={isLoading}
            >
              {isLoading ? '처리 중...' : '전송'}
            </button>
          </div>
        </div>
      {/if}

      <div class="space-y-4 mb-6">
        {#each conversationHistory as item, index}
          {#if item.type === 'user'}
            <!-- 사용자 메시지 -->
            <div class="flex justify-end">
              <div class="bg-blue-500 text-white p-4 rounded-lg max-w-[80%]">
                <p class="whitespace-pre-wrap">{item.content}</p>
              </div>
            </div>
          {:else if item.type === 'assistant'}
            <!-- AI 응답 -->
            <div class="flex flex-col space-y-2">
              <div class="bg-gray-100 p-4 rounded-lg max-w-[80%]">
                {#if item.content && item.content.includes('분석 결과:')}
                  <!-- 분석 결과 섹션 -->
                  <div class="mb-4">
                    <div class="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-2">
                      <p class="text-sm text-gray-600 font-medium">현재 정보 분석</p>
                      <p class="whitespace-pre-wrap">
                        {#if item.content.split('분석 결과:')[1] && item.content.split('분석 결과:')[1].split('다음 질문:')[0]}
                          {item.content.split('분석 결과:')[1].split('다음 질문:')[0].trim()}
                        {/if}
                      </p>
                    </div>
                  </div>
                  <!-- 다음 질문 섹션 -->
                  <div class="bg-white border rounded p-4">
                    <p class="font-bold text-gray-700 mb-2">💡 추가 질문</p>
                    <p class="text-gray-800">
                      {#if item.content.split('다음 질문:')[1] && item.content.split('다음 질문:')[1].split('판단:')[0]}
                        {item.content.split('다음 질문:')[1].split('판단:')[0].trim()}
                      {/if}
                    </p>
                  </div>
                  <!-- 질문 바로 아래 입력창 -->
                  {#if index === conversationHistory.length - 1 && !isComplete}
                    <div class="mt-4">
                      <div class="flex gap-2">
                        <textarea
                          bind:value={userInput}
                          class="flex-1 p-2 border rounded-lg resize-none h-12 min-h-[3rem]"
                          placeholder="답변을 입력하세요..."
                          rows="1"
                        ></textarea>
                        <button
                          on:click={handleSubmit}
                          class="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
                          disabled={isLoading}
                        >
                          {isLoading ? '처리 중...' : '전송'}
                        </button>
                      </div>
                    </div>
                  {/if}
                {:else}
                  <p class="whitespace-pre-wrap">{item.content}</p>
                {/if}
              </div>
            </div>
          {:else}
            <!-- 에러 메시지 -->
            <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
              <p class="font-bold">Error</p>
              <p>{item.content}</p>
            </div>
          {/if}
        {/each}
      </div>

      {#if finalPressRelease}
        <div class="mt-8">
          <h2 class="text-2xl font-bold mb-4">최종 보도자료</h2>
          <div class="bg-white border rounded p-6 whitespace-pre-wrap">
            {finalPressRelease}
          </div>
          <button
            on:click={resetConversation}
            class="bg-gray-500 text-white p-2 rounded mt-4 hover:bg-gray-600"
          >
            새로운 보도자료 작성
          </button>
        </div>
      {/if}
    </div>
  </div>
</div> 