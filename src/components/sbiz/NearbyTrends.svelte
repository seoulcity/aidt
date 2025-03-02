<script lang="ts">
  import { onMount } from 'svelte';
  import katex from 'katex';

  // 인근 상권 트렌드 데이터
  const nearbyTrendsData = {
    categories: [
      { name: "MZ세대", period: "최근 3개월 평균", std: "σ 활용" },
      { name: "외국인", period: "최근 3개월 평균", std: "σ 활용" },
      { name: "카드매출", period: "최근 3개월 평균", std: "σ 활용" },
      { name: "배달매출", period: "최근 3개월 평균", std: "σ 활용" },
      { name: "유동인구", period: "최근 3개월 평균", std: "σ 활용" },
      { name: "검색량", period: "최근 3개월 평균", std: "σ 활용" },
      { name: "리뷰수", period: "최근 3개월 평균", std: "σ 활용" }
    ],
    
    // 리커트 척도 기준
    likertScale: [
      { range: "X > μ + 1.5σ", label: "매우 증가 (5)", meaning: "큰 폭으로 증가" },
      { range: "X > μ + 0.5σ", label: "약간 증가 (4)", meaning: "소폭 증가" },
      { range: "μ - 0.5σ ≤ X ≤ μ + 0.5σ", label: "변동 없음 (3)", meaning: "큰 변동 없음" },
      { range: "X < μ - 0.5σ", label: "약간 감소 (2)", meaning: "소폭 감소" },
      { range: "X < μ - 1.5σ", label: "매우 감소 (1)", meaning: "큰 폭으로 감소" }
    ],
    
    // 카카오톡 알림 메시지 예시
    kakaoExamples: [
      {
        category: "MZ세대",
        scenarios: [
          {
            title: "[구독알림 리포트] 강남구 역삼동 인근 상권 MZ세대 트렌드",
            headlines: [
              "📈 MZ세대 방문 매우 증가 (전분기 대비 +32%)",
              "🕒 주말 저녁 시간대(18-22시) MZ세대 방문 급증",
              "⚠️ 인근 상권 대비 1.8배 높은 MZ세대 유입률"
            ],
            condition: "매우 증가 (5)"
          },
          {
            title: "[구독알림 리포트] 종로구 인사동 인근 상권 MZ세대 트렌드",
            headlines: [
              "📉 MZ세대 방문 약간 감소 (전분기 대비 -8%)",
              "🕒 주말 방문 비중 감소 (65%→48%)",
              "⚠️ 인근 경쟁 상권으로 MZ세대 이탈 감지"
            ],
            condition: "약간 감소 (2)"
          }
        ]
      },
      {
        category: "외국인",
        scenarios: [
          {
            title: "[구독알림 리포트] 명동 인근 상권 외국인 방문 트렌드",
            headlines: [
              "📈 외국인 방문객 매우 증가 (전분기 대비 +45%)",
              "🌏 중국인 방문객 비중 증가 (30%→42%)",
              "💰 외국인 객단가 상승 (₩35,000→₩48,000)"
            ],
            condition: "매우 증가 (5)"
          },
          {
            title: "[구독알림 리포트] 이태원 인근 상권 외국인 방문 트렌드",
            headlines: [
              "📉 외국인 방문객 매우 감소 (전분기 대비 -18%)",
              "🌏 일본인 방문객 비중 감소 (25%→15%)",
              "⚠️ 코로나19 이전 대비 회복률 60% 수준"
            ],
            condition: "매우 감소 (1)"
          }
        ]
      },
      {
        category: "카드매출",
        scenarios: [
          {
            title: "[구독알림 리포트] 송파구 잠실동 인근 상권 카드매출 트렌드",
            headlines: [
              "📈 카드매출 매우 증가 (전분기 대비 +28%)",
              "💳 1인당 평균 결제금액 증가 (₩15,000→₩19,500)",
              "📊 주말 매출 비중 증가 (55%→68%)"
            ],
            condition: "매우 증가 (5)"
          },
          {
            title: "[구독알림 리포트] 마포구 홍대입구 인근 상권 카드매출 트렌드",
            headlines: [
              "📉 카드매출 약간 감소 (전분기 대비 -9%)",
              "💳 객단가 하락 (₩22,000→₩19,800)",
              "⚠️ 20대 소비자 매출 비중 감소 (45%→38%)"
            ],
            condition: "약간 감소 (2)"
          }
        ]
      },
      {
        category: "배달매출",
        scenarios: [
          {
            title: "[구독알림 리포트] 강동구 천호동 인근 상권 배달매출 트렌드",
            headlines: [
              "📈 배달매출 매우 증가 (전분기 대비 +35%)",
              "🛵 배달앱 주문 비중 증가 (50%→65%)",
              "📊 저녁 시간대 배달 주문 급증 (전체의 70%)"
            ],
            condition: "매우 증가 (5)"
          },
          {
            title: "[구독알림 리포트] 서초구 반포동 인근 상권 배달매출 트렌드",
            headlines: [
              "📉 배달매출 약간 감소 (전분기 대비 -7%)",
              "🛵 배달앱별 점유율 변화 (배민↓, 쿠팡이츠↑)",
              "⚠️ 배달 객단가 하락 (₩28,000→₩25,500)"
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
      <img src="/static/3.png" alt="인근 상권 요즘 트렌드 이미지" class="w-full rounded-lg shadow-md sticky top-4">
    </div>
  </div>

  <!-- 콘텐츠 영역 (오른쪽) -->
  <div class="md:w-2/3">
    <!-- 제목 -->
    <h1 class="text-3xl font-bold text-center mb-4">인근 상권 요즘 트렌드</h1>
    <p class="text-gray-600 text-center mb-8">주변 상권의 최신 트렌드와 변화를 분석하는 기능입니다.</p>
    
    <!-- 담당자를 위한 설명 섹션 -->
    <section class="mb-8 bg-yellow-50 p-6 rounded-lg border border-yellow-200">
      <h2 class="text-xl font-semibold mb-3 text-yellow-800">📋 담당자 가이드</h2>
      <p class="mb-4 text-yellow-800">이 페이지는 인근 상권의 주요 트렌드 변화를 감지하고 사용자에게 알림을 제공하는 시스템의 작동 원리를 설명합니다. 아래 내용을 통해 트렌드 변화 감지 방법과 알림 생성 프로세스를 이해할 수 있습니다.</p>
      
      <div class="mb-4">
        <h3 class="font-semibold mb-2 text-yellow-800">주요 기능:</h3>
        <ul class="list-disc pl-6 text-yellow-700">
          <li>MZ세대, 외국인, 카드매출, 배달매출, 유동인구, 검색량, 리뷰수 등 주요 트렌드 지표 모니터링</li>
          <li>통계적 방법(평균, 표준편차)을 활용한 변동성 감지</li>
          <li>리커트 척도(1-5)를 통한 변동 정도 수치화</li>
          <li>변동 감지 시 자동 알림 메시지 생성 및 발송</li>
        </ul>
      </div>
      
      <div>
        <h3 class="font-semibold mb-2 text-yellow-800">활용 방법:</h3>
        <ol class="list-decimal pl-6 text-yellow-700">
          <li>각 트렌드 지표별 데이터 수집 및 평균/표준편차 계산</li>
          <li>리커트 척도 기준에 따른 변동성 판단</li>
          <li>주요 변동 사항을 요약한 알림 메시지 자동 생성</li>
          <li>사용자에게 카카오톡 알림 발송</li>
          <li>트렌드 변화에 따른 마케팅 전략 수립 지원</li>
        </ol>
      </div>
    </section>

    <!-- 1. 평균값 산출 기준 -->
    <section class="mb-8">
      <h2 class="text-xl font-semibold mb-3">📊 트렌드 지표 측정 기준</h2>
      <table class="w-full border-collapse border border-gray-300">
        <thead class="bg-gray-100">
          <tr>
            <th class="border p-2">트렌드 지표</th>
            <th class="border p-2">평균값 산출 기준</th>
            <th class="border p-2">표준편차 활용</th>
          </tr>
        </thead>
        <tbody>
          {#each nearbyTrendsData.categories as cat}
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
          {#each nearbyTrendsData.likertScale as scale}
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
    
    <!-- 3. 카카오톡 알림 메시지 예시 -->
    <section class="mb-8">
      <h2 class="text-xl font-semibold mb-3">📱 카카오톡 알림 메시지 예시</h2>
      <p class="mb-4 text-gray-700">아래는 각 트렌드 지표별 변동성이 감지되었을 때 사용자에게 발송되는 카카오톡 알림 메시지 예시입니다. 변동 정도에 따라 다양한 메시지가 생성됩니다.</p>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        {#each nearbyTrendsData.kakaoExamples.slice(0, 4) as example}
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
        <li>📌 인근 상권의 다양한 트렌드 지표를 지속적으로 모니터링해야 함.</li>
        <li>📌 표준편차를 활용하여 트렌드 변동성을 리커트 척도로 평가.</li>
        <li>📌 MZ세대, 외국인, 카드매출, 배달매출 등 주요 지표의 변화 추이 분석.</li>
        <li>📌 변동성 감지 시 자동으로 카카오톡 알림 메시지 생성 및 발송.</li>
        <li>📌 트렌드 변화에 따른 마케팅 전략 및 운영 방향 조정 필요.</li>
      </ul>
    </section>
  </div>
</div> 