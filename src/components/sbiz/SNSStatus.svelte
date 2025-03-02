<script lang="ts">
  import { onMount } from 'svelte';
  import katex from 'katex';

  // SNS 현황 데이터
  const snsStatusData = {
    // 연관어 순위 데이터
    keywordRankings: {
      categories: [
        { name: "SNS 키워드 언급량", period: "최근 2주 평균", std: "σ 활용" },
        { name: "연관어 순위 변동", period: "최근 1주 평균", std: "σ 활용" },
        { name: "신규 키워드 등장", period: "최근 1주", std: "신규 등장 여부" },
        { name: "감성 분석 결과", period: "최근 2주 평균", std: "σ 활용" }
      ]
    },
    
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
        category: "신규 키워드 등장",
        scenarios: [
          {
            title: "[구독알림 리포트] 강남구 대치동 SNS 신규 키워드 알림",
            headlines: [
              "🆕 '예비후보' 키워드 신규 등장 (연관어 순위 3위)",
              "🔍 지역 정치 관련 언급 증가 추세",
              "📊 관련 키워드: '지원', '복지' 함께 언급"
            ],
            condition: "신규 키워드 등장"
          },
          {
            title: "[구독알림 리포트] 강남구 대치동 SNS 신규 키워드 알림",
            headlines: [
              "🆕 '회식' 키워드 신규 등장 (연관어 순위 7위)",
              "🍽️ 지역 내 음식점 관련 언급 증가",
              "📊 긍정적 리뷰 비율 높음 (78%)"
            ],
            condition: "신규 키워드 등장"
          }
        ]
      },
      {
        category: "키워드 언급량 변화",
        scenarios: [
          {
            title: "[구독알림 리포트] 강남구 대치동 SNS 키워드 언급량 변화",
            headlines: [
              "📈 '대치국수영' 키워드 언급량 매우 증가 (전주 대비 +45%)",
              "⭐ 평균 평점 상승 (4.2→4.6)",
              "📱 인스타그램 해시태그 언급 급증"
            ],
            condition: "매우 증가 (5)"
          },
          {
            title: "[구독알림 리포트] 강남구 대치동 SNS 키워드 언급량 변화",
            headlines: [
              "📉 '육아' 키워드 언급량 약간 감소 (전주 대비 -12%)",
              "🔄 관련 키워드 변화: '교육'↑, '놀이'↓",
              "📊 블로그 언급 비중 감소 (65%→52%)"
            ],
            condition: "약간 감소 (2)"
          }
        ]
      },
      {
        category: "감성 분석 결과",
        scenarios: [
          {
            title: "[구독알림 리포트] 강남구 대치동 SNS 감성 분석 결과",
            headlines: [
              "😀 긍정 언급 비율 증가 (전주 대비 +18%)",
              "👍 '맛집', '친절' 긍정 키워드 증가",
              "📊 전체 감성 점수 상승 (3.6→4.2)"
            ],
            condition: "매우 증가 (5)"
          },
          {
            title: "[구독알림 리포트] 강남구 대치동 SNS 감성 분석 결과",
            headlines: [
              "😟 부정 언급 비율 증가 (전주 대비 +15%)",
              "👎 '주차', '혼잡' 부정 키워드 증가",
              "⚠️ 주말 방문 관련 부정 언급 집중"
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
      <img src="/static/4.png" alt="내 지역 SNS 현황 이미지" class="w-full rounded-lg shadow-md sticky top-4">
    </div>
  </div>

  <!-- 콘텐츠 영역 (오른쪽) -->
  <div class="md:w-2/3">
    <!-- 제목 -->
    <h1 class="text-3xl font-bold text-center mb-4">내 지역 SNS 현황</h1>
    <p class="text-gray-600 text-center mb-8">지역 관련 SNS 언급 및 트렌드를 분석하는 기능입니다.</p>
    
    <!-- 담당자를 위한 설명 섹션 -->
    <section class="mb-8 bg-yellow-50 p-6 rounded-lg border border-yellow-200">
      <h2 class="text-xl font-semibold mb-3 text-yellow-800">📋 담당자 가이드</h2>
      <p class="mb-4 text-yellow-800">이 페이지는 지역 관련 SNS 언급 및 연관어 순위 변화를 감지하고 사용자에게 알림을 제공하는 시스템의 작동 원리를 설명합니다. 특히 신규 키워드 등장에 초점을 맞추어 변화를 감지합니다.</p>
      
      <div class="mb-4">
        <h3 class="font-semibold mb-2 text-yellow-800">주요 기능:</h3>
        <ul class="list-disc pl-6 text-yellow-700">
          <li>SNS 플랫폼(인스타그램, 블로그, 트위터 등)에서 지역 관련 언급 모니터링</li>
          <li>연관어 순위 변동 감지 및 신규 키워드 등장 알림</li>
          <li>키워드별 언급량 변화 추적 및 감성 분석</li>
          <li>변동 감지 시 자동 알림 메시지 생성 및 발송</li>
        </ul>
      </div>
      
      <div>
        <h3 class="font-semibold mb-2 text-yellow-800">활용 방법:</h3>
        <ol class="list-decimal pl-6 text-yellow-700">
          <li>SNS 플랫폼에서 지역 관련 데이터 수집 및 분석</li>
          <li>연관어 순위 변동 및 신규 키워드 등장 감지</li>
          <li>키워드별 언급량 및 감성 분석 결과 모니터링</li>
          <li>주요 변동 사항을 요약한 알림 메시지 자동 생성</li>
          <li>사용자에게 카카오톡 알림 발송</li>
        </ol>
      </div>
    </section>

    <!-- 1. SNS 키워드 측정 기준 -->
    <section class="mb-8">
      <h2 class="text-xl font-semibold mb-3">📊 SNS 키워드 측정 기준</h2>
      <table class="w-full border-collapse border border-gray-300">
        <thead class="bg-gray-100">
          <tr>
            <th class="border p-2">분석 항목</th>
            <th class="border p-2">측정 기준</th>
            <th class="border p-2">변동성 판단</th>
          </tr>
        </thead>
        <tbody>
          {#each snsStatusData.keywordRankings.categories as cat}
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
          {#each snsStatusData.likertScale as scale}
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
      <p class="mb-4 text-gray-700">아래는 신규 키워드 등장 및 주요 변동이 감지되었을 때 사용자에게 발송되는 카카오톡 알림 메시지 예시입니다.</p>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        {#each snsStatusData.kakaoExamples as example}
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
            
            {#if example.scenarios[1]}
              <h3 class="font-semibold mb-2 text-gray-800">{example.category} ({example.scenarios[1].condition})</h3>
              <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div class="font-bold mb-2">{example.scenarios[1].title}</div>
                <ul class="space-y-2">
                  {#each example.scenarios[1].headlines as headline}
                    <li>{headline}</li>
                  {/each}
                </ul>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </section>

    <!-- 결론 -->
    <section class="bg-blue-50 p-6 rounded-lg shadow-md">
      <h2 class="text-xl font-semibold text-blue-700 mb-2">📌 결론</h2>
      <ul class="list-disc pl-6 text-blue-800">
        <li>📌 지역 관련 SNS 언급 및 연관어 순위를 지속적으로 모니터링해야 함.</li>
        <li>📌 신규 키워드 등장 시 즉시 감지하여 사용자에게 알림 제공.</li>
        <li>📌 키워드별 언급량 변화 및 감성 분석 결과를 함께 제공하여 맥락 이해 지원.</li>
        <li>📌 변동 감지 시 자동으로 카카오톡 알림 메시지 생성 및 발송.</li>
        <li>📌 SNS 트렌드 변화에 따른 마케팅 전략 및 운영 방향 조정 필요.</li>
      </ul>
    </section>
  </div>
</div> 