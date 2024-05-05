<!-- src/routes/+page.svelte -->

<script>
	// Uncomment the following section after configuring Supabase
	// export let data;
</script>

<div class="container mx-auto px-4 py-8">
	<header class="mb-8">
		<h1 class="text-4xl font-bold mb-4">
			Welcome to SvelteKit + Tailwind CSS + Supabase Boilerplate
		</h1>
		<p class="text-xl text-gray-600">
			Start building your awesome application with this boilerplate!
		</p>
	</header>

	<section class="grid grid-cols-1 md:grid-cols-3 gap-8">
		<div class="bg-white rounded-lg shadow-md p-6">
		  <div class="w-16 h-16 mb-4">
			<img src="/svelte.png" alt="Svelte Logo" class="object-contain w-full h-full">
		  </div>
		  <h2 class="text-2xl font-bold mb-2">
			<a href="https://kit.svelte.dev/docs/introduction" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">SvelteKit</a>
		  </h2>
		  <p class="text-gray-600">Build fast and lightweight web applications with SvelteKit.</p>
		</div>
		<div class="bg-white rounded-lg shadow-md p-6">
		  <div class="w-16 h-16 mb-4">
			<img src="/tailwindcss.png" alt="Tailwind CSS Logo" class="object-contain w-full h-full">
		  </div>
		  <h2 class="text-2xl font-bold mb-2">
			<a href="https://tailwindcss.com/docs/guides/sveltekit" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">Tailwind CSS</a>
		  </h2>
		  <p class="text-gray-600">Rapidly build modern websites with utility-first CSS framework.</p>
		</div>
		<div class="bg-white rounded-lg shadow-md p-6">
		  <div class="w-16 h-16 mb-4">
			<img src="/supabase.png" alt="Supabase Logo" class="object-contain w-full h-full">
		  </div>
		  <h2 class="text-2xl font-bold mb-2">
			<a href="https://supabase.com/docs/guides/getting-started/quickstarts/sveltekit" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">Supabase</a>
		  </h2>
		  <p class="text-gray-600">Seamlessly integrate backend and database management with Supabase.</p>
		</div>
	  </section>

	<!-- Uncomment the following section after configuring Supabase -->
	<!--
	<section class="mt-8">
		<h2 class="text-2xl font-bold mb-4">Countries</h2>
		<ul class="list-none">
			{#each data.countries as country}
				<li class="py-2">{country.name}</li>
			{/each}
		</ul>
	</section>
	 -->
</div>

<footer class="mt-8 text-center">
	<p class="text-gray-600">
		View the source code on <a
			href="https://github.com/seoulcity/sveltekit_tailwindcss_supabase_bolierplate"
			target="_blank"
			rel="noopener noreferrer"
			class="text-blue-600 hover:underline">GitHub</a
		>
	</p>
	<p class="text-gray-600 text-sm mt-2">
		&copy; 2023 Kim JungHyun (<a
			href="https://linkedin.com/in/seoulite"
			target="_blank"
			rel="noopener noreferrer"
			class="text-blue-600 hover:underline">LinkedIn</a
		>) | Licensed under
		<a
			href="https://creativecommons.org/licenses/by/4.0/"
			target="_blank"
			rel="noopener noreferrer"
			class="text-blue-600 hover:underline">CC BY 4.0</a
		>
	</p>
</footer>
