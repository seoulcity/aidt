import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const OCR_SECRET = 'RG5ITk1RVkxJY0dRZmxpcXBiS1JoQXdjYlV1ZnRMc0o=';
const OCR_URL = 'https://ho3vstfg91.apigw.ntruss.com/custom/v1/36393/97d7e2039a7a2bab9019cc2409590f090dee4025ec55406f4a3c907dbf30f93f/general';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { imageData } = await request.json();
        if (!imageData) {
            return new Response(JSON.stringify({ error: 'No image data provided' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const timestamp = new Date().getTime();
        const requestBody = {
            images: [
                {
                    format: 'png',
                    name: 'handwriting',
                    data: imageData.split(',')[1]
                }
            ],
            lang: 'ko',
            requestId: timestamp.toString(),
            resultType: 'string',
            timestamp: timestamp,
            version: 'V1'
        };

        console.log('Sending request to OCR API...');
        const response = await fetch(OCR_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-OCR-SECRET': OCR_SECRET
            },
            body: JSON.stringify(requestBody)
        });

        console.log('OCR API Response status:', response.status);
        const responseText = await response.text();
        console.log('OCR API Response:', responseText);

        if (!response.ok) {
            return new Response(JSON.stringify({ error: `OCR request failed: ${response.status} ${responseText}` }), {
                status: response.status,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const result = JSON.parse(responseText);
        if (!result.images?.[0]?.inferResult) {
            return new Response(JSON.stringify({ error: 'Invalid OCR response format' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (result.images[0].inferResult !== 'SUCCESS') {
            return new Response(JSON.stringify({ error: result.images[0].message }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return json({ texts: result.images[0].fields.map((field: any) => field.inferText) });
    } catch (error) {
        console.error('OCR Error:', error);
        return new Response(JSON.stringify({ error: `OCR processing failed: ${error.message}` }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}; 