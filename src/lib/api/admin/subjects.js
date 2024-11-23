// src/lib/api/admin/subjects.js
import { adminSupabase } from '$lib/adminSupabaseClient';

export async function getSubjects() {
  const { data, error } = await adminSupabase
    .from('subjects')
    .select('*');
  
  if (error) throw error;
  return data;
}

export async function createSubject(subject) {
  const { data, error } = await adminSupabase
    .from('subjects')
    .insert(subject)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateSubject(id, updates) {
  const { data, error } = await adminSupabase
    .from('subjects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteSubject(id) {
  const { error } = await adminSupabase
    .from('subjects')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
} 