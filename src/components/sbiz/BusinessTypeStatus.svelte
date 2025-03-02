<script lang="ts">
  import { onMount } from 'svelte';
  import katex from 'katex';

  // 관심업종 데이터
  const businessTypeData = {
    categories: [
      { name: "월평균 매출액", period: "최근 3개월 평균", std: "σ 활용" },
      { name: "월평균 매출건수", period: "최근 3개월 평균", std: "σ 활용" },
      { name: "배달매출액", period: "최근 3개월 평균", std: "σ 활용" }
    ],
    
    // 리커트 척도 기준
    likertScale: [
      { range: "X > μ + 1.5σ", label: "매우 증가 (5)", meaning: "큰 폭으로 증가" },
      { range: "X > μ + 0.5σ", label: "약간 증가 (4)", meaning: "소폭 증가" },
      { range: "μ - 0.5σ ≤ X ≤ μ + 0.5σ", label: "변동 없음 (3)", meaning: "큰 변동 없음" },
      { range: "X < μ - 0.5σ", label: "약간 감소 (2)", meaning: "소폭 감소" },
      { range: "X < μ - 1.5σ", label: "매우 감소 (1)", meaning: "큰 폭으로 감소" }
    ],
    
    // 동종업계 비교 수준
    compareLevels: [
      { condition: "비교지수 > 1.2", meaning: "동종업계 평균 대비 높은 변동성" },
      { condition: "비교지수 ≈ 1.0", meaning: "동종업계 평균과 유사한 변동성" },
      { condition: "비교지수 < 0.8", meaning: "동종업계 평균 대비 낮은 변동성" }
    ],
    
    // 카카오톡 알림 메시지 예시
    kakaoExamples: [
      {
        category: "월평균 매출액",
        scenarios: [
          {
            title: "[구독알림 리포트] 강남구 역삼동 '한식' 업종 매출 변화",
            headlines: [
              "📈 월평균 매출액 매우 증가 (전분기 대비 +25%)",
              "💰 객단가 상승 (₩15,000→₩18,500)",
              "📊 동종업계 평균 대비 1.8배 높은 성장률"
            ],
            condition: "매우 증가 (5)"
          },
          {
            title: "[구독알림 리포트] 마포구 합정동 '카페' 업종 매출 변화",
            headlines: [
              "📉 월평균 매출액 약간 감소 (전분기 대비 -8%)",
              "💰 객단가 하락 (₩8,500→₩7,800)",
              "⚠️ 동종업계 평균보다 낮은 성과"
            ],
            condition: "약간 감소 (2)"
          }
        ]
      },
      {
        category: "월평균 매출건수",
        scenarios: [
          {
            title: "[구독알림 리포트] 서초구 반포동 '편의점' 업종 매출건수 변화",
            headlines: [
              "📈 월평균 매출건수 매우 증가 (전분기 대비 +32%)",
              "👥 신규 고객 유입 증가 (전체의 25%)",
              "📊 동종업계 평균 대비 1.5배 높은 성장률"
            ],
            condition: "매우 증가 (5)"
          },
          {
            title: "[구독알림 리포트] 종로구 인사동 '의류' 업종 매출건수 변화",
            headlines: [
              "📉 월평균 매출건수 매우 감소 (전분기 대비 -18%)",
              "👥 재방문율 하락 (65%→48%)",
              "⚠️ 동종업계 평균보다 크게 낮은 성과"
            ],
            condition: "매우 감소 (1)"
          }
        ]
      },
      {
        category: "배달매출액",
        scenarios: [
          {
            title: "[구독알림 리포트] 강동구 천호동 '치킨' 업종 배달매출 변화",
            headlines: [
              "📈 배달매출액 매우 증가 (전분기 대비 +38%)",
              "🛵 배달앱 주문 비중 증가 (55%→72%)",
              "📊 동종업계 평균 대비 1.9배 높은 성장률"
            ],
            condition: "매우 증가 (5)"
          },
          {
            title: "[구독알림 리포트] 용산구 이태원동 '피자' 업종 배달매출 변화",
            headlines: [
              "📉 배달매출액 약간 감소 (전분기 대비 -9%)",
              "🛵 배달 주문 건수 감소 (일평균 45건→38건)",
              "⚠️ 동종업계 평균보다 낮은 성과"
            ],
            condition: "약간 감소 (2)"
          }
        ]
      }
    ]
  };

  // KaTeX 수식 렌더링을 위한 함수
  function renderMath() {
    const mathElements = document.querySelectorAll('.math');
    mathElements.forEach(el => {
      katex.render(el.textContent, el, {
        throwOnError: false,
        displayMode: true
      });
    });
  }

  onMount(() => {
    renderMath();
  });
</script>

<div class="flex flex-col md:flex-row gap-6">
  <!-- 이미지 영역 (왼쪽) -->
  <div class="md:w-1/3 w-full flex justify-center">
    <div class="w-full max-w-[240px]">
      <img src="/static/2.png" alt="관심업종 현황 이미지" class="w-full rounded-lg shadow-md sticky top-4">
    </div>
  </div>

  <!-- 콘텐츠 영역 (오른쪽) -->
  <div class="md:w-2/3">
    <!-- 제목 -->
    <h1 class="text-3xl font-bold text-center mb-4">관심업종 변동 분석</h1>
    <p class="text-gray-600 text-center mb-8">월평균 매출액, 매출건수, 배달매출액 등의 변동성을 분석하는 방법</p>
    
    <!-- 담당자를 위한 설명 섹션 -->
    <section class="mb-8 bg-yellow-50 p-6 rounded-lg border border-yellow-200">
      <h2 class="text-xl font-semibold mb-3 text-yellow-800">📋 담당자 가이드</h2>
      <p class="mb-4 text-yellow-800">이 페이지는 관심업종의 주요 매출 지표 변동을 감지하고 사용자에게 알림을 제공하는 시스템의 작동 원리를 설명합니다. 아래 내용을 통해 업종별 매출 변동성 감지 방법과 알림 생성 프로세스를 이해할 수 있습니다.</p>
      
      <div class="mb-4">
        <h3 class="font-semibold mb-2 text-yellow-800">주요 기능:</h3>
        <ul class="list-disc pl-6 text-yellow-700">
          <li>업종별 매출액, 매출건수, 배달매출액의 변동성 감지</li>
          <li>통계적 방법(평균, 표준편차)을 활용한 변동성 수치화</li>
          <li>동종업계 평균과의 비교를 통한 상대적 성과 분석</li>
          <li>변동 감지 시 자동 알림 메시지 생성 및 발송</li>
        </ul>
      </div>
      
      <div>
        <h3 class="font-semibold mb-2 text-yellow-800">활용 방법:</h3>
        <ol class="list-decimal pl-6 text-yellow-700">
          <li>업종별 매출 데이터 수집 및 평균/표준편차 계산</li>
          <li>리커트 척도 기준에 따른 변동성 판단</li>
          <li>동종업계 평균과 비교하여 상대적 성과 확인</li>
          <li>주요 변동 사항을 요약한 알림 메시지 자동 생성</li>
          <li>사용자에게 카카오톡 알림 발송</li>
        </ol>
      </div>
    </section>

    <!-- 1. 평균값 산출 기준 -->
    <section class="mb-8">
      <h2 class="text-xl font-semibold mb-3">📊 평균값 산출 기준</h2>
      <table class="w-full border-collapse border border-gray-300">
        <thead class="bg-gray-100">
          <tr>
            <th class="border p-2">항목</th>
            <th class="border p-2">평균값 산출 기준</th>
            <th class="border p-2">표준편차 활용</th>
          </tr>
        </thead>
        <tbody>
          {#each businessTypeData.categories as cat}
            <tr class="border">
              <td class="border p-2">{cat.name}</td>
              <td class="border p-2">{cat.period}</td>
              <td class="border p-2">{cat.std}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </section>

    <!-- 2. 변동 감지 리커트 척도 -->
    <section class="mb-8">
      <h2 class="text-xl font-semibold mb-3">📉 변동 감지 리커트 척도</h2>
      <table class="w-full border-collapse border border-gray-300">
        <thead class="bg-gray-100">
          <tr>
            <th class="border p-2">변동 범위</th>
            <th class="border p-2">리커트 척도</th>
            <th class="border p-2">의미</th>
          </tr>
        </thead>
        <tbody>
          {#each businessTypeData.likertScale as scale}
            <tr class="border">
              <td class="border p-2">
                <div class="math">{scale.range}</div>
              </td>
              <td class="border p-2 font-bold">{scale.label}</td>
              <td class="border p-2">{scale.meaning}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </section>

    <!-- 3. 동종업계 평균 비교 -->
    <section class="mb-8">
      <h2 class="text-xl font-semibold mb-3">🏢 동종업계 평균 비교</h2>
      <ul class="list-disc pl-6 text-gray-700">
        {#each businessTypeData.compareLevels as level}
          <li class="mb-2">
            <span class="font-semibold">{level.condition}</span>: {level.meaning}
          </li>
        {/each}
      </ul>
    </section>
    
    <!-- 4. 카카오톡 알림 메시지 예시 -->
    <section class="mb-8">
      <h2 class="text-xl font-semibold mb-3">📱 카카오톡 알림 메시지 예시</h2>
      <p class="mb-4 text-gray-700">아래는 각 항목별 변동성이 감지되었을 때 사용자에게 발송되는 카카오톡 알림 메시지 예시입니다. 변동 정도에 따라 다양한 메시지가 생성됩니다.</p>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        {#each businessTypeData.kakaoExamples as example}
          <div class="mb-6">
            <h3 class="font-semibold mb-2 text-gray-800">{example.category} ({example.scenarios[0].condition})</h3>
            <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-4">
              <div class="font-bold mb-2">{example.scenarios[0].title}</div>
              <ul class="space-y-2">
                {#each example.scenarios[0].headlines as headline}
                  <li>{headline}</li>
                {/each}
              </ul>
            </div>
            
            <h3 class="font-semibold mb-2 text-gray-800">{example.category} ({example.scenarios[1].condition})</h3>
            <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div class="font-bold mb-2">{example.scenarios[1].title}</div>
              <ul class="space-y-2">
                {#each example.scenarios[1].headlines as headline}
                  <li>{headline}</li>
                {/each}
              </ul>
            </div>
          </div>
        {/each}
      </div>
    </section>

    <!-- 결론 -->
    <section class="bg-blue-50 p-6 rounded-lg shadow-md">
      <h2 class="text-xl font-semibold text-blue-700 mb-2">📌 결론</h2>
      <ul class="list-disc pl-6 text-blue-800">
        <li>📌 업종별 매출 지표의 변동 주기에 맞는 평균값을 산출해야 함.</li>
        <li>📌 표준편차를 활용하여 변동성을 리커트 척도로 평가.</li>
        <li>📌 동종업계 평균과 비교하여 상대적 성과를 분석.</li>
        <li>📌 변동성 감지 시 자동으로 카카오톡 알림 메시지 생성 및 발송.</li>
        <li>📌 사용자가 중요 변화를 놓치지 않도록 핵심 헤드라인 2-3개 제공.</li>
      </ul>
    </section>
  </div>
</div> 