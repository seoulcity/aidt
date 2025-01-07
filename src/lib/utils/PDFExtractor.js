// src/lib/utils/PDFExtractor.js
export class PDFExtractor {
    constructor() {
        this.currentFile = null;
        this.currentPage = null;
    }

    async analyzePage(file, pageNumber) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('page_number', pageNumber.toString());
            formData.append('extract_type', 'analyze');

            const response = await fetch('/api/pdf', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (!result.success) {
                console.warn('Page analysis warning:', result.error);
                // 오류가 발생해도 빈 배열을 반환하여 UI가 계속 작동하도록 함
                return {
                    success: true,
                    elements: []
                };
            }

            return {
                success: true,
                elements: result.elements || []
            };

        } catch (error) {
            console.error('Page analysis error:', error);
            // 오류 발생시에도 빈 배열 반환
            return {
                success: true, // UI 흐름을 방해하지 않기 위해 success를 true로 설정
                elements: []
            };
        }
    }

    async extractPDF(file, extractType, pageNumber, regions = null) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('extract_type', extractType);
            formData.append('page_number', pageNumber.toString());
            
            if (regions) {
                formData.append('regions', JSON.stringify(regions));
            }

            const response = await fetch('/api/pdf', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Extraction failed');
            }

            return {
                success: true,
                content: result.content,
                page: pageNumber
            };

        } catch (error) {
            console.error('Extraction error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
} 