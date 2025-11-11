'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/supabase';

type Link = Database['public']['Tables']['linki']['Row'];
type LinkInsert = Database['public']['Tables']['linki']['Insert'];
type LinkUpdate = Database['public']['Tables']['linki']['Update'];

export function useLinki(ownerType?: Database['public']['Enums']['owner_type_enum'], ownerId?: string) {
  const [linki, setLinki] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLinki = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('linki')
        .select('*')
        .order('created_at', { ascending: false });

      if (ownerType && ownerId) {
        query = query.eq('owner_type', ownerType).eq('owner_id', ownerId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setLinki(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd pobierania linków');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinki();

    const channel = supabase
      .channel('linki_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'linki',
        },
        () => {
          fetchLinki();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ownerType, ownerId]);

  const addLink = async (link: LinkInsert) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Użytkownik niezalogowany');

      const { data, error: insertError } = await supabase
        .from('linki')
        .insert(link)
        .select()
        .single();

      if (insertError) throw insertError;
      return { data, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Błąd dodawania linku',
      };
    }
  };

  const updateLink = async (id: string, updates: LinkUpdate) => {
    try {
      const { data, error: updateError } = await supabase
        .from('linki')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      return { data, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Błąd aktualizacji linku',
      };
    }
  };

  const deleteLink = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('linki')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      return { error: null };
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : 'Błąd usuwania linku',
      };
    }
  };

  return {
    linki,
    loading,
    error,
    addLink,
    updateLink,
    deleteLink,
    refresh: fetchLinki,
  };
}

export function useLink(id: string) {
  const [link, setLink] = useState<Link | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLink = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('linki')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (fetchError) throw fetchError;
        setLink(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Błąd pobierania linku');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchLink();
    }
  }, [id]);

  return { link, loading, error };
}
