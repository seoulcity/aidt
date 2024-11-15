// src/lib/utils/PDFExtractor.js
export class PDFExtractor {
    async extractPDF(file, extractType = 'text', pageNumber = 1) {
        try {
            console.log('Extracting PDF:', file.name, 'Type:', extractType, 'Page:', pageNumber);
            
            const formData = new FormData();
            formData.append('file', file);
            formData.append('extract_type', extractType);
            formData.append('page_number', pageNumber.toString());

            const response = await fetch('/api/pdf', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Server error:', response.status, errorData);
                throw new Error(errorData.error || `Server error: ${response.status}`);
            }

            const data = await response.json();
            console.log('Extraction response:', data);

            if (!data.success) {
                throw new Error(data.error || 'PDF extraction failed');
            }

            return data;
        } catch (error) {
            console.error('PDF extraction error:', error);
            throw error;
        }
    }

    async analyzePage(file, pageNumber) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('page_number', pageNumber.toString());

            const response = await fetch('/api/pdf/analyze', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Page analysis failed');
            }

            return data;
        } catch (error) {
            console.error('Page analysis error:', error);
            throw error;
        }
    }
} 