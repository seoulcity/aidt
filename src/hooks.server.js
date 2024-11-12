// src/hooks.server.js
import { FileManager } from '$lib/utils/fileManager';

const fileManager = new FileManager();

// 서버 시작 시 tmp 디렉토리 생성
fileManager.ensureTempDir().catch(console.error);

// 매 시간마다 오래된 임시 파일 정리
setInterval(() => {
    fileManager.cleanupTempFiles().catch(console.error);
}, 1000 * 60 * 60); // 1시간마다

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
    return await resolve(event);
} 