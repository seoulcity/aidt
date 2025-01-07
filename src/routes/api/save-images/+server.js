// src/routes/api/save-images/+server.js
import { json } from '@sveltejs/kit';
import fs from 'fs/promises';
import path from 'path';

export async function POST({ request }) {
    try {
        const { images, pdfName } = await request.json();
        
        // 이미지 저장 디렉토리 생성
        const saveDir = path.join(process.cwd(), 'static', 'pdf-images', pdfName.replace('.pdf', ''));
        await fs.mkdir(saveDir, { recursive: true });
        
        // 이미지 데이터 저장
        const savedImages = [];
        for (const image of images) {
            const filename = `${image.id}.png`;
            const filePath = path.join(saveDir, filename);
            
            // 이미지 데이터를 파일로 저장
            // 실제 구현에서는 PDF.js에서 추출한 이미지 데이터를 저장
            savedImages.push({
                originalId: image.id,
                path: `/pdf-images/${pdfName.replace('.pdf', '')}/${filename}`
            });
        }
        
        return json({ success: true, savedImages });
    } catch (error) {
        console.error('이미지 저장 중 오류:', error);
        return json({ success: false, error: error.message }, { status: 500 });
    }
} 