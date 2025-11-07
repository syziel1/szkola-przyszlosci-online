/*
  # Create Student Management System Schema

  ## Overview
  This migration creates a complete CRM system for tutors to manage students, classes, and payments.

  ## 1. New Tables

  ### `uczniowie` (Students)
  - `id` (uuid, primary key) - Unique student identifier
  - `created_at` (timestamptz) - Record creation timestamp
  - `created_by` (uuid) - Reference to user who created the record
  - `imie` (text) - Student's first name
  - `nazwisko` (text) - Student's last name
  - `email` (text, nullable) - Student's email address
  - `telefon` (text, nullable) - Student's phone number
  - `whatsapp` (text, nullable) - Student's WhatsApp contact
  - `messenger` (text, nullable) - Student's Messenger contact
  - `szkola` (text, nullable) - School name
  - `klasa` (text, nullable) - Class/grade level
  - `notatki` (text, nullable) - Additional notes about the student

  ### `zajecia` (Classes/Sessions)
  - `id` (uuid, primary key) - Unique session identifier
  - `created_at` (timestamptz) - Record creation timestamp
  - `created_by` (uuid) - Reference to user who created the record
  - `student_id` (uuid) - Foreign key to uczniowie table
  - `subject` (text) - Subject taught (matematyka/fizyka/informatyka)
  - `start_at` (timestamptz) - Session start time
  - `end_at` (timestamptz, nullable) - Session end time
  - `temat` (text, nullable) - Topic/lesson subject
  - `zrozumienie` (integer, nullable) - Understanding level (1-5 scale)
  - `trudnosci` (text, nullable) - Difficulties encountered
  - `praca_domowa` (text, nullable) - Homework assigned
  - `status_pd` (text) - Homework status (brak/zadane/oddane/poprawa)

  ### `platnosci` (Payments)
  - `id` (uuid, primary key) - Unique payment identifier
  - `created_at` (timestamptz) - Record creation timestamp
  - `created_by` (uuid) - Reference to user who created the record
  - `student_id` (uuid) - Foreign key to uczniowie table
  - `zajecia_id` (uuid, nullable) - Foreign key to zajecia table
  - `data_platnosci` (date) - Payment date
  - `kwota` (numeric) - Payment amount
  - `waluta` (text) - Currency code
  - `metoda` (text, nullable) - Payment method
  - `status` (text) - Payment status (oczekuje/zapłacone/zaległe/anulowane)
  - `notatki` (text, nullable) - Payment notes
  - `invoice_url` (text, nullable) - Invoice document URL

  ## 2. Security
  - Enable RLS on all tables
  - Users can only view, create, update, and delete their own records
  - All policies check `created_by = auth.uid()` for data isolation

  ## 3. Indexes
  - Index on `student_id` for fast lookups in zajecia and platnosci tables
  - Index on `created_by` for efficient filtering by user

  ## 4. Important Notes
  - All tables use `created_by` to track ownership and enforce RLS
  - Foreign key constraints ensure referential integrity
  - Default values set for timestamps and status fields
  - Cascading deletes prevent orphaned records
*/

-- Create uczniowie (students) table
CREATE TABLE IF NOT EXISTS uczniowie (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  imie text NOT NULL,
  nazwisko text NOT NULL,
  email text,
  telefon text,
  whatsapp text,
  messenger text,
  szkola text,
  klasa text,
  notatki text
);

-- Create zajecia (classes/sessions) table
CREATE TABLE IF NOT EXISTS zajecia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES uczniowie(id) ON DELETE CASCADE NOT NULL,
  subject text NOT NULL CHECK (subject IN ('matematyka', 'fizyka', 'informatyka')),
  start_at timestamptz NOT NULL,
  end_at timestamptz,
  temat text,
  zrozumienie integer CHECK (zrozumienie >= 1 AND zrozumienie <= 5),
  trudnosci text,
  praca_domowa text,
  status_pd text DEFAULT 'brak' NOT NULL CHECK (status_pd IN ('brak', 'zadane', 'oddane', 'poprawa'))
);

-- Create platnosci (payments) table
CREATE TABLE IF NOT EXISTS platnosci (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES uczniowie(id) ON DELETE CASCADE NOT NULL,
  zajecia_id uuid REFERENCES zajecia(id) ON DELETE SET NULL,
  data_platnosci date NOT NULL,
  kwota numeric NOT NULL,
  waluta text DEFAULT 'PLN' NOT NULL,
  metoda text,
  status text DEFAULT 'oczekuje' NOT NULL CHECK (status IN ('oczekuje', 'zapłacone', 'zaległe', 'anulowane')),
  notatki text,
  invoice_url text
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_uczniowie_created_by ON uczniowie(created_by);
CREATE INDEX IF NOT EXISTS idx_zajecia_created_by ON zajecia(created_by);
CREATE INDEX IF NOT EXISTS idx_zajecia_student_id ON zajecia(student_id);
CREATE INDEX IF NOT EXISTS idx_platnosci_created_by ON platnosci(created_by);
CREATE INDEX IF NOT EXISTS idx_platnosci_student_id ON platnosci(student_id);
CREATE INDEX IF NOT EXISTS idx_platnosci_zajecia_id ON platnosci(zajecia_id);

-- Enable Row Level Security
ALTER TABLE uczniowie ENABLE ROW LEVEL SECURITY;
ALTER TABLE zajecia ENABLE ROW LEVEL SECURITY;
ALTER TABLE platnosci ENABLE ROW LEVEL SECURITY;

-- RLS Policies for uczniowie (students)
CREATE POLICY "Users can view own students"
  ON uczniowie FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create own students"
  ON uczniowie FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own students"
  ON uczniowie FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own students"
  ON uczniowie FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- RLS Policies for zajecia (classes/sessions)
CREATE POLICY "Users can view own classes"
  ON zajecia FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create own classes"
  ON zajecia FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own classes"
  ON zajecia FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own classes"
  ON zajecia FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- RLS Policies for platnosci (payments)
CREATE POLICY "Users can view own payments"
  ON platnosci FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create own payments"
  ON platnosci FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own payments"
  ON platnosci FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own payments"
  ON platnosci FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);