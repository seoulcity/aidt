<!-- src/routes/miraen/middle-math-pro/persona-chat/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import ChatMessages from '$lib/components/adaptive-chat/ChatMessages.svelte';
  import ChatInput from '$lib/components/adaptive-chat/ChatInput.svelte';
  import type { StudentPersona } from '$lib/types/persona';
  import { PersonaChatService } from '$lib/services/personaChatService';
  
  let chatService: PersonaChatService;
  let messages = [];
  let chatContainer: HTMLElement;
  let isLoading = false;
  let autoScroll = true;
  let selectedStudent: StudentPersona | null = null;

  // 예시 학생 데이터 (실제로는 DB나 API에서 가져올 데이터)
  const students: StudentPersona[] = [
    {
      id: 1,
      name: '김수학',
      performances: {
        '벡터의 연산': '상',
        '평면벡터의 성분': '상',
        '직선의 방정식': '상',
        '직선의 수직과 평행': '중',
        '원의 방정식': '상',
        '원과 직선의 위치 관계': '상'
      }
    },
    {
      id: 2,
      name: '이기하',
      performances: {
        '벡터의 연산': '중',
        '평면벡터의 성분': '중',
        '직선의 방정식': '중',
        '직선의 수직과 평행': '중',
        '원의 방정식': '중',
        '원과 직선의 위치 관계': '하'
      }
    },
    {
      id: 3,
      name: '박벡터',
      performances: {
        '벡터의 연산': '하',
        '평면벡터의 성분': '하',
        '직선의 방정식': '중',
        '직선의 수직과 평행': '하',
        '원의 방정식': '하',
        '원과 직선의 위치 관계': '하'
      }
    }
  ];

  onMount(() => {
    chatService = new PersonaChatService();
  });

  function handleScroll(event: Event) {
    if (!chatContainer) return;
    
    const target = event.target as HTMLElement;
    const { scrollTop, scrollHeight, clientHeight } = target;
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10;
    
    autoScroll = isAtBottom;
  }

  function handleMessageComplete(event: CustomEvent) {
    const { index, text } = event.detail;
    chatService.updateStreamingMessage(index, text);
    messages = chatService.getMessages();
  }

  async function handleSubmit(messageText: string) {
    if (!messageText.trim() || !selectedStudent) return;

    isLoading = true;
    await chatService.sendMessage(messageText);
    messages = chatService.getMessages();
    isLoading = chatService.getLoadingState();
    autoScroll = true;
  }

  function selectStudent(student: StudentPersona) {
    selectedStudent = student;
    chatService.setStudent(student);
    messages = [];
  }

  function getPerformanceColor(level: '상' | '중' | '하') {
    switch (level) {
      case '상': return 'bg-blue-100 text-blue-800';
      case '중': return 'bg-yellow-100 text-yellow-800';
      case '하': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  $: messages = chatService?.getMessages() || [];
  $: isLoading = chatService?.getLoadingState() || false;
</script>

<div class="flex h-[100vh]">
  <div class="flex-1 flex flex-col">
    <header class="flex-none py-4 px-4 bg-white border-b border-gray-200">
      <div class="flex items-center justify-between">
        <h1 class="text-3xl font-bold">페르소나별 피드백 챗봇</h1>
        <a href="/" class="text-blue-500 hover:underline">← 돌아가기</a>
      </div>
    </header>

    <main class="flex-1 container mx-auto px-4 py-4 overflow-hidden">
      <div class="h-full bg-white rounded-lg shadow-md overflow-hidden flex">
        <!-- 학생 목록 -->
        <div class="w-64 border-r border-gray-200 overflow-y-auto">
          <div class="p-4">
            <h2 class="text-lg font-semibold mb-4">학생 목록</h2>
            <div class="space-y-2">
              {#each students as student}
                <button
                  class="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors
                         {selectedStudent?.id === student.id ? 'bg-blue-50 border border-blue-200' : 'border border-gray-200'}"
                  on:click={() => selectStudent(student)}
                >
                  <div class="font-medium">{student.name}</div>
                  <div class="mt-2 space-y-1">
                    {#each Object.entries(student.performances) as [concept, level]}
                      <div class="flex justify-between items-center text-sm">
                        <span class="text-gray-600">{concept}</span>
                        <span class="px-2 py-0.5 rounded-full text-xs font-medium {getPerformanceColor(level)}">
                          {level}
                        </span>
                      </div>
                    {/each}
                  </div>
                </button>
              {/each}
            </div>
          </div>
        </div>

        <!-- 채팅 영역 -->
        <div class="flex-1 flex flex-col min-h-0">
          {#if selectedStudent}
            <div class="p-4 border-b border-gray-200">
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="text-lg font-semibold">{selectedStudent.name} 학생과의 대화</h2>
                  {#if selectedStudent.averageLevel}
                    <p class="text-sm text-gray-600">
                      평균 수준:
                      <span class="px-2 py-0.5 rounded-full text-xs font-medium {getPerformanceColor(selectedStudent.averageLevel)}">
                        {selectedStudent.averageLevel}
                      </span>
                    </p>
                  {/if}
                </div>
              </div>
            </div>

            <div class="flex-1 min-h-0">
              <ChatMessages
                {messages}
                bind:chatContainer
                {isLoading}
                {autoScroll}
                on:scroll={handleScroll}
                on:messageComplete={handleMessageComplete}
              />
            </div>

            <ChatInput 
              onSubmit={handleSubmit}
              {isLoading}
            />
          {:else}
            <div class="flex-1 flex items-center justify-center text-gray-500">
              <div class="text-center">
                <span class="material-symbols-rounded text-4xl mb-2">person_search</span>
                <p>학생을 선택해주세요</p>
              </div>
            </div>
          {/if}
        </div>
      </div>
    </main>
  </div>
</div> 