<!-- src/lib/components/adaptive-chat/MessageClassificationGuide.svelte -->
<script lang="ts">
  import { messageStyles } from '$lib/config/message-styles';
  import { forbiddenService } from '$lib/services/forbiddenService';
  import type { ForbiddenCategoryWithDetails } from '$lib/types/forbidden';
  import { onMount } from 'svelte';
  
  let showDetails = false;
  let categories: ForbiddenCategoryWithDetails[] = [];
  let isLoading = true;
  let error: string | null = null;

  async function loadCategories() {
    try {
      isLoading = true;
      categories = await forbiddenService.getAllCategoriesWithDetails();
    } catch (e) {
      error = '금칙어 카테고리를 불러오는데 실패했습니다.';
      console.error(e);
    } finally {
      isLoading = false;
    }
  }

  onMount(loadCategories);

  export async function refreshCategories() {
    await loadCategories();
  }
</script>

<div class="border-b border-gray-200 bg-white">
  <div class="p-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <span class="material-symbols-rounded text-gray-600">info</span>
        <h3 class="font-medium">메시지 분류 가이드</h3>
      </div>
      <button
        class="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
        on:click={() => showDetails = !showDetails}
      >
        {showDetails ? '간단히 보기' : '자세히 보기'}
        <span class="material-symbols-rounded ml-1 text-sm">
          {showDetails ? 'expand_less' : 'expand_more'}
        </span>
      </button>
    </div>

    <div class="flex flex-wrap items-center mt-2 gap-4">
      {#each messageStyles as style}
        <div class="flex items-center space-x-2">
          <div class="w-4 h-4 rounded {style.backgroundColor}"></div>
          <span class="text-sm text-gray-600">{style.description}</span>
        </div>
      {/each}
    </div>
  </div>

  {#if showDetails}
    <div class="px-4 pb-4">
      <div class="bg-gray-50 rounded-lg p-4">
        <h4 class="font-medium mb-3">금칙어 카테고리</h4>
        {#if isLoading}
          <div class="text-center text-gray-500">로딩 중...</div>
        {:else if error}
          <div class="text-red-500">{error}</div>
        {:else}
          <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {#each categories as category}
              <div class="bg-white p-3 rounded border border-gray-200">
                <div class="font-medium text-gray-800 mb-1">{category.name}</div>
                <p class="text-sm text-gray-600 mb-2">{category.description}</p>
                <div class="text-sm">
                  <div class="text-gray-500 mb-1">주요 키워드:</div>
                  <div class="flex flex-wrap gap-1">
                    {#each category.keywords.filter(k => k.is_active) as keyword}
                      <span class="px-2 py-0.5 bg-gray-100 rounded-full text-gray-600 text-xs">
                        {keyword.keyword}
                      </span>
                    {/each}
                  </div>
                </div>
              </div>
            {/each}
          </div>

          <div class="mt-6">
            <h4 class="font-medium mb-3">메시지 분류 기준</h4>
            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div class="bg-white p-3 rounded border border-gray-200">
                <div class="font-medium text-blue-800 mb-1">학습 방법/전략</div>
                <p class="text-sm text-gray-600 mb-2">학습과 관련된 실질적인 방법과 전략을 다룹니다.</p>
                <div class="text-sm text-gray-500">
                  <div>• 학습 계획 및 시간 관리</div>
                  <div>• 문제 풀이 방법과 전략</div>
                  <div>• 노트 정리와 복습 방법</div>
                  <div>• 실수 예방과 개선 방법</div>
                  <div>• 학습 습관과 기본기</div>
                </div>
              </div>

              <div class="bg-white p-3 rounded border border-gray-200">
                <div class="font-medium text-purple-800 mb-1">동기부여/정서 관리</div>
                <p class="text-sm text-gray-600 mb-2">학습 동기와 심리적 어려움을 다룹니다.</p>
                <div class="text-sm text-gray-500">
                  <div>• 자신감과 불안 극복</div>
                  <div>• 학습 흥미와 동기 부여</div>
                  <div>• 스트레스와 부정적 감정 관리</div>
                  <div>• 긍정적 마인드셋 형성</div>
                  <div>• 의지력과 끈기 향상</div>
                </div>
              </div>

              <div class="bg-white p-3 rounded border border-gray-200">
                <div class="font-medium text-red-800 mb-1">금칙어 감지</div>
                <p class="text-sm text-gray-600 mb-2">부적절하거나 유해한 내용을 감지합니다.</p>
                <div class="text-sm text-gray-500">
                  <div>• 비속어와 욕설</div>
                  <div>• 유해하거나 불법적인 내용</div>
                  <div>• 차별적이거나 공격적인 표현</div>
                </div>
              </div>

              <div class="bg-white p-3 rounded border border-gray-200">
                <div class="font-medium text-yellow-800 mb-1">부적절한 내용 감지</div>
                <p class="text-sm text-gray-600 mb-2">학습에 방해되는 내용을 감지합니다.</p>
                <div class="text-sm text-gray-500">
                  <div>• 자살/자해 관련 표현</div>
                  <div>• 폭력적/반사회적 내용</div>
                  <div>• 학습 방해 요소</div>
                  <div>• 혐오/차별 표현</div>
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div> 