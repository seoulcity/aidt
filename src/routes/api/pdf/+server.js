// src/routes/api/pdf/+server.js
import { json } from '@sveltejs/kit';

export async function POST({ request }) {
    try {
        const formData = await request.formData();
        
        // FastAPI 서버로 요청 전달
        const response = await fetch('http://localhost:8000/extract', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        return json(data);
    } catch (error) {
        console.error('PDF extraction error:', error);
        return json({
            success: false,
            error: error.message || 'PDF extraction failed'
        }, { status: 500 });
    }
} 