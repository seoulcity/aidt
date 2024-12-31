<!-- src/routes/+page.svelte -->

<script lang="ts">
	import type { TabItem } from '$lib/types/navigation';
	import MathFeatures from '$lib/components/subjects/MathFeatures.svelte';
	import EnglishFeatures from '$lib/components/subjects/EnglishFeatures.svelte';
	import TabNavigation from '$lib/components/navigation/TabNavigation.svelte';
	
	let activeTab: 'math' | 'english' = 'math';

	const tabs: TabItem[] = [
		{
			id: 'math',
			title: '수학 교과 기능',
			icon: 'functions',
			count: 2,
			countColor: 'blue'
		},
		{
			id: 'english',
			title: '영어 교과 기능',
			icon: 'translate',
			count: 3,
			countColor: 'gray'
		}
	];

	function switchTab(tabId: string) {
		activeTab = tabId as 'math' | 'english';
		const mathSection = document.querySelector('section:first-of-type')!;
		const englishSection = document.querySelector('section:last-of-type')!;
		
		if (tabId === 'english') {
			mathSection.classList.add('hidden');
			englishSection.classList.remove('hidden');
		} else {
			mathSection.classList.remove('hidden');
			englishSection.classList.add('hidden');
		}
	}
</script>

<div class="container mx-auto px-4 py-8">
	<header class="mb-8 text-center">
		<img src="/og_img.png" alt="미래엔 로고" class="mx-auto mb-4 max-w-md" />
		<div class="flex items-center justify-center gap-2 mb-2">
			<h1 class="text-xl font-semibold text-gray-800">AI다움</h1>
			<span class="px-2 py-0.5 text-xs bg-blue-50 text-blue-500 rounded-full">βeta</span>
		</div>
		<p class="text-gray-600">AI 디지털교과서 솔루션</p>
	</header>

	<TabNavigation {tabs} {activeTab} onTabChange={switchTab} />

	<div class="max-w-6xl mx-auto mb-16">
		<section>
			<MathFeatures />
		</section>

		<section class="hidden">
			<EnglishFeatures />
		</section>
	</div>

	<footer class="text-center mt-auto">
		<p class="text-gray-600 mb-2">Powered by</p>
		<img src="/unnamed.jpg" alt="Powered by" class="mx-auto max-w-[200px] mb-4" />
	</footer>
</div>