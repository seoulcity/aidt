import { supabase } from '$lib/supabaseClient';

export async function getContentTypes() {
    const { data, error } = await supabase
        .from('content_types')
        .select('*');

    if (error) throw error;
    return data;
} 