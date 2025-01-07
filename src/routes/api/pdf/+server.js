// src/routes/api/pdf/+server.js
import { json } from '@sveltejs/kit';

export async function POST({ request }) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const extractType = formData.get('extract_type') || 'text';
        const pageNumber = parseInt(formData.get('page_number')) || 1;
        
        // FastAPI 서버로 요청 전달
        const apiFormData = new FormData();
        apiFormData.append('file', file);
        apiFormData.append('extract_type', extractType);
        apiFormData.append('page_number', pageNumber.toString());

        const response = await fetch('http://localhost:8000/pdf', {
            method: 'POST',
            body: apiFormData
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