import { supabase } from '$lib/supabaseClient';

export async function getStudents(subjectId = null) {
  let query = supabase
    .from('students')
    .select(`
      *,
      student_subjects!inner (
        subject_id,
        progress
      )
    `);

  if (subjectId) {
    query = query.eq('student_subjects.subject_id', subjectId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createStudent(student, subjectIds) {
  const { data: newStudent, error: studentError } = await supabase
    .from('students')
    .insert(student)
    .select()
    .single();

  if (studentError) throw studentError;

  const studentSubjects = subjectIds.map(subjectId => ({
    student_id: newStudent.id,
    subject_id: subjectId,
    progress: 0
  }));

  const { error: relationError } = await supabase
    .from('student_subjects')
    .insert(studentSubjects);

  if (relationError) throw relationError;
  return newStudent;
}

export async function updateStudent(id, updates) {
  const { data, error } = await supabase
    .from('students')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteStudent(id) {
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id);

  if (error) throw error;
} 