import { json } from '@sveltejs/kit';

export async function POST({ request }) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const pageNumber = parseInt(formData.get('page_number')) || 1;
        
        // FastAPI 서버로 요청 전달
        const apiFormData = new FormData();
        apiFormData.append('file', file);
        apiFormData.append('page_number', pageNumber.toString());

        const response = await fetch('http://localhost:8000/pdf/analyze', {
            method: 'POST',
            body: apiFormData
        });

        const data = await response.json();
        return json(data);
    } catch (error) {
        console.error('PDF analysis error:', error);
        return json({
            success: false,
            error: error.message || 'PDF analysis failed'
        }, { status: 500 });
    }
} 