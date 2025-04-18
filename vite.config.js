import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	optimizeDeps: {
		include: ['pdfjs-dist'],
		exclude: ['pdfjs-dist/build/pdf.worker.min.js', 'langchain', 'langsmith', 'p-queue']
	},
	build: {
		commonjsOptions: {
			include: [/pdfjs-dist/]
		},
		rollupOptions: {
			// langchain 관련 외부 모듈로 처리
			external: ['langchain', 'langsmith', 'p-queue'],
			output: {
				format: 'es'
			}
		},
		ssr: false
	},
	server: {
		fs: {
			strict: false
		},
		proxy: {
			'/api/pdf': 'http://localhost:8000',
			'/api/pdf/analyze': 'http://localhost:8000'
		}
	}
});
