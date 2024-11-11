<script>
  import BrandingBeta from '$lib/components/BrandingBeta.svelte';
  import { onMount } from 'svelte';

  let formData = {
    id: '',
    context: '',
    subject: '영어',
    schoolLevel: '중학교',
    grade: '1',
    textbook: '',
    unit: '',
    topic: '',
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0]
  };

  let loading = true;
  let error = null;
  let isSubmitting = false;
  let status = ''; // 상태 메시지
  let embeddings = []; // 임베딩 목록
  let selectedEmbedding = null; // 선택된 임베딩
  let showModal = false; // 모달 표시 여부
  let isEditing = false; // 수정 모드 상태
  let editingData = null; // 수정 중인 데이터

  async function loadEmbeddings() {
    try {
      const response = await fetch('/api/embeddings');
      const data = await response.json();
      if (data.nextId) {
        formData.id = data.nextId;
      }
      embeddings = data.embeddings || [];
    } catch (error) {
      console.error('데이터 로딩 실패:', error);
      error = '데이터를 불러오는데 실패했습니다.';
    } finally {
      loading = false;
    }
  }

  onMount(loadEmbeddings);

  function showEmbeddingDetails(embedding) {
    selectedEmbedding = embedding;
    showModal = true;
  }

  async function handleSubmit() {
    error = null;
    isSubmitting = true;
    status = '임베딩 생성 중...';
    
    try {
      const response = await fetch('/api/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }

      status = '임베딩 생성 완료!';
      
      // 목록 새로고침
      await loadEmbeddings();
      
      // 폼 초기화
      formData.context = '';
      formData.textbook = '';
      formData.unit = '';
      formData.topic = '';
      
    } catch (err) {
      status = '임베딩 생성 실패';
      error = err.message || '임베딩 생성 중 오류가 발생했습니다.';
    } finally {
      isSubmitting = false;
      // 3초 후 상태 메시지 제거
      setTimeout(() => {
        status = '';
      }, 3000);
    }
  }

  // 삭제 함수
  async function deleteEmbedding(filename, event) {
    event.stopPropagation(); // 모달 열림 방지
    
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/embeddings?filename=${filename}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }

      // 목록 새로고침
      await loadEmbeddings();
      status = '삭제 완료';
      setTimeout(() => { status = ''; }, 3000);
    } catch (err) {
      error = err.message || '삭제 중 오류가 발생했습니다.';
    }
  }

  // 수정 모드 시작
  function startEditing(embedding) {
    editingData = { ...embedding };
    isEditing = true;
    showModal = false;
  }

  // 수정 취소
  function cancelEditing() {
    editingData = null;
    isEditing = false;
  }

  // 수정 저장
  async function saveEditing() {
    try {
      const response = await fetch('/api/embeddings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editingData)
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }

      // 목록 새로고침
      await loadEmbeddings();
      status = '수정 완료';
      isEditing = false;
      editingData = null;
      setTimeout(() => { status = ''; }, 3000);
    } catch (err) {
      error = err.message || '수정 중 오류가 발생했습니다.';
    }
  }
</script>

<div class="container mx-auto px-4 py-8">
    <header class="mb-8">
        <h1 class="text-3xl font-bold text-center">영문법 검색형 서비스</h1>
        <div class="text-center mt-2 mb-4">
            <BrandingBeta />
        </div>
        <a href="/" class="text-blue-500 hover:underline mb-4 inline-block">← 홈으로 돌아가기</a>
    </header>

    <div class="max-w-4xl mx-auto">
        {#if loading}
            <div class="text-center">로딩 중...</div>
        {:else}
            <!-- 상태 메시지 -->
            {#if status}
                <div class="mb-4 p-4 rounded-md {error ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}">
                    {status}
                </div>
            {/if}

            <!-- 에러 메시지 -->
            {#if error}
                <div class="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                </div>
            {/if}

            <!-- 임베딩 생성 폼 -->
            <form on:submit|preventDefault={handleSubmit} class="space-y-6 bg-white p-6 rounded-lg shadow-md mb-8">
                <div class="grid grid-cols-2 gap-6">
                    <div>
                        <label for="embedding-id" class="block text-sm font-medium text-gray-700">ID</label>
                        <div id="embedding-id" class="mt-1 block w-full py-2 px-3 bg-gray-100 rounded-md">
                            {formData.id}
                        </div>
                    </div>
                    
                    <div>
                        <label for="textbook" class="block text-sm font-medium text-gray-700">교과서명</label>
                        <input id="textbook" type="text" bind:value={formData.textbook} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required />
                    </div>

                    <div>
                        <label for="school-level" class="block text-sm font-medium text-gray-700">학교급</label>
                        <select id="school-level" bind:value={formData.schoolLevel} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                            <option>초등학교</option>
                            <option>중학교</option>
                            <option>고등학교</option>
                        </select>
                    </div>

                    <div>
                        <label for="grade" class="block text-sm font-medium text-gray-700">학년</label>
                        <select id="grade" bind:value={formData.grade} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                            <option>1</option>
                            <option>2</option>
                            <option>3</option>
                            <option>4</option>
                            <option>5</option>
                            <option>6</option>
                        </select>
                    </div>

                    <div>
                        <label for="unit" class="block text-sm font-medium text-gray-700">단원</label>
                        <input id="unit" type="text" bind:value={formData.unit} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required />
                    </div>

                    <div>
                        <label for="topic" class="block text-sm font-medium text-gray-700">주제</label>
                        <input id="topic" type="text" bind:value={formData.topic} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required />
                    </div>
                </div>

                <div>
                    <label for="context" class="block text-sm font-medium text-gray-700">내용 (Context)</label>
                    <textarea
                        id="context"
                        bind:value={formData.context}
                        rows="6"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                    ></textarea>
                </div>

                <div class="flex justify-end">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        class="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {#if isSubmitting}
                            처리 중...
                        {:else}
                            임베딩 생성
                        {/if}
                    </button>
                </div>
            </form>

            <!-- 임베딩 목록 -->
            <div class="mt-8">
                <h2 class="text-xl font-bold mb-4">임베딩 목록</h2>
                <div class="grid gap-4">
                    {#each embeddings as embedding (embedding.id)}
                        <div 
                            class="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                        >
                            <div class="flex justify-between items-start">
                                <div class="cursor-pointer" on:click={() => showEmbeddingDetails(embedding)}>
                                    <h3 class="font-semibold">ID: {embedding.id}</h3>
                                    <p class="text-sm text-gray-600">교과서: {embedding.textbook}</p>
                                    <p class="text-sm text-gray-600">단원: {embedding.unit}</p>
                                    <p class="text-sm text-gray-600">주제: {embedding.topic}</p>
                                </div>
                                <div class="flex space-x-2">
                                    <button
                                        on:click={() => startEditing(embedding)}
                                        class="text-blue-600 hover:text-blue-800"
                                    >
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        on:click={(e) => deleteEmbedding(embedding.filename, e)}
                                        class="text-red-600 hover:text-red-800"
                                    >
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
    </div>
</div>

<!-- 모달 -->
{#if showModal}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div class="flex justify-between items-start mb-4">
                <h3 class="text-xl font-bold">임베딩 상세 정보</h3>
                <button 
                    class="text-gray-500 hover:text-gray-700"
                    on:click={() => showModal = false}
                >
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            {#if selectedEmbedding}
                <div class="space-y-4">
                    <div>
                        <h4 class="font-semibold">기본 정보</h4>
                        <p>ID: {selectedEmbedding.id}</p>
                        <p>생성일: {new Date(selectedEmbedding.createdAt).toLocaleString()}</p>
                        <p>파일명: {selectedEmbedding.filename}</p>
                    </div>
                    <div>
                        <h4 class="font-semibold">메타데이터</h4>
                        <p>교과서: {selectedEmbedding.textbook}</p>
                        <p>학교급: {selectedEmbedding.schoolLevel}</p>
                        <p>학년: {selectedEmbedding.grade}</p>
                        <p>단원: {selectedEmbedding.unit}</p>
                        <p>주제: {selectedEmbedding.topic}</p>
                    </div>
                    <div>
                        <h4 class="font-semibold">내용</h4>
                        <p class="whitespace-pre-wrap">{selectedEmbedding.context}</p>
                    </div>
                </div>
            {/if}
        </div>
    </div>
{/if}

<!-- 수정 모달 추가 -->
{#if isEditing && editingData}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div class="flex justify-between items-start mb-4">
                <h3 class="text-xl font-bold">임베딩 수정</h3>
                <button 
                    class="text-gray-500 hover:text-gray-700"
                    on:click={cancelEditing}
                >
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            
            <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label for="edit-textbook" class="block text-sm font-medium text-gray-700">교과서명</label>
                        <input id="edit-textbook" type="text" bind:value={editingData.textbook} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                    </div>
                    
                    <div>
                        <label for="edit-school-level" class="block text-sm font-medium text-gray-700">학교급</label>
                        <select id="edit-school-level" bind:value={editingData.schoolLevel} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                            <option>초등학교</option>
                            <option>중학교</option>
                            <option>고등학교</option>
                        </select>
                    </div>

                    <div>
                        <label for="edit-grade" class="block text-sm font-medium text-gray-700">학년</label>
                        <select id="edit-grade" bind:value={editingData.grade} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                            <option>1</option>
                            <option>2</option>
                            <option>3</option>
                            <option>4</option>
                            <option>5</option>
                            <option>6</option>
                        </select>
                    </div>

                    <div>
                        <label for="edit-unit" class="block text-sm font-medium text-gray-700">단원</label>
                        <input id="edit-unit" type="text" bind:value={editingData.unit} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                    </div>

                    <div class="col-span-2">
                        <label for="edit-topic" class="block text-sm font-medium text-gray-700">주제</label>
                        <input id="edit-topic" type="text" bind:value={editingData.topic} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                    </div>

                    <div class="col-span-2">
                        <label for="edit-context" class="block text-sm font-medium text-gray-700">내용</label>
                        <textarea
                            id="edit-context"
                            bind:value={editingData.context}
                            rows="6"
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        ></textarea>
                    </div>
                </div>

                <div class="flex justify-end space-x-3 mt-4">
                    <button
                        type="button"
                        on:click={cancelEditing}
                        class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                    >
                        취소
                    </button>
                    <button
                        type="button"
                        on:click={saveEditing}
                        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                    >
                        저장
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if} 