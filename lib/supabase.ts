import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      uczniowie: {
        Row: {
          id: string;
          created_at: string;
          created_by: string;
          imie: string;
          nazwisko: string;
          email: string | null;
          telefon: string | null;
          whatsapp: string | null;
          messenger: string | null;
          szkola: string | null;
          klasa: string | null;
          notatki: string | null;
        };
        Insert: Omit<Database['public']['Tables']['uczniowie']['Row'], 'id' | 'created_at' | 'created_by'>;
        Update: Partial<Database['public']['Tables']['uczniowie']['Insert']>;
      };
      zajecia: {
        Row: {
          id: string;
          created_at: string;
          created_by: string;
          student_id: string;
          subject: 'matematyka' | 'fizyka' | 'informatyka';
          start_at: string;
          end_at: string | null;
          temat: string | null;
          zrozumienie: number | null;
          trudnosci: string | null;
          praca_domowa: string | null;
          status_pd: 'brak' | 'zadane' | 'oddane' | 'poprawa';
        };
        Insert: Omit<Database['public']['Tables']['zajecia']['Row'], 'id' | 'created_at' | 'created_by'>;
        Update: Partial<Database['public']['Tables']['zajecia']['Insert']>;
      };
      platnosci: {
        Row: {
          id: string;
          created_at: string;
          created_by: string;
          student_id: string;
          zajecia_id: string | null;
          data_platnosci: string;
          kwota: number;
          waluta: string;
          metoda: string | null;
          status: 'oczekuje' | 'zapłacone' | 'zaległe' | 'anulowane';
          notatki: string | null;
          invoice_url: string | null;
        };
        Insert: Omit<Database['public']['Tables']['platnosci']['Row'], 'id' | 'created_at' | 'created_by'>;
        Update: Partial<Database['public']['Tables']['platnosci']['Insert']>;
      };
    };
  };
};
