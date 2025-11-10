'use client';

import { createSupabaseResourceHook } from './use-supabase-resource';

const booksResource = createSupabaseResourceHook({
  table: 'ksiazki',
  channel: 'ksiazki_changes',
  orderBy: { column: 'tytul', ascending: true },
  autoCreatedBy: true,
  errorMessages: {
    fetch: 'Błąd pobierania książek',
    insert: 'Błąd dodawania książki',
    update: 'Błąd aktualizacji książki',
    delete: 'Błąd usuwania książki',
  },
});

export function useKsiazki() {
  const { data, loading, error, insert, update, remove, refresh } =
    booksResource.useResource();

  return {
    ksiazki: data,
    loading,
    error,
    addKsiazka: insert,
    updateKsiazka: update,
    deleteKsiazka: remove,
    refresh,
  };
}

export function useKsiazka(id: string) {
  const { record: ksiazka, loading, error } = booksResource.useSupabaseRecord(id);

  return { ksiazka, loading, error };
}
