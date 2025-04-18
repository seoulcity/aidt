// src/routes/api/pdf-extract/+server.js
import { json } from '@sveltejs/kit';
import { writeFile, mkdir, readFile, rm } from 'fs/promises';
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

        // Forward to the existing API endpoint
        const apiFormData = new FormData();
        apiFormData.append('file', file);
        apiFormData.append('extract_type', extractType);
        apiFormData.append('page_number', '1'); // Default to first page

        try {
            // Forward to the existing API endpoint
            const response = await fetch('http://localhost:8000/pdf', {
                method: 'POST',
                body: apiFormData
            });

            const data = await response.json();
            return json(data);
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
    }
}; 