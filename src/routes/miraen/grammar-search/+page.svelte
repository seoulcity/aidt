<!-- src/routes/miraen/grammar-search/+page.svelte -->
<script>
  import { onMount } from 'svelte';
  import BrandingBeta from '$lib/components/BrandingBeta.svelte';
  import StatusMessage from '$lib/components/common/StatusMessage.svelte';
  import ErrorMessage from '$lib/components/common/ErrorMessage.svelte';
  import TabNavigation from '$lib/components/grammar-search/TabNavigation.svelte';
  import ManualInputTab from '$lib/components/grammar-search/ManualInputTab.svelte';
  import FileUploadTab from '$lib/components/grammar-search/FileUploadTab.svelte';
  import EmbeddingListTab from '$lib/components/grammar-search/EmbeddingListTab.svelte';
  import EmbeddingModal from '$lib/components/grammar-search/EmbeddingModal.svelte';
  import EditModal from '$lib/components/grammar-search/EditModal.svelte';

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
  let selectedFile = null;
  let showPDFViewer = false;
  let activeTab = 'manual'; // 'manual' 또는 'file'

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

  function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      selectedFile = file;
      showPDFViewer = true;
    } else {
      alert('PDF 파일만 선택할 수 있습니다.');
    }
  }

  function handleTabChange(newTab) {
    activeTab = newTab;
  }

  // PDF에서 추출한 텍스트를 임베딩 폼에 추가하는 함수
  function handleAddToEmbedding(event) {
    const { text } = event.detail;
    formData.context += (formData.context ? '\n\n' : '') + text;
    // 텍스트가 추가되면 직접 입력 탭으로 전환
    activeTab = 'manual';
  }
</script>

<div class="container mx-auto px-4 py-8">
    <header class="mb-8">
        <h1 class="text-3xl font-bold text-center">영문법 검색형 서비스 (준비중)</h1>
        <div class="text-center mt-2 mb-4">
            <BrandingBeta />
        </div>
        <a href="/" class="text-blue-500 hover:underline mb-4 inline-block">← 홈으로 돌아가기</a>
    </header>

    <div class="max-w-4xl mx-auto">
        {#if loading}
            <div class="text-center">로딩 중...</div>
        {:else}
            <StatusMessage message={status} />
            <ErrorMessage {error} />

            <div class="mb-6 border-b border-gray-200">
                <TabNavigation {activeTab} onTabChange={handleTabChange} />
            </div>

            {#if activeTab === 'manual'}
                <ManualInputTab {formData} {isSubmitting} on:submit={handleSubmit} />
            {:else if activeTab === 'file'}
                <FileUploadTab
                    bind:selectedFile
                    bind:showPDFViewer
                    on:addToEmbedding={handleAddToEmbedding}
                />
            {:else}
                <EmbeddingListTab
                    {embeddings}
                    on:showDetails={handleShowDetails}
                    on:startEditing={handleStartEditing}
                    on:delete={handleDelete}
                />
            {/if}

            <EmbeddingModal
                embedding={selectedEmbedding}
                show={showModal}
                on:close={() => showModal = false}
            />

            <EditModal
                {editingData}
                show={isEditing}
                on:close={cancelEditing}
                on:save={saveEditing}
            />
        {/if}
    </div>
</div>