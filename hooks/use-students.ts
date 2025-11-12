'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/supabase';

type Student = Database['public']['Tables']['uczniowie']['Row'];
type StudentInsert = Database['public']['Tables']['uczniowie']['Insert'];
type StudentUpdate = Database['public']['Tables']['uczniowie']['Update'];

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('uczniowie')
        .select('*')
        .order('nazwisko', { ascending: true });

      if (fetchError) throw fetchError;
      setStudents(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd pobierania uczniów');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();

    const channel = supabase
      .channel('uczniowie_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'uczniowie',
        },
        () => {
          fetchStudents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addStudent = async (student: StudentInsert) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Użytkownik niezalogowany');

      const { data, error: insertError } = await supabase
        .from('uczniowie')
        .insert(student)
        .select()
        .single();

      if (insertError) throw insertError;
      return { data, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Błąd dodawania ucznia',
      };
    }
  };

  const updateStudent = async (id: string, updates: StudentUpdate) => {
    try {
      const { data, error: updateError } = await supabase
        .from('uczniowie')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      return { data, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Błąd aktualizacji ucznia',
      };
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('uczniowie')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      return { error: null };
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : 'Błąd usuwania ucznia',
      };
    }
  };

  return {
    students,
    loading,
    error,
    addStudent,
    updateStudent,
    deleteStudent,
    refresh: fetchStudents,
  };
}

export function useStudent(id: string) {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('uczniowie')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (fetchError) throw fetchError;
        setStudent(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Błąd pobierania ucznia');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchStudent();
    }
  }, [id]);

  return { student, loading, error };
}
