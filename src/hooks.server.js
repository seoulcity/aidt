// src/hooks.server.js
import { FileManager } from '$lib/utils/fileManager';
import { dev } from '$app/environment';
import fs from 'fs';
import path from 'path';

const fileManager = new FileManager();

// 서버 시작 시 tmp 디렉토리 생성
fileManager.ensureTempDir().catch(console.error);

// 매 시간마다 오래된 임시 파일 정리
setInterval(() => {
    fileManager.cleanupTempFiles().catch(console.error);
}, 1000 * 60 * 60); // 1시간마다

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
  // Handle PDF.js worker file request
  if (event.url.pathname === '/pdf.worker.min.js') {
    const workerPath = dev
      ? 'node_modules/pdfjs-dist/build/pdf.worker.min.js'
      : 'node_modules/pdfjs-dist/build/pdf.worker.min.js';

    try {
      const workerFile = fs.readFileSync(path.resolve(process.cwd(), workerPath));
      return new Response(workerFile, {
        headers: {
          'Content-Type': 'application/javascript',
          'Cache-Control': 'public, max-age=31536000'
        }
      });
    } catch (error) {
      console.error('Error serving PDF worker file:', error);
      return new Response('Worker file not found', { status: 404 });
    }
  }

  return await resolve(event);
} 