const PDFExtractor = require('./pdfExtractor');

async function main() {
    const extractor = new PDFExtractor();
    
    try {
        // 텍스트 추출
        const result = await extractor.extractPDF(
            'input.pdf',
            'output.md',
            'text'
        );
        console.log('텍스트 추출 결과:', result);

        // 테이블 추출
        const tableResult = await extractor.extractPDF(
            'input_tables.pdf',
            'output_tables.md',
            'tables'
        );
        console.log('테이블 추출 결과:', tableResult);

        // 이미지 추출
        const imageResult = await extractor.extractPDF(
            'input_images.pdf',
            'output_images.md',
            'images'
        );
        console.log('이미지 추출 결과:', imageResult);
    } catch (error) {
        console.error('에러 발생:', error);
    }
}

main(); 