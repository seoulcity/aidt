// src/routes/api/pdf/+server.js
import { json } from '@sveltejs/kit';

export async function POST({ request }) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const extractType = formData.get('extract_type') || 'text';
        const pageNumber = parseInt(formData.get('page_number')) || 1;
        
        // In production environment, we don't have access to the PDF processing server
        // Return a dummy response with an error message
        return json({
            success: false,
            error: 'PDF extraction is not available in production. Please run the application locally with the PDF processing server running.',
            content: 'PDF extraction unavailable in production',
            elements: []
        });
    } catch (error) {
        console.error('PDF extraction error:', error);
        return json({
            success: false,
            error: error.message || 'PDF extraction failed'
        }, { status: 500 });
    }
} 