import { supabase } from '$lib/supabaseClient';

export async function getContents(subjectId) {
  const { data, error } = await supabase
    .from('contents')
    .select('*')
    .eq('subject_id', subjectId);

  if (error) throw error;
  return data;
}

export async function createContent(content) {
  const { data, error } = await supabase
    .from('contents')
    .insert(content)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateContent(id, updates) {
  const { data, error } = await supabase
    .from('contents')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteContent(id) {
  const { error } = await supabase
    .from('contents')
    .delete()
    .eq('id', id);

  if (error) throw error;
} 