'use client';

import { createSupabaseResourceHook } from './use-supabase-resource';

const przedmiotResource = createSupabaseResourceHook({
  table: 'przedmiot_ucznia',
  channel: 'przedmiot_ucznia_changes',
  filterColumns: ['student_id'] as const,
  orderBy: { column: 'subject', ascending: true },
  autoCreatedBy: true,
  errorMessages: {
    fetch: 'Błąd pobierania przedmiotów',
    insert: 'Błąd dodawania przedmiotu',
    update: 'Błąd aktualizacji przedmiotu',
    delete: 'Błąd usuwania przedmiotu',
  },
});

export function usePrzedmiotyUcznia(studentId?: string) {
  const { data, loading, error, insert, update, remove, refresh } =
    przedmiotResource.useResource(
      studentId ? { student_id: studentId } : undefined
    );

  return {
    przedmioty: data,
    loading,
    error,
    addPrzedmiot: insert,
    updatePrzedmiot: update,
    deletePrzedmiot: remove,
    refresh,
  };
}

export function usePrzedmiotUcznia(id: string) {
  const { record: przedmiot, loading, error } =
    przedmiotResource.useSupabaseRecord(id);

  return { przedmiot, loading, error };
}
