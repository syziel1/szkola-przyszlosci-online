'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/supabase';

type Diagnoza = Database['public']['Tables']['diagnozy']['Row'];
type DiaignozaInsert = Database['public']['Tables']['diagnozy']['Insert'];
type DiagnozaUpdate = Database['public']['Tables']['diagnozy']['Update'];

export function useDiagnozy(studentId?: string) {
  const [diagnozy, setDiagnozy] = useState<Diagnoza[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDiagnozy = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('diagnozy')
        .select('*')
        .order('data_testu', { ascending: false });

      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setDiagnozy(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd pobierania diagnoz');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnozy();

    const channel = supabase
      .channel('diagnozy_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'diagnozy',
        },
        () => {
          fetchDiagnozy();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentId]);

  const addDiagnoza = async (diagnoza: DiaignozaInsert) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Użytkownik niezalogowany');

      const { data, error: insertError } = await supabase
        .from('diagnozy')
        .insert({ ...diagnoza, created_by: userData.user.id })
        .select()
        .single();

      if (insertError) throw insertError;
      return { data, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Błąd dodawania diagnozy',
      };
    }
  };

  const updateDiagnoza = async (id: string, updates: DiagnozaUpdate) => {
    try {
      const { data, error: updateError } = await supabase
        .from('diagnozy')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      return { data, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Błąd aktualizacji diagnozy',
      };
    }
  };

  const deleteDiagnoza = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('diagnozy')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      return { error: null };
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : 'Błąd usuwania diagnozy',
      };
    }
  };

  return {
    diagnozy,
    loading,
    error,
    addDiagnoza,
    updateDiagnoza,
    deleteDiagnoza,
    refresh: fetchDiagnozy,
  };
}

export function useDiagnoza(id: string) {
  const [diagnoza, setDiagnoza] = useState<Diagnoza | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDiagnoza = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('diagnozy')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (fetchError) throw fetchError;
        setDiagnoza(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Błąd pobierania diagnozy');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDiagnoza();
    }
  }, [id]);

  return { diagnoza, loading, error };
}
