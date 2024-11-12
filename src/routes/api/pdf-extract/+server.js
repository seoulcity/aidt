// src/routes/api/pdf-extract/+server.js
import { json } from '@sveltejs/kit';
import { writeFile, mkdir, readFile, rm } from 'fs/promises';
import { PDFExtractor } from '$lib/utils/ServerPDFExtractor.js';
import path from 'path';
import { existsSync } from 'fs';

export async function POST({ request }) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const extractType = formData.get('type') || 'text';
        
        if (!file) {
            return json({ success: false, error: 'No file provided' }, { status: 400 });
        }

        // tmp 디렉토리 생성
        const tempDir = path.join(process.cwd(), 'tmp');
        if (!existsSync(tempDir)) {
            await mkdir(tempDir, { recursive: true });
        }

        // 임시 파일 저장
        const tempFilePath = path.join(tempDir, `input_${Date.now()}.pdf`);
        const outputPath = path.join(tempDir, `output_${Date.now()}.md`);
        
        await writeFile(tempFilePath, Buffer.from(await file.arrayBuffer()));
        
        try {
            // PDF 추출 실행
            const extractor = new PDFExtractor();
            const result = await extractor.extractPDF(tempFilePath, outputPath, extractType);
            
            // 추출된 마크다운 파일 읽기
            const content = await readFile(outputPath, 'utf-8');
            
            // 임시 파일 정리
            await Promise.all([
                rm(tempFilePath),
                rm(outputPath)
            ]);
            
            return json({
                success: true,
                content,
                ...result
            });
        } finally {
            // 에러가 발생하더라도 임시 파일 정리 시도
            try {
                await Promise.all([
                    rm(tempFilePath).catch(() => {}),
                    rm(outputPath).catch(() => {})
                ]);
            } catch (e) {
                console.error('임시 파일 정리 중 오류:', e);
            }
        }
    } catch (error) {
        console.error('PDF extraction failed:', error);
        return json({ success: false, error: error.message }, { status: 500 });
    }
} 