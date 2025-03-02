import type { OcrRequest, OcrResponse } from '$lib/types/ocr';

const OCR_SECRET = 'RG5ITk1RVkxJY0dRZmxpcXBiS1JoQXdjYlV1ZnRMc0o=';
const OCR_URL = 'https://ho3vstfg91.apigw.ntruss.com/custom/v1/36393/97d7e2039a7a2bab9019cc2409590f090dee4025ec55406f4a3c907dbf30f93f/general';

export async function recognizeText(imageData: string): Promise<string[]> {
    try {
        console.log('Sending OCR request...');
        const response = await fetch('/api/ocr', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ imageData })
        });

        console.log('OCR response status:', response.status);
        const result = await response.json();
        console.log('OCR response:', result);

        if (!response.ok) {
            throw new Error(result.error || 'OCR request failed');
        }

        if (result.error) {
            throw new Error(result.error);
        }

        return result.texts || [];
    } catch (error) {
        console.error('OCR Error:', error);
        throw error;
    }
} 