'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PostgrestFilterBuilder } from '@supabase/postgrest-js';

import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';

type Tables = Database['public']['Tables'];

type CrudErrorMessages = Partial<
  Record<'fetch' | 'insert' | 'update' | 'delete', string>
>;

type OrderConfig<Row> = {
  column: keyof Row;
  ascending?: boolean;
  nullsFirst?: boolean;
};

type QueryModifier<TTable extends keyof Tables, Filters> = (
  query: PostgrestFilterBuilder<
    Database['public'],
    Tables[TTable]['Row'],
    Tables[TTable]['Row']
  >,
  filters: Filters
) => PostgrestFilterBuilder<
  Database['public'],
  Tables[TTable]['Row'],
  Tables[TTable]['Row']
>;

type InsertPayload<TTable extends keyof Tables> = Tables[TTable]['Insert'] & {
  created_by?: string;
};

type FilterPayload<
  TTable extends keyof Tables,
  FilterColumns extends readonly (keyof Tables[TTable]['Row'])[] | undefined
> = FilterColumns extends readonly (keyof Tables[TTable]['Row'])[]
  ? Partial<Pick<Tables[TTable]['Row'], FilterColumns[number]>>
  : Partial<Tables[TTable]['Row']>;

type ResourceHookConfig<
  TTable extends keyof Tables,
  FilterColumns extends readonly (keyof Tables[TTable]['Row'])[] | undefined = undefined,
  TPrimaryKey extends keyof Tables[TTable]['Row'] = 'id'
> = {
  table: TTable;
  channel?: string;
  select?: string;
  orderBy?: OrderConfig<Tables[TTable]['Row']>;
  filterColumns?: FilterColumns;
  defaultFilters?: FilterPayload<TTable, FilterColumns>;
  primaryKey?: TPrimaryKey;
  autoCreatedBy?: boolean;
  errorMessages?: CrudErrorMessages;
  queryModifier?: QueryModifier<TTable, FilterPayload<TTable, FilterColumns>>;
};

type ResourceHookReturn<
  TTable extends keyof Tables,
  TPrimaryKey extends keyof Tables[TTable]['Row']
> = {
  data: Tables[TTable]['Row'][];
  loading: boolean;
  error: string | null;
  insert: (
    values: Tables[TTable]['Insert']
  ) => Promise<{ data: Tables[TTable]['Row'] | null; error: string | null }>;
  update: (
    id: Tables[TTable]['Row'][TPrimaryKey],
    updates: Tables[TTable]['Update']
  ) => Promise<{ data: Tables[TTable]['Row'] | null; error: string | null }>;
  remove: (
    id: Tables[TTable]['Row'][TPrimaryKey]
  ) => Promise<{ error: string | null }>;
  refresh: () => Promise<void>;
};

type RecordHookReturn<
  TTable extends keyof Tables,
  TPrimaryKey extends keyof Tables[TTable]['Row']
> = {
  record: Tables[TTable]['Row'] | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const DEFAULT_ERROR_MESSAGES: Required<CrudErrorMessages> = {
  fetch: 'Błąd pobierania danych',
  insert: 'Błąd dodawania rekordu',
  update: 'Błąd aktualizacji rekordu',
  delete: 'Błąd usuwania rekordu',
};

export function createSupabaseResourceHook<
  TTable extends keyof Tables,
  FilterColumns extends readonly (keyof Tables[TTable]['Row'])[] | undefined = undefined,
  TPrimaryKey extends keyof Tables[TTable]['Row'] = 'id'
>(config: ResourceHookConfig<TTable, FilterColumns, TPrimaryKey>) {
  type Row = Tables[TTable]['Row'];
  type Insert = Tables[TTable]['Insert'];
  type Update = Tables[TTable]['Update'];
  type Filters = FilterPayload<TTable, FilterColumns>;

  const primaryKey = (config.primaryKey ?? 'id') as keyof Row;
  const errorMessages: Required<CrudErrorMessages> = {
    ...DEFAULT_ERROR_MESSAGES,
    ...config.errorMessages,
  };
  const channelName = config.channel ?? `${String(config.table)}_changes`;

  function useResource(
    filters?: Filters,
    options?: { pause?: boolean }
  ): ResourceHookReturn<TTable, typeof primaryKey> {
    const [data, setData] = useState<Row[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const filtersKey = useMemo(
      () => JSON.stringify(filters ?? {}),
      [filters]
    );

    const fetchRecords = useCallback(async () => {
      if (options?.pause) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from(config.table)
          .select(config.select ?? '*');

        if (config.orderBy) {
          query = query.order(String(config.orderBy.column), {
            ascending: config.orderBy.ascending ?? true,
            nullsFirst: config.orderBy.nullsFirst,
          });
        }

        const activeFilters = {
          ...(config.defaultFilters ?? {}),
          ...(filters ?? {}),
        } as Filters;

        for (const [column, value] of Object.entries(activeFilters)) {
          if (value === undefined) continue;

          if (value === null) {
            query = query.is(column, value);
          } else {
            query = query.eq(column, value as any);
          }
        }

        if (config.queryModifier) {
          query = config.queryModifier(query as any, activeFilters) as any;
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;
        setData((data ?? []) as Row[]);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : errorMessages.fetch!
        );
      } finally {
        setLoading(false);
      }
    }, [filtersKey, options?.pause, config.table, config.select, config.orderBy, config.defaultFilters, config.queryModifier, errorMessages.fetch]);

    useEffect(() => {
      fetchRecords();

      if (options?.pause) {
        return;
      }

      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: String(config.table),
          },
          () => {
            fetchRecords();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }, [fetchRecords, options?.pause]);

    const insertRecord = useCallback(
      async (values: Insert) => {
        try {
          const { data: userData } = await supabase.auth.getUser();
          if (!userData.user) {
            throw new Error('Użytkownik niezalogowany');
          }

          let payload = { ...values } as InsertPayload<TTable>;

          if (config.autoCreatedBy) {
            payload = {
              ...payload,
              created_by: userData.user.id,
            } as InsertPayload<TTable>;
          }

          const { data, error: insertError } = await supabase
            .from(config.table)
            .insert(payload as Tables[TTable]['Insert'])
            .select()
            .single();

          if (insertError) throw insertError;
          return { data: data as Row, error: null };
        } catch (err) {
          return {
            data: null,
            error:
              err instanceof Error ? err.message : errorMessages.insert!,
          };
        }
      },
      [config.table, config.autoCreatedBy, errorMessages.insert]
    );

    const updateRecord = useCallback(
      async (id: Row[typeof primaryKey], updates: Update) => {
        try {
          const { data, error: updateError } = await supabase
            .from(config.table)
            .update(updates)
            .eq(String(primaryKey), id as any)
            .select()
            .single();

          if (updateError) throw updateError;
          return { data: data as Row, error: null };
        } catch (err) {
          return {
            data: null,
            error:
              err instanceof Error ? err.message : errorMessages.update!,
          };
        }
      },
      [config.table, primaryKey, errorMessages.update]
    );

    const deleteRecord = useCallback(
      async (id: Row[typeof primaryKey]) => {
        try {
          const { error: deleteError } = await supabase
            .from(config.table)
            .delete()
            .eq(String(primaryKey), id as any);

          if (deleteError) throw deleteError;
          return { error: null };
        } catch (err) {
          return {
            error:
              err instanceof Error ? err.message : errorMessages.delete!,
          };
        }
      },
      [config.table, primaryKey, errorMessages.delete]
    );

    return {
      data,
      loading,
      error,
      insert: insertRecord,
      update: updateRecord,
      remove: deleteRecord,
      refresh: fetchRecords,
    };
  }

  function useSupabaseRecord(
    id?: Row[typeof primaryKey]
  ): RecordHookReturn<TTable, typeof primaryKey> {
    const [record, setRecord] = useState<Row | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRecord = useCallback(async () => {
      if (id === undefined || id === null) {
        setRecord(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from(config.table)
          .select(config.select ?? '*')
          .eq(String(primaryKey), id as any)
          .maybeSingle();

        if (fetchError) throw fetchError;
        setRecord((data as Row) ?? null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : errorMessages.fetch!
        );
      } finally {
        setLoading(false);
      }
    }, [id, config.table, config.select, primaryKey, errorMessages.fetch]);

    useEffect(() => {
      fetchRecord();
    }, [fetchRecord]);

    return { record, loading, error, refresh: fetchRecord };
  }

  return { useResource, useSupabaseRecord };
}
