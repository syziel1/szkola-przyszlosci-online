'use client';

import { createSupabaseResourceHook } from './use-supabase-resource';

const diagnozyResource = createSupabaseResourceHook({
  table: 'diagnozy',
  channel: 'diagnozy_changes',
  filterColumns: ['student_id'] as const,
  orderBy: { column: 'data_testu', ascending: false },
  autoCreatedBy: true,
  errorMessages: {
    fetch: 'Błąd pobierania diagnoz',
    insert: 'Błąd dodawania diagnozy',
    update: 'Błąd aktualizacji diagnozy',
    delete: 'Błąd usuwania diagnozy',
  },
});

export function useDiagnozy(studentId?: string) {
  const { data, loading, error, insert, update, remove, refresh } =
    diagnozyResource.useResource(
      studentId ? { student_id: studentId } : undefined
    );

  return {
    diagnozy: data,
    loading,
    error,
    addDiagnoza: insert,
    updateDiagnoza: update,
    deleteDiagnoza: remove,
    refresh,
  };
}

export function useDiagnoza(id: string) {
  const { record: diagnoza, loading, error } =
    diagnozyResource.useSupabaseRecord(id);

  return { diagnoza, loading, error };
}
