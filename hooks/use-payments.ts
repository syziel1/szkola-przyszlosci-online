'use client';

import { createSupabaseResourceHook } from './use-supabase-resource';

const paymentsResource = createSupabaseResourceHook({
  table: 'platnosci',
  channel: 'platnosci_changes',
  filterColumns: ['student_id'] as const,
  orderBy: { column: 'data_platnosci', ascending: false },
  autoCreatedBy: true,
  errorMessages: {
    fetch: 'Błąd pobierania płatności',
    insert: 'Błąd dodawania płatności',
    update: 'Błąd aktualizacji płatności',
    delete: 'Błąd usuwania płatności',
  },
});

export function usePayments(studentId?: string) {
  const { data, loading, error, insert, update, remove, refresh } =
    paymentsResource.useResource(
      studentId ? { student_id: studentId } : undefined
    );

  return {
    payments: data,
    loading,
    error,
    addPayment: insert,
    updatePayment: update,
    deletePayment: remove,
    refresh,
  };
}

export function usePayment(id: string) {
  const { record: payment, loading, error } = paymentsResource.useSupabaseRecord(id);

  return { payment, loading, error };
}
