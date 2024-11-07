// src/routes/api/chat/+server.js
import { json } from '@sveltejs/kit';
import { CLOVA_STUDIO_API_URL, CLOVA_STUDIO_API_KEY, CLOVA_STUDIO_APIGW_KEY } from '$env/static/private';

export async function POST({ request }) {
    try {
        const requestBody = await request.json();
        console.log('Received request body:', requestBody);

        const { systemPrompt, userMessage } = requestBody;
        
        if (!systemPrompt || !userMessage) {
            console.error('Missing required parameters:', { systemPrompt, userMessage });
            throw new Error('systemPrompt and userMessage are required');
        }

        const clovaRequestBody = {
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: userMessage
                }
            ],
            topP: 0.8,
            topK: 0,
            maxTokens: 1000,
            temperature: 0.5,
            repeatPenalty: 5.0,
            stopBefore: [],
            includeAiFilters: true
        };

        console.log('Sending request to CLOVA Studio:', {
            url: CLOVA_STUDIO_API_URL,
            body: clovaRequestBody
        });

        const response = await fetch(CLOVA_STUDIO_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-NCP-CLOVASTUDIO-API-KEY': CLOVA_STUDIO_API_KEY,
                'X-NCP-APIGW-API-KEY': CLOVA_STUDIO_APIGW_KEY,
            },
            body: JSON.stringify(clovaRequestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('CLOVA Studio API Error Response:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText
            });
            throw new Error(`CLOVA Studio API Error: ${response.status} ${response.statusText}\n${errorText}`);
        }

        const data = await response.json();
        console.log('CLOVA Studio API Response:', data);
        
        if (!data.result || !data.result.message || !data.result.message.content) {
            console.error('Invalid response format:', data);
            throw new Error('Invalid response format from CLOVA Studio API');
        }

        return json({
            content: data.result.message.content
        });
    } catch (error) {
        console.error('Detailed error in chat API:', {
            message: error.message,
            stack: error.stack
        });
        return new Response(JSON.stringify({ 
            error: error.message,
            stack: error.stack 
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}
