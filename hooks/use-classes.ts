'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/supabase';

type Class = Database['public']['Tables']['zajecia']['Row'];
type ClassInsert = Database['public']['Tables']['zajecia']['Insert'];
type ClassUpdate = Database['public']['Tables']['zajecia']['Update'];

export function useClasses(studentId?: string) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('zajecia')
        .select('*')
        .order('start_at', { ascending: false });

      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setClasses(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd pobierania zajęć');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();

    const channel = supabase
      .channel('zajecia_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'zajecia',
        },
        () => {
          fetchClasses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentId]);

  const addClass = async (classData: ClassInsert) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Użytkownik niezalogowany');

      const { data, error: insertError } = await supabase
        .from('zajecia')
        .insert(classData)
        .select()
        .single();

      if (insertError) throw insertError;
      return { data, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Błąd dodawania zajęć',
      };
    }
  };

  const updateClass = async (id: string, updates: ClassUpdate) => {
    try {
      const { data, error: updateError } = await supabase
        .from('zajecia')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      return { data, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Błąd aktualizacji zajęć',
      };
    }
  };

  const deleteClass = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('zajecia')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      return { error: null };
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : 'Błąd usuwania zajęć',
      };
    }
  };

  return {
    classes,
    loading,
    error,
    addClass,
    updateClass,
    deleteClass,
    refresh: fetchClasses,
  };
}

export function useClass(id: string) {
  const [classData, setClassData] = useState<Class | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClass = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('zajecia')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (fetchError) throw fetchError;
        setClassData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Błąd pobierania zajęć');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchClass();
    }
  }, [id]);

  return { classData, loading, error };
}
