import { supabase } from '$lib/supabaseClient';

export async function getAssessmentTypes() {
    const { data, error } = await supabase
        .from('assessment_types')
        .select('*');

    if (error) throw error;
    return data;
} 