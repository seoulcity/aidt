<!-- src/lib/components/FeatureCard.svelte -->
<script lang="ts">
	export let href: string | undefined = undefined;
	export let title: string;
	export let description: string;
	export let icon: string;
	export let color: 'blue' | 'green' | 'orange' | 'purple' | 'gray' = 'blue';
	export let disabled: boolean = false;

	const colorClasses = {
		blue: {
			border: 'border-blue-100 hover:border-blue-500',
			bg: 'bg-blue-100',
			text: 'text-blue-600',
			hover: 'group-hover:text-blue-600'
		},
		green: {
			border: 'border-green-100 hover:border-green-500',
			bg: 'bg-green-100',
			text: 'text-green-600',
			hover: 'group-hover:text-green-600'
		},
		orange: {
			border: 'border-orange-100 hover:border-orange-500',
			bg: 'bg-orange-100',
			text: 'text-orange-600',
			hover: 'group-hover:text-orange-600'
		},
		purple: {
			border: 'border-purple-100 hover:border-purple-500',
			bg: 'bg-purple-100',
			text: 'text-purple-600',
			hover: 'group-hover:text-purple-600'
		},
		gray: {
			border: 'border-gray-100',
			bg: 'bg-gray-100',
			text: 'text-gray-400',
			hover: ''
		}
	};
</script>

{#if href && !disabled}
	<a
		{href}
		class="group bg-white border-2 {colorClasses[color].border} rounded-xl p-6 transition-all duration-200 shadow-sm hover:shadow-md"
	>
		<div class="flex items-center mb-4">
			<div class="w-10 h-10 {colorClasses[color].bg} rounded-lg flex items-center justify-center mr-4">
				<span class="material-symbols-rounded {colorClasses[color].text}">{icon}</span>
			</div>
			<h3 class="text-xl font-bold text-gray-800 {colorClasses[color].hover}">{title}</h3>
		</div>
		<p class="text-gray-600">{description}</p>
	</a>
{:else}
	<div
		class="group bg-gray-50 border-2 border-gray-100 rounded-xl p-6 cursor-not-allowed"
		aria-disabled="true"
	>
		<div class="flex items-center mb-4">
			<div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
				<span class="material-symbols-rounded text-gray-400">{icon}</span>
			</div>
			<h3 class="text-xl font-bold text-gray-400">{title}</h3>
		</div>
		<p class="text-gray-400">{description}</p>
		{#if disabled}
			<span class="inline-block mt-2 text-sm text-gray-400">(준비중)</span>
		{/if}
	</div>
{/if} 