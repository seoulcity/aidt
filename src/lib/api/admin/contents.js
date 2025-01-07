import { adminSupabase } from '$lib/adminSupabaseClient';

export async function getContents(subjectId) {
  const { data, error } = await adminSupabase
    .from('contents')
    .select('*')
    .eq('subject_id', subjectId);

  if (error) throw error;
  return data;
}

export async function createContent(content) {
  const { data, error } = await adminSupabase
    .from('contents')
    .insert(content)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateContent(id, updates) {
  const { data, error } = await adminSupabase
    .from('contents')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteContent(id) {
  const { error } = await adminSupabase
    .from('contents')
    .delete()
    .eq('id', id);

  if (error) throw error;
} 