<!-- src/routes/miraen/middle-math-pro/learning-comments/+page.svelte -->
<script lang="ts">
  // 단원 정보 (실제로는 DB나 API에서 가져올 데이터)
  const unit = {
    title: '기하와 벡터',
    subUnits: [
      { id: 1, title: '평면벡터', concepts: ['벡터의 연산', '평면벡터의 성분'] },
      { id: 2, title: '직선의 방정식', concepts: ['직선의 방정식', '직선의 수직과 평행'] },
      { id: 3, title: '원의 방정식', concepts: ['원의 방정식', '원과 직선의 위치 관계'] }
    ]
  };

  // 가상의 학생 데이터 (실제로는 DB나 API에서 가져올 데이터)
  const students = [
    { id: 1, name: '김수학', performances: { '벡터의 연산': '상', '평면벡터의 성분': '상', '직선의 방정식': '상', '직선의 수직과 평행': '중', '원의 방정식': '상', '원과 직선의 위치 관계': '상' } },
    { id: 2, name: '이기하', performances: { '벡터의 연산': '중', '평면벡터의 성분': '중', '직선의 방정식': '중', '직선의 수직과 평행': '중', '원의 방정식': '중', '원과 직선의 위치 관계': '하' } },
    { id: 3, name: '박벡터', performances: { '벡터의 연산': '하', '평면벡터의 성분': '하', '직선의 방정식': '중', '직선의 수직과 평행': '하', '원의 방정식': '하', '원과 직선의 위치 관계': '하' } },
    { id: 4, name: '최직선', performances: { '벡터의 연산': '상', '평면벡터의 성분': '중', '직선의 방정식': '상', '직선의 수직과 평행': '상', '원의 방정식': '중', '원과 직선의 위치 관계': '중' } },
    { id: 5, name: '정원의', performances: { '벡터의 연산': '중', '평면벡터의 성분': '하', '직선의 방정식': '하', '직선의 수직과 평행': '하', '원의 방정식': '중', '원과 직선의 위치 관계': '중' } },
    { id: 6, name: '강수직', performances: { '벡터의 연산': '상', '평면벡터의 성분': '상', '직선의 방정식': '중', '직선의 수직과 평행': '중', '원의 방정식': '하', '원과 직선의 위치 관계': '하' } }
  ];

  let selectedStudent = students[0];
  let generatedComment = '';
  let isGenerating = false;

  // 평어 생성 함수
  async function generateComment(student: typeof students[0]) {
    isGenerating = true;
    try {
      // 학생의 수행 수준 데이터를 바탕으로 프롬프트 생성
      const conceptPerformances = Object.entries(student.performances)
        .map(([concept, level]) => `${concept}: ${level}`)
        .join('\n');

      const prompt = `당신은 수학 교사입니다. 학생의 단원별 수행 수준을 바탕으로 30자 내외의 학습 평어를 생성해주세요.

학생 정보:
이름: ${student.name}
단원: 기하와 벡터
개념별 수행 수준:
${conceptPerformances}

작성 형식:
- '~함', '~하며', '~하고' 등의 종결어미 사용
- 객관적이고 명확한 표현 사용 (예: 능숙하게, 향상됨, 이해하고, 적용할 수 있음, 보완이 필요함)
- 구체적인 영역 언급
- 30자 내외로 간단명료하게 작성
- 성장 중심의 서술

예시:
"벡터의 연산을 능숙하게 다루며, 기하학적 개념 이해력이 우수함"
"평면벡터의 성분을 이해하고 직선의 방정식 활용 능력이 향상됨"

평어를 따옴표 없이 작성해주세요:`;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          systemPrompt: prompt,
          userMessage: '학습 평어를 생성해주세요.'
        })
      });

      if (!response.ok) throw new Error('평어 생성에 실패했습니다.');
      
      const result = await response.json();
      generatedComment = result.content.trim();
    } catch (error) {
      console.error('평어 생성 오류:', error);
      generatedComment = '평어 생성 중 오류가 발생했습니다. 다시 시도해주세요.';
    } finally {
      isGenerating = false;
    }
  }

  function getPerformanceColor(level: string) {
    switch (level) {
      case '상': return 'bg-blue-100 text-blue-800';
      case '중': return 'bg-yellow-100 text-yellow-800';
      case '하': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
</script>

<div class="container mx-auto px-4 py-8">
  <header class="mb-8">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-800">학습 평어 생성</h1>
        <p class="text-gray-600 mt-2">단원: {unit.title}</p>
      </div>
      <a href="/" class="text-blue-500 hover:text-blue-700 flex items-center gap-1">
        <span class="material-symbols-rounded">arrow_back</span>
        메인으로 돌아가기
      </a>
    </div>
  </header>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <!-- 학생 목록 -->
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-xl font-semibold mb-4">학생 목록</h2>
      <div class="space-y-2">
        {#each students as student}
          <button
            class="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors
                   {selectedStudent.id === student.id ? 'bg-blue-50 border border-blue-200' : 'border border-gray-200'}"
            on:click={() => selectedStudent = student}
          >
            {student.name}
          </button>
        {/each}
      </div>
    </div>

    <!-- 수행 수준 표시 -->
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-xl font-semibold mb-4">개념별 수행 수준</h2>
      <div class="space-y-4">
        {#each unit.subUnits as subUnit}
          <div class="border-b border-gray-200 pb-4 last:border-0">
            <h3 class="font-medium text-gray-700 mb-2">{subUnit.title}</h3>
            <div class="space-y-2">
              {#each subUnit.concepts as concept}
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-600">{concept}</span>
                  <span class="px-3 py-1 rounded-full text-sm font-medium {getPerformanceColor(selectedStudent.performances[concept])}">
                    {selectedStudent.performances[concept]}
                  </span>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- 평어 생성 -->
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-xl font-semibold mb-4">평어 생성</h2>
      <div class="space-y-4">
        <div class="p-4 bg-gray-50 rounded-lg">
          <p class="text-sm text-gray-600 mb-2">선택된 학생</p>
          <p class="font-medium">{selectedStudent.name}</p>
        </div>
        <button
          class="w-full bg-white text-[#AC4FF0] border-2 border-[#AC4FF0] py-2 px-4 rounded-lg shadow-sm hover:shadow-md active:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:text-white hover:border-transparent hover:bg-gradient-to-r hover:from-[#FF3B9A] hover:via-[#AC4FF0] hover:to-[#4CC9F0] hover:-translate-y-0.5 active:translate-y-0"
          on:click={() => generateComment(selectedStudent)}
          disabled={isGenerating}
        >
          {#if isGenerating}
            <div class="flex items-center justify-center gap-2">
              <div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              <span>평어 생성 중...</span>
            </div>
          {:else}
            <div class="flex items-center justify-center gap-2">
              <span class="material-symbols-rounded text-sm">auto_awesome</span>
              <span class="font-medium">평어 생성</span>
            </div>
          {/if}
        </button>
        {#if generatedComment}
          <div class="space-y-2">
            <p class="text-sm text-gray-600 pl-2">평어는 다음과 같습니다</p>
            <div class="p-4 bg-gradient-to-r from-[#FF3B9A]/10 via-[#AC4FF0]/10 to-[#4CC9F0]/10 border border-[#AC4FF0]/30 rounded-lg">
              <div class="flex items-start gap-2">
                <span class="material-symbols-rounded text-[#AC4FF0]">stars</span>
                <p class="text-sm text-gray-800">{generatedComment}</p>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div> 