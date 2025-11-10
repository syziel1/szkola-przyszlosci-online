'use client';

import { createSupabaseResourceHook } from './use-supabase-resource';

const studentsResource = createSupabaseResourceHook({
  table: 'uczniowie',
  channel: 'uczniowie_changes',
  orderBy: { column: 'nazwisko', ascending: true },
  autoCreatedBy: true,
  errorMessages: {
    fetch: 'Błąd pobierania uczniów',
    insert: 'Błąd dodawania ucznia',
    update: 'Błąd aktualizacji ucznia',
    delete: 'Błąd usuwania ucznia',
  },
});

export function useStudents() {
  const { data, loading, error, insert, update, remove, refresh } =
    studentsResource.useResource();

  return {
    students: data,
    loading,
    error,
    addStudent: insert,
    updateStudent: update,
    deleteStudent: remove,
    refresh,
  };
}

export function useStudent(id: string) {
  const { record: student, loading, error } =
    studentsResource.useSupabaseRecord(id);

  return { student, loading, error };
}
