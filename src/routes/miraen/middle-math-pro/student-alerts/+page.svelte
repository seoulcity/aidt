<!-- src/routes/miraen/middle-math-pro/student-alerts/+page.svelte -->
<script lang="ts">
  // 가상의 학생 데이터 (실제로는 DB나 API에서 가져올 데이터)
  const students = [
    {
      id: 1,
      name: '김수학',
      persona: 'achievement_drop',
      previousScore: 85,
      currentScore: 65,
      details: {
        trend: 'decreasing',
        dropRate: -23.5,
        subjects: ['직선의 방정식', '원의 방정식']
      }
    },
    {
      id: 2,
      name: '이기하',
      persona: 'participation_drop',
      previousParticipation: 90,
      currentParticipation: 40,
      details: {
        missedAssignments: 5,
        lastActive: '7일 전',
        inactiveSubjects: ['벡터의 연산', '평면벡터의 성분']
      }
    },
    {
      id: 3,
      name: '박벡터',
      persona: 'random_submission',
      quickSubmissions: 8,
      averageTime: 4.5,
      details: {
        subjects: ['직선의 방정식', '원의 방정식'],
        pattern: '연속된 같은 답안 제출'
      }
    }
  ];

  let selectedStudent = students[0];
  let generatedAlert = '';

  // 알림 메시지 생성 함수
  function generateAlert(student) {
    switch (student.persona) {
      case 'achievement_drop':
        generatedAlert = `${student.name} 학생의 성취도가 이전 단원 대비 ${Math.abs(student.details.dropRate)}% 하락했습니다. 특별 지도가 필요합니다.`;
        break;
      case 'participation_drop':
        generatedAlert = `${student.name} 학생이 최근 ${student.details.lastActive} 동안 학습 참여가 저조합니다. 확인이 필요합니다.`;
        break;
      case 'random_submission':
        generatedAlert = `${student.name} 학생이 ${student.quickSubmissions}회 연속으로 문제를 풀지 않고 제출했습니다. 상담이 필요합니다.`;
        break;
    }
  }

  function getPersonaColor(persona: string) {
    switch (persona) {
      case 'achievement_drop': return 'bg-red-100 text-red-800';
      case 'participation_drop': return 'bg-yellow-100 text-yellow-800';
      case 'random_submission': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  function getPersonaLabel(persona: string) {
    switch (persona) {
      case 'achievement_drop': return '성취도 저하';
      case 'participation_drop': return '참여도 저하';
      case 'random_submission': return '무작위 제출';
      default: return '기타';
    }
  }
</script>

<div class="container mx-auto px-4 py-8">
  <header class="mb-8">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-800">학습자 알림</h1>
        <p class="text-gray-600 mt-2">주의가 필요한 학생 목록</p>
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
      <h2 class="text-xl font-semibold mb-4">관심 학생 목록</h2>
      <div class="space-y-2">
        {#each students as student}
          <button
            class="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors
                   {selectedStudent.id === student.id ? 'bg-blue-50 border border-blue-200' : 'border border-gray-200'}"
            on:click={() => selectedStudent = student}
          >
            <div class="flex justify-between items-center">
              <span>{student.name}</span>
              <span class="px-2 py-1 rounded-full text-xs font-medium {getPersonaColor(student.persona)}">
                {getPersonaLabel(student.persona)}
              </span>
            </div>
          </button>
        {/each}
      </div>
    </div>

    <!-- 상세 정보 -->
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-xl font-semibold mb-4">상세 정보</h2>
      {#if selectedStudent.persona === 'achievement_drop'}
        <div class="space-y-4">
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span class="text-gray-600">이전 성취도</span>
            <span class="font-medium">{selectedStudent.previousScore}점</span>
          </div>
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span class="text-gray-600">현재 성취도</span>
            <span class="font-medium text-red-600">{selectedStudent.currentScore}점</span>
          </div>
          <div class="p-3 bg-red-50 rounded-lg">
            <p class="text-red-800">취약 단원</p>
            <ul class="mt-2 space-y-1">
              {#each selectedStudent.details.subjects as subject}
                <li class="text-sm text-red-600">• {subject}</li>
              {/each}
            </ul>
          </div>
        </div>
      {:else if selectedStudent.persona === 'participation_drop'}
        <div class="space-y-4">
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span class="text-gray-600">이전 참여도</span>
            <span class="font-medium">{selectedStudent.previousParticipation}%</span>
          </div>
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span class="text-gray-600">현재 참여도</span>
            <span class="font-medium text-yellow-600">{selectedStudent.currentParticipation}%</span>
          </div>
          <div class="p-3 bg-yellow-50 rounded-lg">
            <p class="text-yellow-800">미제출 과제: {selectedStudent.details.missedAssignments}개</p>
            <p class="text-yellow-800">마지막 활동: {selectedStudent.details.lastActive}</p>
          </div>
        </div>
      {:else if selectedStudent.persona === 'random_submission'}
        <div class="space-y-4">
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span class="text-gray-600">빠른 제출 횟수</span>
            <span class="font-medium text-orange-600">{selectedStudent.quickSubmissions}회</span>
          </div>
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span class="text-gray-600">평균 풀이 시간</span>
            <span class="font-medium">{selectedStudent.averageTime}초</span>
          </div>
          <div class="p-3 bg-orange-50 rounded-lg">
            <p class="text-orange-800">제출 패턴: {selectedStudent.details.pattern}</p>
            <p class="text-orange-800 mt-2">해당 단원</p>
            <ul class="mt-1 space-y-1">
              {#each selectedStudent.details.subjects as subject}
                <li class="text-sm text-orange-600">• {subject}</li>
              {/each}
            </ul>
          </div>
        </div>
      {/if}
    </div>

    <!-- 알림 생성 -->
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-xl font-semibold mb-4">알림 생성</h2>
      <div class="space-y-4">
        <div class="p-4 bg-gray-50 rounded-lg">
          <p class="text-sm text-gray-600 mb-2">선택된 학생</p>
          <p class="font-medium">{selectedStudent.name}</p>
          <span class="inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium {getPersonaColor(selectedStudent.persona)}">
            {getPersonaLabel(selectedStudent.persona)}
          </span>
        </div>
        <button
          class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          on:click={() => generateAlert(selectedStudent)}
        >
          알림 생성
        </button>
        {#if generatedAlert}
          <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p class="text-sm text-blue-800">{generatedAlert}</p>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div> 