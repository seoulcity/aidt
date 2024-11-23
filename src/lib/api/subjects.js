import { supabase } from '$lib/supabaseClient';

export async function getSubjects() {
  const { data, error } = await supabase
    .from('subjects')
    .select('*');
  
  if (error) throw error;
  return data;
}

export async function createSubject(subject) {
  const { data, error } = await supabase
    .from('subjects')
    .insert(subject)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateSubject(id, updates) {
  const { data, error } = await supabase
    .from('subjects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteSubject(id) {
  const { error } = await supabase
    .from('subjects')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
} 