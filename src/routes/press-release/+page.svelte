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
  let showGenerateOptions = false;
  let isEditing = false;
  let editableInfo = {
    title: '',
    what: '',
    when: '',
    where: '',
    who: '',
    why: ''
  };

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

      // 세션이 없는 경우에만 새로 생성하고 제목 설정
      if (!currentSessionId) {
        console.log('Creating new session...');
        // 입력된 내용으로 제목 생성
        const title = await chatCompletion(
          '당신은 보도자료의 제목을 생성하는 전문가입니다. 주어진 내용을 바탕으로 10자 이내의 간단명료한 제목을 생성해주세요.',
          `다음 내용에 대한 10자 이내의 보도자료 제목을 생성해주세요. 제목만 작성하고 다른 설명은 하지 마세요: ${currentInput}`
        );

        // 새 세션 생성 시 생성된 제목 사용
        const { data, error } = await supabase
          .from('press_release_sessions')
          .insert([{ title: title.trim() }])
          .select()
          .single();

        if (error || !data) {
          throw new Error('Failed to create new session');
        }
        currentSessionId = data.id;
        console.log('New session created:', currentSessionId);
        
        // 세션 목록 업데이트
        await loadSessions();
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
        showGenerateOptions = true;
        const analysisSection = response.split('분석 결과:')[1].split('다음 질문:')[0];
        const lines = analysisSection.split('\n').filter(line => line.trim());
        
        editableInfo = {
          title: lines.find(l => l.includes('주제/제목'))?.split(':')[1]?.trim() || '',
          what: lines.find(l => l.includes('주요 내용'))?.split(':')[1]?.trim() || '',
          when: lines.find(l => l.includes('시기'))?.split(':')[1]?.trim() || '',
          where: lines.find(l => l.includes('장소'))?.split(':')[1]?.trim() || '',
          who: lines.find(l => l.includes('관련 조직/인물'))?.split(':')[1]?.trim() || '',
          why: lines.find(l => l.includes('목적/의의'))?.split(':')[1]?.trim() || ''
        };
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

  async function handleGeneratePress() {
    showGenerateOptions = false;
    isLoading = true;
    
    try {
      // 보도자료 생성 시작 메시지 추가
      const generatingMessage = '✨ 모든 정보가 수집되었습니다. 보도자료를 생성하고 있습니다...';
      await saveMessage('assistant', generatingMessage);
      conversationHistory = [...conversationHistory, {
        type: 'assistant',
        content: generatingMessage,
        session_id: currentSessionId
      }];
      
      // 수정된 정보를 포맷팅
      const formattedInfo = `
주제/제목: ${editableInfo.title}
주요 내용(What): ${editableInfo.what}
시기(When): ${editableInfo.when}
장소(Where): ${editableInfo.where}
관련 조직/인물(Who): ${editableInfo.who}
목적/의의(Why): ${editableInfo.why}
      `.trim();
      
      const pressRelease = await generatePressRelease(formattedInfo);
      finalPressRelease = pressRelease;
      isComplete = true;

      // 생성 완료 메시지 추가
      const completionMessage = '✅ 보도자료가 생성되었습니다. 아래에서 확인하실 수 있습니다.';
      await saveMessage('assistant', completionMessage);
      conversationHistory = [...conversationHistory, {
        type: 'assistant',
        content: completionMessage,
        session_id: currentSessionId
      }];
    } catch (error) {
      console.error('Error generating press release:', error);
      const errorMessage = '보도자료 생성 중 오류가 발생했습니다.';
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

  function handleEditInfo() {
    isEditing = true;
    showGenerateOptions = false;
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
                  <!-- 입력창 조건 수정 -->
                  {#if index === conversationHistory.length - 1 && !isComplete && !item.content.includes('✨') && !item.content.includes('✅')}
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
                {:else if item.content.includes('✨')}
                  <!-- 보도자료 생성 중 메시지 -->
                  <div class="bg-yellow-50 border-l-4 border-yellow-400 p-3">
                    <p class="text-sm text-gray-600 font-medium">{item.content}</p>
                    <div class="mt-2">
                      <div class="animate-pulse flex space-x-4">
                        <div class="h-2 bg-yellow-400 rounded w-24"></div>
                        <div class="h-2 bg-yellow-400 rounded w-16"></div>
                        <div class="h-2 bg-yellow-400 rounded w-20"></div>
                      </div>
                    </div>
                  </div>
                {:else if item.content.includes('✅')}
                  <!-- 생성 완료 메시지 -->
                  <div class="bg-green-50 border-l-4 border-green-400 p-3">
                    <p class="text-sm text-gray-600 font-medium">{item.content}</p>
                  </div>
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

      {#if showGenerateOptions && !isEditing}
        <div class="bg-white border rounded-lg p-6 mb-6 shadow-sm">
          <h3 class="text-lg font-semibold mb-4">필요한 정보가 모두 수집되었습니다.</h3>
          <div class="flex gap-4">
            <button
              class="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
              on:click={handleGeneratePress}
            >
              보도자료 생성하기
            </button>
            <button
              class="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
              on:click={handleEditInfo}
            >
              수집된 정보 수정하기
            </button>
          </div>
        </div>
      {/if}

      {#if isEditing}
        <div class="bg-white border rounded-lg p-6 mb-6 shadow-sm">
          <h3 class="text-lg font-semibold mb-4">수집된 정보 수정</h3>
          <div class="space-y-4">
            <div class="grid grid-cols-1 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">주제/제목</label>
                <input
                  type="text"
                  bind:value={editableInfo.title}
                  class="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">주요 내용 (What)</label>
                <textarea
                  bind:value={editableInfo.what}
                  class="w-full p-2 border rounded h-24"
                ></textarea>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">시기 (When)</label>
                <input
                  type="text"
                  bind:value={editableInfo.when}
                  class="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">장소 (Where)</label>
                <input
                  type="text"
                  bind:value={editableInfo.where}
                  class="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">관련 조직/인물 (Who)</label>
                <input
                  type="text"
                  bind:value={editableInfo.who}
                  class="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">목적/의의 (Why)</label>
                <textarea
                  bind:value={editableInfo.why}
                  class="w-full p-2 border rounded h-24"
                ></textarea>
              </div>
            </div>
            <div class="flex justify-end gap-4 mt-4">
              <button
                class="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                on:click={handleGeneratePress}
                disabled={isLoading}
              >
                {isLoading ? '생성 중...' : '수정된 정보로 생성하기'}
              </button>
              <button
                class="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 disabled:cursor-not-allowed"
                on:click={() => {
                  isEditing = false;
                  showGenerateOptions = true;
                }}
                disabled={isLoading}
              >
                취소
              </button>
            </div>
          </div>
        </div>

        {#if isLoading}
          <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="animate-spin h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm text-yellow-700">
                  보도자료를 생성하고 있습니다. 잠시만 기다려주세요...
                </p>
              </div>
            </div>
          </div>
        {/if}

        {#if finalPressRelease}
          <div class="bg-white border rounded-lg p-6 shadow-sm">
            <h3 class="text-lg font-semibold mb-4">생성된 보도자료</h3>
            <div class="whitespace-pre-wrap">
              {finalPressRelease}
            </div>
            <div class="mt-4 flex justify-end">
              <button
                class="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
                on:click={() => {
                  isEditing = false;
                  showGenerateOptions = false;
                  resetConversation();
                }}
              >
                새로운 보도자료 작성
              </button>
            </div>
          </div>
        {/if}
      {/if}
    </div>
  </div>
</div> 