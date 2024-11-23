import { adminSupabase } from '$lib/adminSupabaseClient';

export async function getAssessments(subjectId) {
  const { data, error } = await adminSupabase
    .from('assessments')
    .select('*')
    .eq('subject_id', subjectId);

  if (error) throw error;
  return data;
}

export async function createAssessment(assessment) {
  const { data, error } = await adminSupabase
    .from('assessments')
    .insert(assessment)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateAssessment(id, updates) {
  const { data, error } = await adminSupabase
    .from('assessments')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAssessment(id) {
  const { error } = await adminSupabase
    .from('assessments')
    .delete()
    .eq('id', id);

  if (error) throw error;
} 