import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// 런타임 설정 없이 Vercel 어댑터 사용
		adapter: adapter()
	},
	preprocess: vitePreprocess()
};

export default config;