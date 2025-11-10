/*
  # Create Extended Student Management Schema
  
  1. New Enums
    - `subject_enum` - Subjects taught: matematyka, fizyka, informatyka
    - `payment_status_enum` - Payment statuses: oczekuje, zapłacone, zaległe, anulowane
    - `homework_status_enum` - Homework statuses: brak, zadane, oddane, poprawa
    - `owner_type_enum` - Link owner types: student, class, book, diagnostic
    - `link_kind_enum` - Link kinds: resource, homework, reference, external
  
  2. New Tables
    - `diagnozy` - Diagnostic test results and assessments
    - `ksiazki` - Books and educational materials library
    - `linki` - Flexible links system for various entities
    - `przedmiot_ucznia` - Student-subject relationships with notes
    - `uczen_ksiazka` - Student-book assignments
  
  3. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their data
  
  Important Notes:
    1. This migration is idempotent - safe to run multiple times
    2. All foreign keys are created with proper constraints
    3. Default values are set appropriately
    4. RLS policies ensure data security
*/

-- Create enums if they don't exist
DO $$ BEGIN
  CREATE TYPE subject_enum AS ENUM ('matematyka', 'fizyka', 'informatyka');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status_enum AS ENUM ('oczekuje', 'zapłacone', 'zaległe', 'anulowane');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE homework_status_enum AS ENUM ('brak', 'zadane', 'oddane', 'poprawa');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE owner_type_enum AS ENUM ('student', 'class', 'book', 'diagnostic');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE link_kind_enum AS ENUM ('resource', 'homework', 'reference', 'external');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create ksiazki (books) table
CREATE TABLE IF NOT EXISTS public.ksiazki (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid NOT NULL DEFAULT auth.uid(),
  wydawnictwo text,
  tytul text NOT NULL,
  url text,
  CONSTRAINT ksiazki_pkey PRIMARY KEY (id),
  CONSTRAINT ksiazki_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

-- Create diagnozy (diagnostics) table
CREATE TABLE IF NOT EXISTS public.diagnozy (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid NOT NULL DEFAULT auth.uid(),
  student_id uuid NOT NULL,
  subject subject_enum NOT NULL,
  data_testu date NOT NULL DEFAULT CURRENT_DATE,
  narzedzie text,
  wynik numeric,
  rubric jsonb,
  wnioski text,
  cele text,
  CONSTRAINT diagnozy_pkey PRIMARY KEY (id),
  CONSTRAINT diagnozy_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.uczniowie(id) ON DELETE CASCADE,
  CONSTRAINT diagnozy_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

-- Create linki (links) table
CREATE TABLE IF NOT EXISTS public.linki (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid NOT NULL DEFAULT auth.uid(),
  owner_type owner_type_enum NOT NULL,
  owner_id uuid,
  kind link_kind_enum NOT NULL,
  url text NOT NULL,
  label text,
  metadata jsonb,
  CONSTRAINT linki_pkey PRIMARY KEY (id),
  CONSTRAINT linki_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

-- Create przedmiot_ucznia (student-subject) table
CREATE TABLE IF NOT EXISTS public.przedmiot_ucznia (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid NOT NULL DEFAULT auth.uid(),
  student_id uuid NOT NULL,
  subject subject_enum NOT NULL,
  notatki text,
  CONSTRAINT przedmiot_ucznia_pkey PRIMARY KEY (id),
  CONSTRAINT przedmiot_ucznia_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.uczniowie(id) ON DELETE CASCADE,
  CONSTRAINT przedmiot_ucznia_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

-- Create uczen_ksiazka (student-book) table
CREATE TABLE IF NOT EXISTS public.uczen_ksiazka (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid NOT NULL DEFAULT auth.uid(),
  student_id uuid NOT NULL,
  ksiazka_id uuid NOT NULL,
  subject subject_enum,
  unikalne boolean DEFAULT false,
  CONSTRAINT uczen_ksiazka_pkey PRIMARY KEY (id),
  CONSTRAINT uczen_ksiazka_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.uczniowie(id) ON DELETE CASCADE,
  CONSTRAINT uczen_ksiazka_ksiazka_id_fkey FOREIGN KEY (ksiazka_id) REFERENCES public.ksiazki(id) ON DELETE CASCADE,
  CONSTRAINT uczen_ksiazka_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

-- Enable RLS on all new tables
ALTER TABLE public.ksiazki ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnozy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linki ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.przedmiot_ucznia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uczen_ksiazka ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ksiazki (books)
DO $$ BEGIN
  CREATE POLICY "Users can view all books"
    ON public.ksiazki FOR SELECT
    TO authenticated
    USING (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create books"
    ON public.ksiazki FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own books"
    ON public.ksiazki FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete their own books"
    ON public.ksiazki FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- RLS Policies for diagnozy (diagnostics)
DO $$ BEGIN
  CREATE POLICY "Users can view their students' diagnostics"
    ON public.diagnozy FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.uczniowie
        WHERE uczniowie.id = diagnozy.student_id
        AND uczniowie.created_by = auth.uid()
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create diagnostics"
    ON public.diagnozy FOR INSERT
    TO authenticated
    WITH CHECK (
      auth.uid() = created_by
      AND EXISTS (
        SELECT 1 FROM public.uczniowie
        WHERE uczniowie.id = student_id
        AND uczniowie.created_by = auth.uid()
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their diagnostics"
    ON public.diagnozy FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete their diagnostics"
    ON public.diagnozy FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- RLS Policies for linki (links)
DO $$ BEGIN
  CREATE POLICY "Users can view all links"
    ON public.linki FOR SELECT
    TO authenticated
    USING (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create links"
    ON public.linki FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own links"
    ON public.linki FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete their own links"
    ON public.linki FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- RLS Policies for przedmiot_ucznia (student subjects)
DO $$ BEGIN
  CREATE POLICY "Users can view their students' subjects"
    ON public.przedmiot_ucznia FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.uczniowie
        WHERE uczniowie.id = przedmiot_ucznia.student_id
        AND uczniowie.created_by = auth.uid()
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create student subjects"
    ON public.przedmiot_ucznia FOR INSERT
    TO authenticated
    WITH CHECK (
      auth.uid() = created_by
      AND EXISTS (
        SELECT 1 FROM public.uczniowie
        WHERE uczniowie.id = student_id
        AND uczniowie.created_by = auth.uid()
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their student subjects"
    ON public.przedmiot_ucznia FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete their student subjects"
    ON public.przedmiot_ucznia FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- RLS Policies for uczen_ksiazka (student-book assignments)
DO $$ BEGIN
  CREATE POLICY "Users can view their students' book assignments"
    ON public.uczen_ksiazka FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.uczniowie
        WHERE uczniowie.id = uczen_ksiazka.student_id
        AND uczniowie.created_by = auth.uid()
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create student-book assignments"
    ON public.uczen_ksiazka FOR INSERT
    TO authenticated
    WITH CHECK (
      auth.uid() = created_by
      AND EXISTS (
        SELECT 1 FROM public.uczniowie
        WHERE uczniowie.id = student_id
        AND uczniowie.created_by = auth.uid()
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their student-book assignments"
    ON public.uczen_ksiazka FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete their student-book assignments"
    ON public.uczen_ksiazka FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS diagnozy_student_id_idx ON public.diagnozy(student_id);
CREATE INDEX IF NOT EXISTS diagnozy_subject_idx ON public.diagnozy(subject);
CREATE INDEX IF NOT EXISTS linki_owner_type_owner_id_idx ON public.linki(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS przedmiot_ucznia_student_id_idx ON public.przedmiot_ucznia(student_id);
CREATE INDEX IF NOT EXISTS uczen_ksiazka_student_id_idx ON public.uczen_ksiazka(student_id);
CREATE INDEX IF NOT EXISTS uczen_ksiazka_ksiazka_id_idx ON public.uczen_ksiazka(ksiazka_id);
