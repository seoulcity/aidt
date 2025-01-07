// src/routes/api/pdf-extract/+server.js
import { json } from '@sveltejs/kit';
import { writeFile, mkdir, readFile, rm } from 'fs/promises';
import { PDFExtractor } from '$lib/utils/ServerPDFExtractor.js';
import path from 'path';
import { existsSync } from 'fs';

export const POST = async ({ request }) => {
    let tempFilePath = null;
    let outputPath = null;

    try {
        console.log('PDF 추출 요청 시작');

        const formData = await request.formData();
        const file = formData.get('file');
        const extractType = formData.get('type') || 'text';
        
        if (!file) {
            console.error('파일이 제공되지 않음');
            return json({ 
                success: false, 
                error: 'No file provided' 
            }, { status: 400 });
        }

        console.log('파일 크기:', file.size, 'bytes');
        console.log('추출 타입:', extractType);

        // tmp 디렉토리 생성 (static 경로 사용)
        const tempDir = path.join(process.cwd(), 'static', 'tmp');
        try {
            if (!existsSync(tempDir)) {
                await mkdir(tempDir, { recursive: true });
            }
            console.log('임시 디렉토리 준비 완료:', tempDir);
        } catch (err) {
            console.error('임시 디렉토리 생성 실패:', err);
            return json({ 
                success: false, 
                error: '임시 디렉토리 생성 실패' 
            }, { status: 500 });
        }

        const timestamp = Date.now();
        tempFilePath = path.join(tempDir, `input_${timestamp}.pdf`);
        outputPath = path.join(tempDir, `output_${timestamp}.md`);
        
        try {
            // PDF 파일 저장
            const buffer = Buffer.from(await file.arrayBuffer());
            await writeFile(tempFilePath, buffer);
            console.log('PDF 파일 저장 완료:', tempFilePath);
        } catch (err) {
            console.error('PDF 파일 저장 실패:', err);
            return json({ 
                success: false, 
                error: 'PDF 파일 저장 실패' 
            }, { status: 500 });
        }

        try {
            // PDF 추출 실행
            console.log('PDF 추출 시작');
            const extractor = new PDFExtractor();
            const result = await extractor.extractPDF(tempFilePath, outputPath, extractType);
            console.log('PDF 추출 완료');

            // 추출된 마크다운 파일 읽기
            const content = await readFile(outputPath, 'utf-8');
            console.log('추출된 내용 길이:', content.length);

            return json({
                success: true,
                content,
                ...result
            });
        } catch (err) {
            console.error('PDF 처리 중 오류:', err);
            return json({ 
                success: false, 
                error: err.message || 'PDF 처리 중 오류 발생' 
            }, { status: 500 });
        }
    } catch (err) {
        console.error('전체 프로세스 실패:', err);
        return json({ 
            success: false, 
            error: err.message || 'PDF 추출 중 오류가 발생했습니다.' 
        }, { status: 500 });
    } finally {
        // 임시 파일 정리
        try {
            if (tempFilePath && existsSync(tempFilePath)) {
                await rm(tempFilePath);
                console.log('임시 PDF 파일 삭제 완료');
            }
            if (outputPath && existsSync(outputPath)) {
                await rm(outputPath);
                console.log('임시 출력 파일 삭제 완료');
            }
        } catch (err) {
            console.error('임시 파일 정리 중 오류:', err);
        }
    }
}; 