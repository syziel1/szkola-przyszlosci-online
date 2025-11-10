import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Enums: {
      subject_enum: 'matematyka' | 'fizyka' | 'informatyka';
      payment_status_enum: 'oczekuje' | 'zapłacone' | 'zaległe' | 'anulowane';
      homework_status_enum: 'brak' | 'zadane' | 'oddane' | 'poprawa';
      owner_type_enum: 'student' | 'class' | 'book' | 'diagnostic';
      link_kind_enum: 'resource' | 'homework' | 'reference' | 'external';
    };
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
          subject: Database['public']['Enums']['subject_enum'];
          start_at: string;
          end_at: string | null;
          temat: string | null;
          zrozumienie: number | null;
          trudnosci: string | null;
          praca_domowa: string | null;
          status_pd: Database['public']['Enums']['homework_status_enum'];
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
          status: Database['public']['Enums']['payment_status_enum'];
          notatki: string | null;
          invoice_url: string | null;
        };
        Insert: Omit<Database['public']['Tables']['platnosci']['Row'], 'id' | 'created_at' | 'created_by'>;
        Update: Partial<Database['public']['Tables']['platnosci']['Insert']>;
      };
      diagnozy: {
        Row: {
          id: string;
          created_at: string;
          created_by: string;
          student_id: string;
          subject: Database['public']['Enums']['subject_enum'];
          data_testu: string;
          narzedzie: string | null;
          wynik: number | null;
          rubric: Record<string, any> | null;
          wnioski: string | null;
          cele: string | null;
        };
        Insert: Omit<Database['public']['Tables']['diagnozy']['Row'], 'id' | 'created_at' | 'created_by'>;
        Update: Partial<Database['public']['Tables']['diagnozy']['Insert']>;
      };
      ksiazki: {
        Row: {
          id: string;
          created_at: string;
          created_by: string;
          wydawnictwo: string | null;
          tytul: string;
          url: string | null;
        };
        Insert: Omit<Database['public']['Tables']['ksiazki']['Row'], 'id' | 'created_at' | 'created_by'>;
        Update: Partial<Database['public']['Tables']['ksiazki']['Insert']>;
      };
      linki: {
        Row: {
          id: string;
          created_at: string;
          created_by: string;
          owner_type: Database['public']['Enums']['owner_type_enum'];
          owner_id: string | null;
          kind: Database['public']['Enums']['link_kind_enum'];
          url: string;
          label: string | null;
          metadata: Record<string, any> | null;
        };
        Insert: Omit<Database['public']['Tables']['linki']['Row'], 'id' | 'created_at' | 'created_by'>;
        Update: Partial<Database['public']['Tables']['linki']['Insert']>;
      };
      przedmiot_ucznia: {
        Row: {
          id: string;
          created_at: string;
          created_by: string;
          student_id: string;
          subject: Database['public']['Enums']['subject_enum'];
          notatki: string | null;
        };
        Insert: Omit<Database['public']['Tables']['przedmiot_ucznia']['Row'], 'id' | 'created_at' | 'created_by'>;
        Update: Partial<Database['public']['Tables']['przedmiot_ucznia']['Insert']>;
      };
      uczen_ksiazka: {
        Row: {
          id: string;
          created_at: string;
          created_by: string;
          student_id: string;
          ksiazka_id: string;
          subject: Database['public']['Enums']['subject_enum'] | null;
          unikalne: boolean;
        };
        Insert: Omit<Database['public']['Tables']['uczen_ksiazka']['Row'], 'id' | 'created_at' | 'created_by'>;
        Update: Partial<Database['public']['Tables']['uczen_ksiazka']['Insert']>;
      };
      auth_settings: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          user_id: string;
          enable_2fa: boolean;
          session_timeout_minutes: number;
          require_password_change: boolean;
          last_password_change: string | null;
          failed_login_attempts: number;
          account_locked_until: string | null;
          email_notifications: boolean;
          login_notification: boolean;
          allowed_ip_addresses: string[] | null;
          security_questions_set: boolean;
          backup_email: string | null;
        };
        Insert: Omit<Database['public']['Tables']['auth_settings']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['auth_settings']['Insert']>;
      };
    };
  };
};
