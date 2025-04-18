// src/routes/api/pdf-extract/+server.js
import { json } from '@sveltejs/kit';

// This endpoint is disabled to prevent build errors
export const POST = async ({ request }) => {
    return json({
        success: false,
        error: 'This endpoint is disabled for production. Please use /api/pdf endpoint instead.'
    }, { status: 400 });
}; 