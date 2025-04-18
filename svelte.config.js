import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			// Vercel Edge 함수 대신 Node.js 함수 사용
			runtime: 'nodejs18.x'
		})
	},
	preprocess: vitePreprocess()
};

export default config;