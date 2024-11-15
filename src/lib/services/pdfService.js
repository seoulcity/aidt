// src/lib/services/pdfService.js
export class PDFService {
    /**
     * 페이지 요소들을 분석하여 가져옴
     */
    static async analyzePageElements(file, pageNumber) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('page_number', pageNumber);
            
            const response = await fetch('/api/pdf/analyze', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to analyze page');
            }
            
            return result.elements;
        } catch (error) {
            console.error('Failed to analyze page elements:', error);
            throw error;
        }
    }

    /**
     * 선택된 요소들을 추출
     */
    static async extractSelectedElements(file, extractType, pageNumber, selectedElements) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('extract_type', extractType);
            formData.append('page_number', pageNumber);
            formData.append('selected_elements', JSON.stringify(
                selectedElements.map(e => ({
                    type: e.type,
                    bbox: e.bbox
                }))
            ));
            
            const response = await fetch('/api/pdf', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Extraction failed');
            }
            
            return result.content;
        } catch (error) {
            console.error('Extraction failed:', error);
            throw error;
        }
    }
} 