import { supabase } from '$lib/supabaseClient';

export async function getAssessments(subjectId) {
  const { data, error } = await supabase
    .from('assessments')
    .select('*')
    .eq('subject_id', subjectId);

  if (error) throw error;
  return data;
}

export async function createAssessment(assessment) {
  const { data, error } = await supabase
    .from('assessments')
    .insert(assessment)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateAssessment(id, updates) {
  const { data, error } = await supabase
    .from('assessments')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAssessment(id) {
  const { error } = await supabase
    .from('assessments')
    .delete()
    .eq('id', id);

  if (error) throw error;
} 