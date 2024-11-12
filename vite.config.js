import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	optimizeDeps: {
		include: ['pdfjs-dist'],
		exclude: ['pdfjs-dist/build/pdf.worker.min.js']
	},
	build: {
		commonjsOptions: {
			include: [/pdfjs-dist/]
		}
	},
	server: {
		fs: {
			strict: false
		}
	}
});
