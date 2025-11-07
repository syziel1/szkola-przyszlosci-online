'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/supabase';

type Payment = Database['public']['Tables']['platnosci']['Row'];
type PaymentInsert = Database['public']['Tables']['platnosci']['Insert'];
type PaymentUpdate = Database['public']['Tables']['platnosci']['Update'];

export function usePayments(studentId?: string) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('platnosci')
        .select('*')
        .order('data_platnosci', { ascending: false });

      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setPayments(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd pobierania płatności');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();

    const channel = supabase
      .channel('platnosci_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'platnosci',
        },
        () => {
          fetchPayments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentId]);

  const addPayment = async (payment: PaymentInsert) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Użytkownik niezalogowany');

      const { data, error: insertError } = await supabase
        .from('platnosci')
        .insert({ ...payment, created_by: userData.user.id })
        .select()
        .single();

      if (insertError) throw insertError;
      return { data, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Błąd dodawania płatności',
      };
    }
  };

  const updatePayment = async (id: string, updates: PaymentUpdate) => {
    try {
      const { data, error: updateError } = await supabase
        .from('platnosci')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      return { data, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Błąd aktualizacji płatności',
      };
    }
  };

  const deletePayment = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('platnosci')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      return { error: null };
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : 'Błąd usuwania płatności',
      };
    }
  };

  return {
    payments,
    loading,
    error,
    addPayment,
    updatePayment,
    deletePayment,
    refresh: fetchPayments,
  };
}

export function usePayment(id: string) {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('platnosci')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (fetchError) throw fetchError;
        setPayment(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Błąd pobierania płatności');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPayment();
    }
  }, [id]);

  return { payment, loading, error };
}
