<!-- src/routes/+page.svelte -->

<div class="container mx-auto px-4 py-8">
	<header class="mb-8 text-center">
		<img src="/og_img.png" alt="로고" class="mx-auto mb-6 max-w-md" />
	</header>

	<div class="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto mb-12">
		<a
			href="/miraen/common-writing"
			class="bg-blue-500 hover:bg-blue-600 text-white rounded-lg p-6 text-center transition-colors duration-200 shadow-md"
		>
			<h2 class="text-xl font-bold mb-2">공통 영어 쓰기 활동 평가</h2>
			<p class="text-sm text-blue-100">공통 영어 쓰기 활동을 평가해보세요</p>
		</a>

		<a
			href="/miraen/elementary-writing"
			class="bg-green-500 hover:bg-green-600 text-white rounded-lg p-6 text-center transition-colors duration-200 shadow-md"
		>
			<h2 class="text-xl font-bold mb-2">초등 영어 쓰기 활동 평가</h2>
			<p class="text-sm text-green-100">초등 영어 쓰기 활동을 평가해보세요</p>
		</a>
		<a
			href="/miraen/grammar-search"
			class="bg-purple-500 hover:bg-purple-600 text-white rounded-lg p-6 text-center transition-colors duration-200 shadow-md"
		>
			<h2 class="text-xl font-bold mb-2">영문법 검색형 서비스</h2>
			<p class="text-sm text-gray-300">영문법을 쉽게 검색해보세요</p>
		</a>
		<a
			href="/miraen/middle-math"
			class="bg-orange-500 hover:bg-orange-600 text-white rounded-lg p-6 text-center transition-colors duration-200 shadow-md"
		>
			<h2 class="text-xl font-bold mb-2">중등수학 맞춤추천(문항)</h2>
			<p class="text-sm text-orange-100">맞춤형 수학 문제 힌트를 받아보세요</p>
		</a>
		<a
		href="#"
		class="bg-gray-400 text-gray-200 rounded-lg p-6 text-center transition-colors duration-200 shadow-md cursor-not-allowed"  
		aria-disabled="true"
	>
		<h2 class="text-xl font-bold mb-2">초등수학 대시보드 (준비중)</h2>
		<p class="text-sm text-gray-300">초등수학 학습 현황을 확인해보세요</p> 
	</a>
	</div>

	<footer class="text-center mt-auto">
		<p class="text-gray-600 mb-2">Powered by</p>
		<img src="/unnamed.jpg" alt="Powered by" class="mx-auto max-w-[200px] mb-4" />
		<div class="text-gray-600 text-sm tracking-wider">
			AI 디지털 교과서 통합 시스템
			<span class="font-semibold text-blue-600">클라시스</span>
			<span class="text-xs align-super text-blue-500">βeta</span>
		</div>
	</footer>
</div>

<style>
	a {
		text-decoration: none;
	}
</style>
