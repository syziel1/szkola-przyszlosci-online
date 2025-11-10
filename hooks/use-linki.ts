'use client';

import type { Database } from '@/lib/supabase';

import { createSupabaseResourceHook } from './use-supabase-resource';

const linksResource = createSupabaseResourceHook({
  table: 'linki',
  channel: 'linki_changes',
  filterColumns: ['owner_type', 'owner_id'] as const,
  orderBy: { column: 'created_at', ascending: false },
  autoCreatedBy: true,
  errorMessages: {
    fetch: 'Błąd pobierania linków',
    insert: 'Błąd dodawania linku',
    update: 'Błąd aktualizacji linku',
    delete: 'Błąd usuwania linku',
  },
});

export function useLinki(
  ownerType?: Database['public']['Enums']['owner_type_enum'],
  ownerId?: string
) {
  const { data, loading, error, insert, update, remove, refresh } =
    linksResource.useResource(
      ownerType && ownerId
        ? { owner_type: ownerType, owner_id: ownerId }
        : undefined
    );

  return {
    linki: data,
    loading,
    error,
    addLink: insert,
    updateLink: update,
    deleteLink: remove,
    refresh,
  };
}

export function useLink(id: string) {
  const { record: link, loading, error } = linksResource.useSupabaseRecord(id);

  return { link, loading, error };
}
