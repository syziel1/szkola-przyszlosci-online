'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/supabase';

type UczenKsiazka = Database['public']['Tables']['uczen_ksiazka']['Row'];
type UczenKsiazkaInsert = Database['public']['Tables']['uczen_ksiazka']['Insert'];
type UczenKsiazkaUpdate = Database['public']['Tables']['uczen_ksiazka']['Update'];

export function useUczenKsiazki(studentId?: string) {
  const [assignments, setAssignments] = useState<UczenKsiazka[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('uczen_ksiazka')
        .select('*')
        .order('created_at', { ascending: false });

      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setAssignments(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd pobierania przypisań książek');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();

    const channel = supabase
      .channel('uczen_ksiazka_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'uczen_ksiazka',
        },
        () => {
          fetchAssignments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentId]);

  const addAssignment = async (assignment: UczenKsiazkaInsert) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Użytkownik niezalogowany');

      const { data, error: insertError } = await supabase
        .from('uczen_ksiazka')
        .insert(assignment)
        .select()
        .single();

      if (insertError) throw insertError;
      return { data, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Błąd dodawania przypisania książki',
      };
    }
  };

  const updateAssignment = async (id: string, updates: UczenKsiazkaUpdate) => {
    try {
      const { data, error: updateError } = await supabase
        .from('uczen_ksiazka')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      return { data, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Błąd aktualizacji przypisania książki',
      };
    }
  };

  const deleteAssignment = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('uczen_ksiazka')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      return { error: null };
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : 'Błąd usuwania przypisania książki',
      };
    }
  };

  return {
    assignments,
    loading,
    error,
    addAssignment,
    updateAssignment,
    deleteAssignment,
    refresh: fetchAssignments,
  };
}

export function useUczenKsiazka(id: string) {
  const [assignment, setAssignment] = useState<UczenKsiazka | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('uczen_ksiazka')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (fetchError) throw fetchError;
        setAssignment(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Błąd pobierania przypisania książki');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAssignment();
    }
  }, [id]);

  return { assignment, loading, error };
}
