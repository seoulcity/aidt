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
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.error) {
                if (result.error.includes('need item of full page image list')) {
                    console.warn('Page image data not ready, retrying...');
                    return [];
                }
                throw new Error(result.error);
            }

            if (!result.success) {
                return [];
            }

            if (!result.elements || !Array.isArray(result.elements)) {
                console.warn('Invalid elements data, returning empty array');
                return [];
            }
            
            const validElements = result.elements.filter(element => {
                const isValid = element && 
                              element.type && 
                              Array.isArray(element.bbox) && 
                              element.bbox.length === 4;
                
                if (!isValid) {
                    console.warn('Filtering out invalid element:', element);
                }
                
                return isValid;
            });

            return validElements;

        } catch (error) {
            console.error('Failed to analyze page elements:', error);
            return [];
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

    /**
     * 특정 영역의 표를 추출
     */
    static async extractTable(file, pageNumber, bbox) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('page_number', pageNumber);
            formData.append('bbox', JSON.stringify(bbox));
            
            const response = await fetch('/api/pdf/extract-table', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Table extraction failed');
            }
            
            return result.content;
        } catch (error) {
            console.error('Table extraction failed:', error);
            throw error;
        }
    }
} 