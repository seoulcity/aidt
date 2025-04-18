import { json } from '@sveltejs/kit';

export async function POST({ request }) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const pageNumber = parseInt(formData.get('page_number')) || 1;
        const bbox = formData.get('bbox');
        
        // In production environment, we don't have access to the PDF processing server
        // Return a dummy response with an error message
        return json({
            success: false,
            error: 'Table extraction is not available in production. Please run the application locally with the PDF processing server running.',
            content: '| Column 1 | Column 2 |\n|----------|----------|\n| Not | Available |',
            page: pageNumber,
            table_data: []
        });
    } catch (error) {
        console.error('Table extraction error:', error);
        return json({
            success: false,
            error: error.message || 'Table extraction failed'
        }, { status: 500 });
    }
} 