'use client';

import { createSupabaseResourceHook } from './use-supabase-resource';

const uczenKsiazkaResource = createSupabaseResourceHook({
  table: 'uczen_ksiazka',
  channel: 'uczen_ksiazka_changes',
  filterColumns: ['student_id'] as const,
  orderBy: { column: 'created_at', ascending: false },
  autoCreatedBy: true,
  errorMessages: {
    fetch: 'Błąd pobierania przypisań książek',
    insert: 'Błąd dodawania przypisania książki',
    update: 'Błąd aktualizacji przypisania książki',
    delete: 'Błąd usuwania przypisania książki',
  },
});

export function useUczenKsiazki(studentId?: string) {
  const { data, loading, error, insert, update, remove, refresh } =
    uczenKsiazkaResource.useResource(
      studentId ? { student_id: studentId } : undefined
    );

  return {
    assignments: data,
    loading,
    error,
    addAssignment: insert,
    updateAssignment: update,
    deleteAssignment: remove,
    refresh,
  };
}

export function useUczenKsiazka(id: string) {
  const { record: assignment, loading, error } =
    uczenKsiazkaResource.useSupabaseRecord(id);

  return { assignment, loading, error };
}
