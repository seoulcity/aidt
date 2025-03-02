<script lang="ts">
  import { onMount } from 'svelte';
  import katex from 'katex';

  const categories = [
    { name: "업소 수 변화", period: "최근 3~6개월 평균", std: "σ 활용" },
    { name: "유동인구 변화", period: "최근 4주 평균", std: "σ 활용" },
    { name: "매출 및 판매건수", period: "최근 7~30일 평균", std: "σ 활용" },
    { name: "주거인구 & 직장인구", period: "최근 6~12개월 평균", std: "σ 활용" }
  ];

  const likertScale = [
    { range: "X > μ + 1.5σ", label: "매우 증가 (5)", meaning: "큰 폭으로 증가" },
    { range: "X > μ + 0.5σ", label: "약간 증가 (4)", meaning: "소폭 증가" },
    { range: "μ - 0.5σ ≤ X ≤ μ + 0.5σ", label: "변동 없음 (3)", meaning: "큰 변동 없음" },
    { range: "X < μ - 0.5σ", label: "약간 감소 (2)", meaning: "소폭 감소" },
    { range: "X < μ - 1.5σ", label: "매우 감소 (1)", meaning: "큰 폭으로 감소" }
  ];

  const compareLevels = [
    { condition: "비교지수 > 1.2", meaning: "해당 동이 시군구 대비 높은 변동성" },
    { condition: "비교지수 ≈ 1.0", meaning: "변화 수준이 유사" },
    { condition: "비교지수 < 0.8", meaning: "해당 동이 시군구 대비 낮은 변동성" }
  ];

  // 카카오톡 알림 메시지 예시
  const kakaoExamples = [
    {
      category: "업소 수 변화",
      scenarios: [
        {
          title: "[구독알림 리포트] 강남구 역삼동 업소 수 변화",
          headlines: [
            "📈 카페/디저트 업종 매우 증가 (전월 대비 +23%)",
            "📉 패션/의류 업종 약간 감소 (전월 대비 -8%)",
            "⚠️ 주변 지역 대비 1.4배 높은 변동성 감지"
          ],
          condition: "매우 증가 (5)"
        },
        {
          title: "[구독알림 리포트] 마포구 합정동 업소 수 변화",
          headlines: [
            "📉 음식점 업종 매우 감소 (전월 대비 -18%)",
            "📊 전체 업소 수 약간 감소 추세 지속 중",
            "⚠️ 인근 상권 대비 폐업률 1.3배 높음"
          ],
          condition: "매우 감소 (1)"
        }
      ]
    },
    {
      category: "유동인구 변화",
      scenarios: [
        {
          title: "[구독알림 리포트] 서초구 반포동 유동인구 변화",
          headlines: [
            "📈 주말 유동인구 매우 증가 (전월 대비 +31%)",
            "🕒 저녁 시간대(18-22시) 유동인구 약간 증가",
            "📊 인근 지역 대비 1.5배 높은 유동인구 증가율"
          ],
          condition: "매우 증가 (5)"
        },
        {
          title: "[구독알림 리포트] 종로구 인사동 유동인구 변화",
          headlines: [
            "📉 평일 유동인구 약간 감소 (전월 대비 -7%)",
            "📊 외국인 관광객 유동인구 변동 없음",
            "⚠️ 코로나19 이전 대비 회복률 75% 수준"
          ],
          condition: "약간 감소 (2)"
        }
      ]
    },
    {
      category: "매출 및 판매건수",
      scenarios: [
        {
          title: "[구독알림 리포트] 강서구 마곡동 매출 변화",
          headlines: [
            "📈 식품/음료 업종 매출 매우 증가 (전주 대비 +27%)",
            "💳 1인당 평균 결제금액 약간 증가 (8,500원→9,200원)",
            "📊 판매건수 증가율, 지역 평균의 1.6배"
          ],
          condition: "매우 증가 (5)"
        },
        {
          title: "[구독알림 리포트] 용산구 이태원동 매출 변화",
          headlines: [
            "📉 전체 업종 매출 약간 감소 (전주 대비 -9%)",
            "⚠️ 주말 매출 비중 감소 (60%→52%)",
            "📊 결제건수 감소, 객단가는 유지"
          ],
          condition: "약간 감소 (2)"
        }
      ]
    },
    {
      category: "주거인구 & 직장인구",
      scenarios: [
        {
          title: "[구독알림 리포트] 송파구 문정동 인구 변화",
          headlines: [
            "📈 30대 직장인구 매우 증가 (전년 대비 +19%)",
            "🏢 오피스 임대 면적 약간 증가 (전년 대비 +8%)",
            "📊 주거인구 증가율, 서울시 평균의 1.3배"
          ],
          condition: "매우 증가 (5)"
        },
        {
          title: "[구독알림 리포트] 중구 을지로동 인구 변화",
          headlines: [
            "📉 상주 직장인구 약간 감소 (전년 대비 -6%)",
            "🏢 소규모 사무실 공실률 약간 증가",
            "⚠️ 주변 상권 매출에 영향 가능성 있음"
          ],
          condition: "약간 감소 (2)"
        }
      ]
    }
  ];
  
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
      <img src="/static/1.png" alt="관심지역 현황 이미지" class="w-full rounded-lg shadow-md sticky top-4">
    </div>
  </div>

  <!-- 콘텐츠 영역 (오른쪽) -->
  <div class="md:w-2/3">
    <!-- 제목 -->
    <h1 class="text-3xl font-bold text-center mb-4">관심지역 변동 분석</h1>
    <p class="text-gray-600 text-center mb-8">업소 수, 유동인구, 매출 등의 변동성을 분석하는 방법</p>
    
    <!-- 담당자를 위한 설명 섹션 -->
    <section class="mb-8 bg-yellow-50 p-6 rounded-lg border border-yellow-200">
      <h2 class="text-xl font-semibold mb-3 text-yellow-800">📋 담당자 가이드</h2>
      <p class="mb-4 text-yellow-800">이 페이지는 관심지역의 주요 지표 변동을 감지하고 사용자에게 알림을 제공하는 시스템의 작동 원리를 설명합니다. 아래 내용을 통해 변동성 감지 방법과 알림 생성 프로세스를 이해할 수 있습니다.</p>
      
      <div class="mb-4">
        <h3 class="font-semibold mb-2 text-yellow-800">주요 기능:</h3>
        <ul class="list-disc pl-6 text-yellow-700">
          <li>통계적 방법(평균, 표준편차)을 활용한 변동성 감지</li>
          <li>리커트 척도(1-5)를 통한 변동 정도 수치화</li>
          <li>상위 지역과의 비교를 통한 상대적 변동성 분석</li>
          <li>변동 감지 시 자동 알림 메시지 생성 및 발송</li>
        </ul>
      </div>
      
      <div>
        <h3 class="font-semibold mb-2 text-yellow-800">활용 방법:</h3>
        <ol class="list-decimal pl-6 text-yellow-700">
          <li>각 지표별 데이터 수집 및 평균/표준편차 계산</li>
          <li>리커트 척도 기준에 따른 변동성 판단</li>
          <li>상위 지역과 비교하여 상대적 변동성 확인</li>
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
          {#each categories as cat}
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
          {#each likertScale as scale}
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

    <!-- 3. 상위 지역(시·군·구) 비교 -->
    <section class="mb-8">
      <h2 class="text-xl font-semibold mb-3">🏙️ 상위 지역(시·군·구) 비교</h2>
      <ul class="list-disc pl-6 text-gray-700">
        {#each compareLevels as level}
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
        {#each kakaoExamples as example}
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
        <li>📌 각 항목의 변동 주기에 맞는 평균값을 산출해야 함.</li>
        <li>📌 표준편차를 활용하여 변동성을 리커트 척도로 평가.</li>
        <li>📌 상위 지역(시·군·구)과 비교하여 상대적 변동성을 분석.</li>
        <li>📌 변동성 감지 시 자동으로 카카오톡 알림 메시지 생성 및 발송.</li>
        <li>📌 사용자가 중요 변화를 놓치지 않도록 핵심 헤드라인 2-3개 제공.</li>
      </ul>
    </section>
  </div>
</div> 