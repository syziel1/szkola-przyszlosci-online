'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/supabase';

type PrzedmiotUcznia = Database['public']['Tables']['przedmiot_ucznia']['Row'];
type PrzedmiotUczniaInsert = Database['public']['Tables']['przedmiot_ucznia']['Insert'];
type PrzedmiotUczniaUpdate = Database['public']['Tables']['przedmiot_ucznia']['Update'];

export function usePrzedmiotyUcznia(studentId?: string) {
  const [przedmioty, setPrzedmioty] = useState<PrzedmiotUcznia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrzedmioty = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('przedmiot_ucznia')
        .select('*')
        .order('subject', { ascending: true });

      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setPrzedmioty(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd pobierania przedmiotów');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrzedmioty();

    const channel = supabase
      .channel('przedmiot_ucznia_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'przedmiot_ucznia',
        },
        () => {
          fetchPrzedmioty();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentId]);

  const addPrzedmiot = async (przedmiot: PrzedmiotUczniaInsert) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Użytkownik niezalogowany');

      const { data, error: insertError } = await supabase
        .from('przedmiot_ucznia')
        .insert({ ...przedmiot, created_by: userData.user.id })
        .select()
        .single();

      if (insertError) throw insertError;
      return { data, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Błąd dodawania przedmiotu',
      };
    }
  };

  const updatePrzedmiot = async (id: string, updates: PrzedmiotUczniaUpdate) => {
    try {
      const { data, error: updateError } = await supabase
        .from('przedmiot_ucznia')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      return { data, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Błąd aktualizacji przedmiotu',
      };
    }
  };

  const deletePrzedmiot = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('przedmiot_ucznia')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      return { error: null };
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : 'Błąd usuwania przedmiotu',
      };
    }
  };

  return {
    przedmioty,
    loading,
    error,
    addPrzedmiot,
    updatePrzedmiot,
    deletePrzedmiot,
    refresh: fetchPrzedmioty,
  };
}

export function usePrzedmiotUcznia(id: string) {
  const [przedmiot, setPrzedmiot] = useState<PrzedmiotUcznia | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrzedmiot = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('przedmiot_ucznia')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (fetchError) throw fetchError;
        setPrzedmiot(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Błąd pobierania przedmiotu');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPrzedmiot();
    }
  }, [id]);

  return { przedmiot, loading, error };
}
