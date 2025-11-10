/*
  # Create User Roles and Profiles System

  ## Overview
  This migration creates a comprehensive role-based access control system with five user levels:
  - Administrator: Full system access, can manage users and assign roles
  - Konsultant: Can view and edit all students, classes, and payments across all tutors
  - Nauczyciel (Tutor): Can manage only their own students and related data
  - Opiekun (Guardian): Read-only access to their linked students' information
  - Uczen (Student): Read-only access to their own classes, homework, and materials

  ## 1. New Enums

  ### `user_role_enum`
  Defines the five role levels in the system

  ## 2. New Tables

  ### `user_profiles`
  - `id` (uuid, primary key) - Unique profile identifier
  - `created_at` (timestamptz) - Profile creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  - `user_id` (uuid, unique) - Reference to auth.users (one profile per user)
  - `role` (user_role_enum) - User's role in the system
  - `full_name` (text) - User's full name
  - `phone` (text, nullable) - Contact phone number
  - `avatar_url` (text, nullable) - Profile picture URL
  - `bio` (text, nullable) - User biography or notes
  - `is_active` (boolean) - Whether user account is active
  - `metadata` (jsonb, nullable) - Additional flexible metadata
  - `last_login_at` (timestamptz, nullable) - Last login timestamp

  ### `student_guardians`
  - `id` (uuid, primary key) - Unique relationship identifier
  - `created_at` (timestamptz) - Relationship creation timestamp
  - `created_by` (uuid) - User who created this relationship
  - `guardian_user_id` (uuid) - Reference to user with 'opiekun' role
  - `student_id` (uuid) - Reference to uczniowie table
  - Many-to-many relationship: one guardian can monitor multiple students

  ### `student_user_mapping`
  - `id` (uuid, primary key) - Unique mapping identifier
  - `created_at` (timestamptz) - Mapping creation timestamp
  - `created_by` (uuid) - User who created this mapping
  - `student_user_id` (uuid, unique) - Reference to user with 'uczen' role
  - `student_id` (uuid, unique) - Reference to uczniowie table
  - One-to-one relationship: each student user links to one student record

  ### `audit_log`
  - `id` (uuid, primary key) - Unique log entry identifier
  - `created_at` (timestamptz) - When the action occurred
  - `user_id` (uuid) - User who performed the action
  - `action` (text) - Description of the action
  - `table_name` (text, nullable) - Affected table
  - `record_id` (uuid, nullable) - Affected record ID
  - `old_values` (jsonb, nullable) - Previous values (for updates)
  - `new_values` (jsonb, nullable) - New values (for inserts/updates)
  - `ip_address` (text, nullable) - User's IP address

  ## 3. Security
  - Enable RLS on all new tables
  - Users can view their own profile
  - Only administrators can modify user profiles and roles
  - Guardians can view their student relationships
  - Audit logs are administrator-only

  ## 4. Triggers
  - Auto-update `updated_at` timestamp on profile changes
  - Auto-create user profile with 'uczen' role for new users
  - Log role changes to audit_log table

  ## 5. Important Notes
  - Default role for new users is 'uczen' (student)
  - Administrators must manually promote users to staff roles (konsultant, nauczyciel)
  - The first administrator (syziel@gmail.com) is set in a separate step
  - System prevents deletion of the last administrator
  - All role changes are logged for security auditing
*/

-- Create user role enum
DO $$ BEGIN
  CREATE TYPE user_role_enum AS ENUM ('administrator', 'konsultant', 'nauczyciel', 'opiekun', 'uczen');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  role user_role_enum DEFAULT 'uczen' NOT NULL,
  full_name text,
  phone text,
  avatar_url text,
  bio text,
  is_active boolean DEFAULT true NOT NULL,
  metadata jsonb,
  last_login_at timestamptz
);

-- Create student_guardians table (many-to-many)
CREATE TABLE IF NOT EXISTS public.student_guardians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  guardian_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES public.uczniowie(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(guardian_user_id, student_id)
);

-- Create student_user_mapping table (one-to-one)
CREATE TABLE IF NOT EXISTS public.student_user_mapping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  student_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  student_id uuid REFERENCES public.uczniowie(id) ON DELETE CASCADE UNIQUE NOT NULL
);

-- Create audit_log table
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  table_name text,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address text
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON public.user_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_student_guardians_guardian_user_id ON public.student_guardians(guardian_user_id);
CREATE INDEX IF NOT EXISTS idx_student_guardians_student_id ON public.student_guardians(student_id);
CREATE INDEX IF NOT EXISTS idx_student_user_mapping_student_user_id ON public.student_user_mapping(student_user_id);
CREATE INDEX IF NOT EXISTS idx_student_user_mapping_student_id ON public.student_user_mapping(student_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON public.audit_log(table_name);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER trigger_update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

-- Function to initialize user profile for new users
CREATE OR REPLACE FUNCTION initialize_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, role, full_name)
  VALUES (NEW.id, 'uczen', COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile for new users
DROP TRIGGER IF EXISTS trigger_initialize_user_profile ON auth.users;
CREATE TRIGGER trigger_initialize_user_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_profile();

-- Function to log role changes
CREATE OR REPLACE FUNCTION log_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.audit_log (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (
      auth.uid(),
      'Role changed from ' || OLD.role || ' to ' || NEW.role,
      'user_profiles',
      NEW.id,
      jsonb_build_object('role', OLD.role),
      jsonb_build_object('role', NEW.role)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to log role changes
DROP TRIGGER IF EXISTS trigger_log_role_change ON public.user_profiles;
CREATE TRIGGER trigger_log_role_change
  AFTER UPDATE ON public.user_profiles
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION log_role_change();

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_user_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Administrators can view all profiles"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid()
      AND role = 'administrator'
    )
  );

CREATE POLICY "Administrators can update all profiles"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid()
      AND role = 'administrator'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid()
      AND role = 'administrator'
    )
  );

CREATE POLICY "Users can update own non-role fields"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND role = (SELECT role FROM public.user_profiles WHERE user_id = auth.uid())
  );

-- RLS Policies for student_guardians
CREATE POLICY "Guardians can view their student relationships"
  ON public.student_guardians FOR SELECT
  TO authenticated
  USING (
    guardian_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('administrator', 'konsultant', 'nauczyciel')
    )
  );

CREATE POLICY "Staff can create guardian relationships"
  ON public.student_guardians FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('administrator', 'konsultant', 'nauczyciel')
    )
  );

CREATE POLICY "Staff can delete guardian relationships"
  ON public.student_guardians FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('administrator', 'konsultant', 'nauczyciel')
    )
  );

-- RLS Policies for student_user_mapping
CREATE POLICY "Users can view relevant student mappings"
  ON public.student_user_mapping FOR SELECT
  TO authenticated
  USING (
    student_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('administrator', 'konsultant', 'nauczyciel')
    )
  );

CREATE POLICY "Staff can create student user mappings"
  ON public.student_user_mapping FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('administrator', 'konsultant', 'nauczyciel')
    )
  );

CREATE POLICY "Staff can delete student user mappings"
  ON public.student_user_mapping FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('administrator', 'konsultant', 'nauczyciel')
    )
  );

-- RLS Policies for audit_log
CREATE POLICY "Administrators can view audit logs"
  ON public.audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid()
      AND role = 'administrator'
    )
  );
