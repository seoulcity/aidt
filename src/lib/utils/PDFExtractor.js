// src/lib/utils/PDFExtractor.js
export class PDFExtractor {
    async extractPDF(file, extractType = 'text') {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', extractType);

            const response = await fetch('/api/pdf-extract', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('PDF 추출 실패');
            }

            return await response.json();
        } catch (error) {
            console.error('PDF 추출 중 오류:', error);
            throw error;
        }
    }
} 