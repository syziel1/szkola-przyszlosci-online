'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/supabase';

type Ksiazka = Database['public']['Tables']['ksiazki']['Row'];
type KsiazkaInsert = Database['public']['Tables']['ksiazki']['Insert'];
type KsiazkaUpdate = Database['public']['Tables']['ksiazki']['Update'];

export function useKsiazki() {
  const [ksiazki, setKsiazki] = useState<Ksiazka[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKsiazki = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('ksiazki')
        .select('*')
        .order('tytul', { ascending: true });

      if (fetchError) throw fetchError;
      setKsiazki(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd pobierania książek');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKsiazki();

    const channel = supabase
      .channel('ksiazki_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ksiazki',
        },
        () => {
          fetchKsiazki();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addKsiazka = async (ksiazka: KsiazkaInsert) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Użytkownik niezalogowany');

      const { data, error: insertError } = await supabase
        .from('ksiazki')
        .insert({ ...ksiazka, created_by: userData.user.id })
        .select()
        .single();

      if (insertError) throw insertError;
      return { data, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Błąd dodawania książki',
      };
    }
  };

  const updateKsiazka = async (id: string, updates: KsiazkaUpdate) => {
    try {
      const { data, error: updateError } = await supabase
        .from('ksiazki')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      return { data, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Błąd aktualizacji książki',
      };
    }
  };

  const deleteKsiazka = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('ksiazki')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      return { error: null };
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : 'Błąd usuwania książki',
      };
    }
  };

  return {
    ksiazki,
    loading,
    error,
    addKsiazka,
    updateKsiazka,
    deleteKsiazka,
    refresh: fetchKsiazki,
  };
}

export function useKsiazka(id: string) {
  const [ksiazka, setKsiazka] = useState<Ksiazka | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchKsiazka = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('ksiazki')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (fetchError) throw fetchError;
        setKsiazka(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Błąd pobierania książki');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchKsiazka();
    }
  }, [id]);

  return { ksiazka, loading, error };
}
