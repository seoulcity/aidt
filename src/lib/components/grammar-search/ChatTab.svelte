<!-- src/lib/components/grammar-search/ChatTab.svelte -->
<script>
  
  let messages = [];
  let newMessage = '';
  let chatContainer;
  let isLoading = false;
  let relatedContexts = []; // 관련 컨텍스트 저장
  let showContextModal = false;
  let selectedContexts = null;
  let useContextSearch = true; // 탐색 자료 사용 여부 상태 추가
  let autoScroll = true; // 자동 스크롤 상태
  let streamingMessage = ''; // 스트리밍 중인 메시지
  let streamingInterval; // 스트리밍 인터벌
  let isStreaming = false; // 스트리밍 상태

  // 스크롤을 항상 최신 메시지로 이동
  // $: if (chatContainer && messages.length > 0 && !isLoading) {
  //   // requestAnimationFrame을 사용하여 DOM 업데이트 후 스크롤
  //   requestAnimationFrame(() => {
  //     try {
  //       chatContainer.scrollTop = chatContainer.scrollHeight;
  //     } catch (error) {
  //       console.error('Scroll error:', error);
  //     }
  //   });
  // }

  // 스크롤 이벤트 핸들러
  function handleScroll() {
    if (!chatContainer || !isStreaming) return;
    
    const { scrollTop, scrollHeight, clientHeight } = chatContainer;
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10;
    
    // 사용자가 스크롤을 움직였고 맨 아래가 아닌 경우 자동 스크롤 비활성화
    if (!isAtBottom) {
      autoScroll = false;
    }
  }

  // 스트리밍 효과 함수
  function streamText(text, callback) {
    let index = 0;
    streamingMessage = '';
    isStreaming = true;
    autoScroll = true; // 스트리밍 시작시 자동 스크롤 활성화
    
    streamingInterval = setInterval(() => {
      if (index < text.length) {
        streamingMessage += text[index];
        index++;
        
        // 자동 스크롤이 활성화된 경우에만 스크롤
        if (autoScroll && chatContainer) {
          requestAnimationFrame(() => {
            chatContainer.scrollTop = chatContainer.scrollHeight;
          });
        }
      } else {
        clearInterval(streamingInterval);
        isStreaming = false;
        callback(text);
        
        // 스트리밍 완료 시 한 번만 스크롤
        requestAnimationFrame(() => {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        });
      }
    }, 20);
  }

  async function searchRelatedContexts(query) {
    try {
        console.log('\n=== 임베딩 검색 시작 ===');
        console.log('검색 쿼리:', query);
        
        const response = await fetch('/api/search-embeddings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query })
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error('검색 API 에러:', data);
            throw new Error(data.error || '검색 실패');
        }

        // 파일 목록과 유사도 정보 로깅
        if (data.similarities) {
            console.log('\n=== 유사도 비교 결과 ===');
            console.table(
                data.similarities.map(item => ({
                    파일명: item.filename,
                    교과서: item.textbook,
                    단원: item.unit,
                    유사도: Number(item.similarity).toFixed(4),
                    선택여부: item.similarity > 0.5 ? '✓' : '✗'
                }))
            );
            console.log('임계값 0.5 이상인 결과만 사용됩니다.\n');
        }
        
        // 전체 응답 데이터 로깅
        console.log('API 응답 데이터:', {
            status: response.status,
            statusText: response.statusText,
            totalFiles: data.fileInfo?.totalFiles,
            matchedResults: data.results?.length
        });

        // 파일 목록 정보 로깅
        if (data.fileInfo) {
            console.log('\n임베딩 파일 정보:');
            console.log('총 파일 수:', data.fileInfo.totalFiles);
            console.log('파일 목록:', data.fileInfo.files.map(file => ({
                name: file.name,
                textbook: file.textbook,
                unit: file.unit,
                hasEmbedding: file.hasEmbedding
            })));
        }

        if (data.error) {
            console.error('API 에러 메시지:', data.error);
            return [];
        }
        
        if (!data.results) {
            console.warn('results 필드 누락:', data);
            return [];
        }

        // 검색 결과 상세 로깅
        if (data.results.length === 0) {
            console.log('\n검색 결과: 유사도 임계값(0.5)을 넘는 결과가 없습니다.');
        } else {
            console.log('\n선택된 검색 결과:', data.results.map(result => ({
                similarity: result.similarity.toFixed(4),
                textbook: result.textbook,
                unit: result.unit,
                topic: result.topic,
                contextPreview: result.context?.substring(0, 100) + '...',
                schoolLevel: result.schoolLevel,
                grade: result.grade
            })));
        }
        
        console.log('=== 임베딩 검색 종료 ===\n');
        
        return data.results;
    } catch (error) {
        console.error('임베딩 검색 오류:', {
            message: error.message,
            error: error
        });
        return [];
    }
  }

  function showContextInfo(contexts) {
    selectedContexts = contexts;
    showContextModal = true;
  }

  async function handleSubmit() {
    if (!newMessage.trim()) return;

    const userMessage = {
      role: 'user',
      content: newMessage,
      timestamp: new Date()
    };

    messages = [...messages, userMessage];
    const messageToSend = newMessage;
    newMessage = '';
    isLoading = true;
    autoScroll = true; // 새 메시지 시작시 자동 스크롤 활성화

    // 사용자 메시지 추가 후 즉시 스크롤
    if (chatContainer) {
      requestAnimationFrame(() => {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      });
    }

    try {
        console.log('\n=== 채팅 처리 시작 ===');
        console.log('사용자 메시지:', messageToSend);
        
        let contexts = [];
        if (useContextSearch) {
            contexts = await searchRelatedContexts(messageToSend);
            relatedContexts = contexts;

            if (contexts.length > 0) {
                console.log('찾은 관련 컨텍스트:', contexts.length, '개');
                contexts.forEach((ctx, i) => {
                    console.log(`\n관련 컨텍스트 ${i + 1}:`, {
                        textbook: ctx.textbook,
                        unit: ctx.unit,
                        similarity: ctx.similarity.toFixed(4),
                        preview: ctx.context.substring(0, 100) + '...'
                    });
                });
            } else {
                console.log('관련 컨텍스트를 찾지 못했습니다.');
            }
        } else {
            console.log('색 자료 사용이 비활성화되어 있습니다.');
        }

        // 시스템 프롬프트 구성
        let systemPrompt = "당신은 영어 문법을 설명하는 선생님입니다. ";
        if (useContextSearch && contexts.length > 0) {
            systemPrompt += "다음 참고 자료를 바탕으로 답변해주세요:\n\n";
            contexts.forEach((ctx, i) => {
                systemPrompt += `참고자료 ${i + 1} (${ctx.textbook} ${ctx.unit}):\n${ctx.context}\n\n`;
            });
        }

        // 3. Chat API 호출
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                systemPrompt,
                userMessage: messageToSend
            })
        });

        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error || '응답을 받아올 수 없습니다.');

        // 스트리밍 메시지를 위한 임시 객체 추가
        messages = [...messages, {
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            contexts: contexts,
            isStreaming: true
        }];

        // 로딩 표시가 추가된 후 다시 한번 스크롤
        if (chatContainer) {
          requestAnimationFrame(() => {
            chatContainer.scrollTop = chatContainer.scrollHeight;
          });
        }

        // 스트리밍 효과 시작
        streamText(data.content, (finalText) => {
            // 스트리밍이 완료되면 최종 메시지로 교체
            messages = messages.map((msg, idx) => {
                if (idx === messages.length - 1) {
                    return {
                        role: 'assistant',
                        content: finalText,
                        timestamp: new Date(),
                        contexts: contexts
                    };
                }
                return msg;
            });
            
            // 스트리밍 완료 후 맨 아래로 스크롤
            if (chatContainer) {
                setTimeout(() => {
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                }, 0);
            }
        });

        console.log('=== 채팅 처리 종료 ===\n');
    } catch (error) {
        console.error('채팅 처리 오류:', error);
        messages = [...messages, {
            role: 'system',
            content: '죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.',
            timestamp: new Date(),
            isError: true
        }];
        
        // 에러 메시지가 추가된 후에도 스크롤
        if (chatContainer) {
          requestAnimationFrame(() => {
            chatContainer.scrollTop = chatContainer.scrollHeight;
          });
        }
    } finally {
        isLoading = false;
    }
  }
</script>

<!-- 컨텍스트 정보 모달 -->
{#if showContextModal && selectedContexts}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto
                [scrollbar-width:thin] [scrollbar-color:rgba(156,163,175,0.5)_transparent]
                [&::-webkit-scrollbar]:w-[6px]
                [&::-webkit-scrollbar-track]:bg-transparent
                [&::-webkit-scrollbar-thumb]:bg-scrollbar
                [&::-webkit-scrollbar-thumb]:rounded">
      <div class="flex justify-between items-start mb-4">
        <h3 class="text-lg font-semibold">참고한 교과서 자료</h3>
        <button
          class="text-gray-500 hover:text-gray-700"
          on:click={() => showContextModal = false}
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div class="space-y-4">
        {#each selectedContexts as context, i}
          <div class="border rounded-lg p-4">
            <div class="flex justify-between items-start mb-2">
              <div class="text-sm font-medium text-gray-900">
                {context.textbook} {context.unit}
              </div>
              <div class="text-sm text-gray-500">
                {context.schoolLevel} {context.grade}학년
              </div>
            </div>
            <div class="text-sm text-gray-600 mb-2">
              주제: {context.topic}
            </div>
            <div class="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 p-3 rounded">
              {context.context}
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
{/if}

<div class="bg-white rounded-lg shadow-md overflow-hidden max-w-4xl mx-auto">
  <!-- 탐색 자료 사용 여부 토글 스위치 추가 -->
  <div class="border-b border-gray-200 p-4">
    <div class="flex items-center justify-between">
      <label for="context-search" class="flex items-center cursor-pointer">
        <div class="mr-3 text-sm">
          <span class="font-medium text-gray-900">탐색 자료 사용</span>
          <p class="text-gray-500">교과서 자료를 참고하여 답변합니다</p>
        </div>
        <div class="relative">
          <input 
            type="checkbox" 
            id="context-search" 
            class="sr-only" 
            bind:checked={useContextSearch}
          >
          <div class="block bg-gray-200 w-14 h-8 rounded-full"></div>
          <div class="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition transform
                      {useContextSearch ? 'translate-x-6 bg-blue-600' : ''}">
          </div>
        </div>
      </label>
      {#if useContextSearch}
        <span class="text-sm text-blue-600 font-medium">활성화됨</span>
      {:else}
        <span class="text-sm text-gray-500">비활성화됨</span>
      {/if}
    </div>
  </div>

  <!-- 채팅 메시지 영역 -->
  <div 
    bind:this={chatContainer}
    on:scroll={handleScroll}
    class="h-[600px] overflow-y-auto p-4 space-y-4
           [scrollbar-width:thin] [scrollbar-color:rgba(156,163,175,0.5)_transparent]
           [&::-webkit-scrollbar]:w-[6px]
           [&::-webkit-scrollbar-track]:bg-transparent
           [&::-webkit-scrollbar-thumb]:bg-scrollbar
           [&::-webkit-scrollbar-thumb]:rounded"
  >
    {#if messages.length === 0}
      <div class="text-center text-gray-500 mt-8">
        <p class="text-lg mb-2">👋 안녕하세요!</p>
        <p class="mb-4">영문법에 대해 궁금한 점을 물어보세요.</p>
        <div class="space-y-2 text-sm">
          <p class="text-gray-400">예시 질문:</p>
          <p>"현재완료와 과거시제의 차이점이 무엇인가요?"</p>
          <p>"가정법 과거의 용법을 설명해주세요."</p>
          <p>"분사구문은 언제 사용하나요?"</p>
        </div>
      </div>
    {/if}
    
    {#each messages as message}
      <div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
        <div 
          class="relative max-w-[80%] rounded-lg p-3 {
            message.role === 'user' 
              ? 'bg-blue-500 text-white' 
              : message.isError 
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-800'
          }"
        >
          <!-- 메시지 내용과 정보 아이콘을 포함하는 컨테이너 -->
          <div class="flex items-start">
            <!-- 메시지 내용 -->
            <div class="flex-grow">
              <!-- 스트리밍 중인 메시지 표시 -->
              {#if message.isStreaming}
                <p class="whitespace-pre-wrap">{streamingMessage}</p>
              {:else}
                <p class="whitespace-pre-wrap">{message.content}</p>
              {/if}
              <p class="text-xs mt-2 opacity-70">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
            
            <!-- 정보 아이콘 (AI 응답이고 컨텍스트가 있을 때만 표시) -->
            {#if message.role === 'assistant' && message.contexts?.length > 0}
              <button
                class="flex-shrink-0 ml-3 mt-1 text-gray-400 hover:text-gray-600 transition-colors"
                on:click={() => showContextInfo(message.contexts)}
                title="참고 자료 보기"
              >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" stroke-width="2"/>
                  <path d="M12 16v-4" stroke-width="2" stroke-linecap="round"/>
                  <circle cx="12" cy="8" r="1" fill="currentColor"/>
                </svg>
              </button>
            {/if}
          </div>
        </div>
      </div>
    {/each}
    
    {#if isLoading}
      <div class="flex justify-start">
        <div class="bg-gray-100 rounded-lg p-3 flex items-center space-x-2">
          <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0s"></div>
          <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
          <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
        </div>
      </div>
    {/if}
  </div>

  <!-- 입력 영역 -->
  <div class="border-t border-gray-200 p-4">
    <form on:submit|preventDefault={handleSubmit} class="flex space-x-4">
      <input
        type="text"
        bind:value={newMessage}
        placeholder="메시지를 입력하세요..."
        class="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        disabled={isLoading || !newMessage.trim()}
        class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        전송
      </button>
    </form>
  </div>
</div> 

<style>
  /* 토글 스위치 애니메이션 */
  .dot {
    transition: all 0.3s ease-in-out;
  }
</style> 