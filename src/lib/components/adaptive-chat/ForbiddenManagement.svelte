<!-- src/lib/components/adaptive-chat/ForbiddenManagement.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { forbiddenService } from '$lib/services/forbiddenService';
  import type { ForbiddenCategoryWithDetails, ForbiddenKeyword } from '$lib/types/forbidden';
  import { AdaptiveChatService } from '$lib/services/adaptiveChatService';
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  export let chatService: AdaptiveChatService;
  let categories: ForbiddenCategoryWithDetails[] = [];
  let selectedCategory: ForbiddenCategoryWithDetails | null = null;
  let isLoading = true;
  let error: string | null = null;

  let newKeyword = '';
  let newKeywordSeverity: ForbiddenKeyword['severity'] = 'medium';
  let newExample = '';

  async function refreshCategories() {
    try {
      categories = await forbiddenService.getAllCategoriesWithDetails();
      await chatService.loadForbiddenCategories();
      dispatch('update');
    } catch (e) {
      error = '데이터를 불러오는데 실패했습니다.';
      console.error(e);
    }
  }

  onMount(async () => {
    try {
      await refreshCategories();
    } catch (e) {
      error = '데이터를 불러오는데 실패했습니다.';
      console.error(e);
    } finally {
      isLoading = false;
    }
  });

  async function handleAddKeyword() {
    if (!selectedCategory || !newKeyword.trim()) return;

    try {
      const keyword = await forbiddenService.addKeyword({
        category_id: selectedCategory.id,
        keyword: newKeyword.trim(),
        severity: newKeywordSeverity,
        is_active: true
      });

      selectedCategory.keywords = [...selectedCategory.keywords, keyword];
      newKeyword = '';
      await refreshCategories();
    } catch (e) {
      error = '키워드 추가에 실패했습니다.';
      console.error(e);
    }
  }

  async function handleAddExample() {
    if (!selectedCategory || !newExample.trim()) return;

    try {
      const example = await forbiddenService.addExample({
        category_id: selectedCategory.id,
        example: newExample.trim()
      });

      selectedCategory.examples = [...selectedCategory.examples, example];
      newExample = '';
      await refreshCategories();
    } catch (e) {
      error = '예시 추가에 실패했습니다.';
      console.error(e);
    }
  }

  async function handleToggleKeyword(keyword: ForbiddenKeyword) {
    const newIsActive = !keyword.is_active;
    
    try {
      error = null;
      
      // 임시로 UI 상태 업데이트
      if (selectedCategory) {
        selectedCategory.keywords = selectedCategory.keywords.map(k => 
          k.id === keyword.id ? { ...k, is_active: newIsActive } : k
        );
        selectedCategory = { ...selectedCategory };
      }

      const updatedKeyword = await forbiddenService.updateKeyword(keyword.id, {
        is_active: newIsActive
      });
      
      // 서버 응답으로 UI 상태 최종 업데이트
      if (selectedCategory) {
        selectedCategory.keywords = selectedCategory.keywords.map(k => 
          k.id === updatedKeyword.id ? updatedKeyword : k
        );
        selectedCategory = { ...selectedCategory };
      }
      await refreshCategories();
    } catch (e) {
      console.error('키워드 상태 변경 오류:', e);
      
      // 에러 발생 시 UI 상태 롤백
      if (selectedCategory) {
        selectedCategory.keywords = selectedCategory.keywords.map(k => 
          k.id === keyword.id ? keyword : k
        );
        selectedCategory = { ...selectedCategory };
      }
      error = '키워드 상태 변경에 실패했습니다.';
    }
  }

  async function handleDeleteKeyword(keyword: ForbiddenKeyword) {
    if (!selectedCategory) return;

    try {
      error = null;
      
      // 서버에 삭제 요청
      await forbiddenService.deleteKeyword(keyword.id);
      
      // 성공하면 UI 업데이트
      selectedCategory.keywords = selectedCategory.keywords.filter(k => k.id !== keyword.id);
      selectedCategory = { ...selectedCategory };
      
      // 전체 카테고리 새로고침
      await refreshCategories();
    } catch (e) {
      console.error('키워드 삭제 오류:', e);
      error = '키워드 삭제에 실패했습니다.';
      await refreshCategories(); // 에러 발생 시 전체 새로고침
    }
  }

  const severityColors = {
    low: 'bg-yellow-100 text-yellow-800',
    medium: 'bg-orange-100 text-orange-800',
    high: 'bg-red-100 text-red-800'
  };
</script>

<div class="w-80 border-l border-gray-200 bg-white overflow-y-auto">
  <div class="p-4 border-b border-gray-200">
    <h2 class="text-lg font-semibold">금칙어 관리</h2>
  </div>

  {#if error}
    <div class="p-4 bg-red-50 text-red-700 text-sm">{error}</div>
  {/if}

  {#if isLoading}
    <div class="p-4 text-center text-gray-500">로딩 중...</div>
  {:else}
    <div class="p-4">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            카테고리
          </label>
          <select
            class="w-full rounded-md border border-gray-300 p-2"
            bind:value={selectedCategory}
          >
            <option value={null}>선택하세요</option>
            {#each categories as category}
              <option value={category}>{category.name}</option>
            {/each}
          </select>
        </div>

        {#if selectedCategory}
          <div>
            <h3 class="font-medium mb-2">키워드 관리</h3>
            <div class="flex gap-2 mb-2">
              <input
                type="text"
                bind:value={newKeyword}
                placeholder="새 키워드"
                class="flex-1 rounded-md border border-gray-300 p-2"
              />
              <select
                bind:value={newKeywordSeverity}
                class="rounded-md border border-gray-300 p-2"
              >
                <option value="low">낮음</option>
                <option value="medium">중간</option>
                <option value="high">높음</option>
              </select>
            </div>
            <button
              on:click={handleAddKeyword}
              disabled={!newKeyword.trim()}
              class="w-full bg-blue-500 text-white rounded-md py-2 px-4 hover:bg-blue-600 disabled:opacity-50"
            >
              키워드 추가
            </button>

            <div class="mt-4 space-y-2">
              {#each selectedCategory.keywords as keyword}
                <div class="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-1 rounded-full text-xs {severityColors[keyword.severity]}">
                      {keyword.severity}
                    </span>
                    <span class={keyword.is_active ? '' : 'line-through text-gray-400'}>
                      {keyword.keyword}
                    </span>
                  </div>
                  <div class="flex items-center gap-2">
                    <button
                      on:click={() => handleToggleKeyword(keyword)}
                      class="text-gray-500 hover:text-gray-700"
                    >
                      <span class="material-symbols-rounded text-sm">
                        {keyword.is_active ? 'toggle_on' : 'toggle_off'}
                      </span>
                    </button>
                    <button
                      on:click={() => handleDeleteKeyword(keyword)}
                      class="text-red-500 hover:text-red-700"
                    >
                      <span class="material-symbols-rounded text-sm">delete</span>
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <div>
            <h3 class="font-medium mb-2">예시 관리</h3>
            <div class="flex gap-2 mb-2">
              <input
                type="text"
                bind:value={newExample}
                placeholder="새 예시"
                class="flex-1 rounded-md border border-gray-300 p-2"
              />
            </div>
            <button
              on:click={handleAddExample}
              disabled={!newExample.trim()}
              class="w-full bg-blue-500 text-white rounded-md py-2 px-4 hover:bg-blue-600 disabled:opacity-50"
            >
              예시 추가
            </button>

            <div class="mt-4 space-y-2">
              {#each selectedCategory.examples as example}
                <div class="p-2 bg-gray-50 rounded-md">
                  {example.example}
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div> 