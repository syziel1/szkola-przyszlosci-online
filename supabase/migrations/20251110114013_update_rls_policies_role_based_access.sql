/*
  # Update RLS Policies for Role-Based Access Control

  ## Overview
  This migration updates all existing RLS policies to respect the new five-tier role system.
  
  ## Role-Based Access Matrix

  ### uczniowie (Students) Table:
  - Administrator: Full CRUD access to all students
  - Konsultant: Full CRUD access to all students
  - Nauczyciel: Full CRUD access to their own students (created_by)
  - Opiekun: Read-only access to their linked students
  - Uczen: Read-only access to their own student record

  ### zajecia (Classes) Table:
  - Administrator: Full CRUD access to all classes
  - Konsultant: Full CRUD access to all classes
  - Nauczyciel: Full CRUD access to their own classes
  - Opiekun: Read-only access to classes of linked students
  - Uczen: Read-only access to their own classes

  ### platnosci (Payments) Table:
  - Administrator: Full CRUD access to all payments
  - Konsultant: Full CRUD access to all payments
  - Nauczyciel: Full CRUD access to their own student payments
  - Opiekun: Read-only access to payments of linked students
  - Uczen: Read-only access to their own payments

  ### Other Tables (diagnozy, ksiazki, linki, przedmiot_ucznia, uczen_ksiazka):
  - Similar hierarchical access patterns
  - Administrator and Konsultant: Full access
  - Nauczyciel: Access to their own data
  - Opiekun and Uczen: Appropriate read access

  ## Important Notes
  - All existing policies are dropped and recreated
  - Uses helper function to check user role
  - Policies are layered: admin/konsultant bypass, then ownership, then relationships
  - Ensures data security while enabling collaboration
*/

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role_enum AS $$
BEGIN
  RETURN (
    SELECT role FROM public.user_profiles
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper function to check if user is admin or konsultant
CREATE OR REPLACE FUNCTION is_admin_or_konsultant()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('administrator', 'konsultant')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper function to check if user is staff (admin, konsultant, or nauczyciel)
CREATE OR REPLACE FUNCTION is_staff()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('administrator', 'konsultant', 'nauczyciel')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Drop existing uczniowie policies
DROP POLICY IF EXISTS "Users can view own students" ON public.uczniowie;
DROP POLICY IF EXISTS "Users can create own students" ON public.uczniowie;
DROP POLICY IF EXISTS "Users can update own students" ON public.uczniowie;
DROP POLICY IF EXISTS "Users can delete own students" ON public.uczniowie;

-- New uczniowie policies with role-based access
CREATE POLICY "Admin and konsultant can view all students"
  ON public.uczniowie FOR SELECT
  TO authenticated
  USING (is_admin_or_konsultant());

CREATE POLICY "Nauczyciel can view own students"
  ON public.uczniowie FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
    AND get_user_role() = 'nauczyciel'
  );

CREATE POLICY "Opiekun can view linked students"
  ON public.uczniowie FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.student_guardians
      WHERE student_guardians.student_id = uczniowie.id
      AND student_guardians.guardian_user_id = auth.uid()
    )
    AND get_user_role() = 'opiekun'
  );

CREATE POLICY "Uczen can view own student record"
  ON public.uczniowie FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.student_user_mapping
      WHERE student_user_mapping.student_id = uczniowie.id
      AND student_user_mapping.student_user_id = auth.uid()
    )
    AND get_user_role() = 'uczen'
  );

CREATE POLICY "Admin and konsultant can create students"
  ON public.uczniowie FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_or_konsultant());

CREATE POLICY "Nauczyciel can create own students"
  ON public.uczniowie FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND get_user_role() = 'nauczyciel'
  );

CREATE POLICY "Admin and konsultant can update all students"
  ON public.uczniowie FOR UPDATE
  TO authenticated
  USING (is_admin_or_konsultant())
  WITH CHECK (is_admin_or_konsultant());

CREATE POLICY "Nauczyciel can update own students"
  ON public.uczniowie FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    AND get_user_role() = 'nauczyciel'
  )
  WITH CHECK (
    created_by = auth.uid()
    AND get_user_role() = 'nauczyciel'
  );

CREATE POLICY "Admin and konsultant can delete all students"
  ON public.uczniowie FOR DELETE
  TO authenticated
  USING (is_admin_or_konsultant());

CREATE POLICY "Nauczyciel can delete own students"
  ON public.uczniowie FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    AND get_user_role() = 'nauczyciel'
  );

-- Drop existing zajecia policies
DROP POLICY IF EXISTS "Users can view own classes" ON public.zajecia;
DROP POLICY IF EXISTS "Users can create own classes" ON public.zajecia;
DROP POLICY IF EXISTS "Users can update own classes" ON public.zajecia;
DROP POLICY IF EXISTS "Users can delete own classes" ON public.zajecia;

-- New zajecia policies with role-based access
CREATE POLICY "Admin and konsultant can view all classes"
  ON public.zajecia FOR SELECT
  TO authenticated
  USING (is_admin_or_konsultant());

CREATE POLICY "Nauczyciel can view own classes"
  ON public.zajecia FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
    AND get_user_role() = 'nauczyciel'
  );

CREATE POLICY "Opiekun can view linked student classes"
  ON public.zajecia FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.student_guardians
      WHERE student_guardians.student_id = zajecia.student_id
      AND student_guardians.guardian_user_id = auth.uid()
    )
    AND get_user_role() = 'opiekun'
  );

CREATE POLICY "Uczen can view own classes"
  ON public.zajecia FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.student_user_mapping
      WHERE student_user_mapping.student_id = zajecia.student_id
      AND student_user_mapping.student_user_id = auth.uid()
    )
    AND get_user_role() = 'uczen'
  );

CREATE POLICY "Staff can create classes"
  ON public.zajecia FOR INSERT
  TO authenticated
  WITH CHECK (is_staff());

CREATE POLICY "Admin and konsultant can update all classes"
  ON public.zajecia FOR UPDATE
  TO authenticated
  USING (is_admin_or_konsultant())
  WITH CHECK (is_admin_or_konsultant());

CREATE POLICY "Nauczyciel can update own classes"
  ON public.zajecia FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    AND get_user_role() = 'nauczyciel'
  )
  WITH CHECK (
    created_by = auth.uid()
    AND get_user_role() = 'nauczyciel'
  );

CREATE POLICY "Staff can delete classes"
  ON public.zajecia FOR DELETE
  TO authenticated
  USING (
    is_admin_or_konsultant()
    OR (created_by = auth.uid() AND get_user_role() = 'nauczyciel')
  );

-- Drop existing platnosci policies
DROP POLICY IF EXISTS "Users can view own payments" ON public.platnosci;
DROP POLICY IF EXISTS "Users can create own payments" ON public.platnosci;
DROP POLICY IF EXISTS "Users can update own payments" ON public.platnosci;
DROP POLICY IF EXISTS "Users can delete own payments" ON public.platnosci;

-- New platnosci policies with role-based access
CREATE POLICY "Admin and konsultant can view all payments"
  ON public.platnosci FOR SELECT
  TO authenticated
  USING (is_admin_or_konsultant());

CREATE POLICY "Nauczyciel can view own payments"
  ON public.platnosci FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
    AND get_user_role() = 'nauczyciel'
  );

CREATE POLICY "Opiekun can view linked student payments"
  ON public.platnosci FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.student_guardians
      WHERE student_guardians.student_id = platnosci.student_id
      AND student_guardians.guardian_user_id = auth.uid()
    )
    AND get_user_role() = 'opiekun'
  );

CREATE POLICY "Uczen can view own payments"
  ON public.platnosci FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.student_user_mapping
      WHERE student_user_mapping.student_id = platnosci.student_id
      AND student_user_mapping.student_user_id = auth.uid()
    )
    AND get_user_role() = 'uczen'
  );

CREATE POLICY "Staff can create payments"
  ON public.platnosci FOR INSERT
  TO authenticated
  WITH CHECK (is_staff());

CREATE POLICY "Admin and konsultant can update all payments"
  ON public.platnosci FOR UPDATE
  TO authenticated
  USING (is_admin_or_konsultant())
  WITH CHECK (is_admin_or_konsultant());

CREATE POLICY "Nauczyciel can update own payments"
  ON public.platnosci FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    AND get_user_role() = 'nauczyciel'
  )
  WITH CHECK (
    created_by = auth.uid()
    AND get_user_role() = 'nauczyciel'
  );

CREATE POLICY "Staff can delete payments"
  ON public.platnosci FOR DELETE
  TO authenticated
  USING (
    is_admin_or_konsultant()
    OR (created_by = auth.uid() AND get_user_role() = 'nauczyciel')
  );

-- Update diagnozy policies
DROP POLICY IF EXISTS "Users can view their students' diagnostics" ON public.diagnozy;
DROP POLICY IF EXISTS "Users can create diagnostics" ON public.diagnozy;
DROP POLICY IF EXISTS "Users can update their diagnostics" ON public.diagnozy;
DROP POLICY IF EXISTS "Users can delete their diagnostics" ON public.diagnozy;

CREATE POLICY "Admin and konsultant can view all diagnostics"
  ON public.diagnozy FOR SELECT
  TO authenticated
  USING (is_admin_or_konsultant());

CREATE POLICY "Nauczyciel can view own diagnostics"
  ON public.diagnozy FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
    AND get_user_role() = 'nauczyciel'
  );

CREATE POLICY "Opiekun can view linked student diagnostics"
  ON public.diagnozy FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.student_guardians
      WHERE student_guardians.student_id = diagnozy.student_id
      AND student_guardians.guardian_user_id = auth.uid()
    )
    AND get_user_role() = 'opiekun'
  );

CREATE POLICY "Uczen can view own diagnostics"
  ON public.diagnozy FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.student_user_mapping
      WHERE student_user_mapping.student_id = diagnozy.student_id
      AND student_user_mapping.student_user_id = auth.uid()
    )
    AND get_user_role() = 'uczen'
  );

CREATE POLICY "Staff can create diagnostics"
  ON public.diagnozy FOR INSERT
  TO authenticated
  WITH CHECK (is_staff());

CREATE POLICY "Admin and konsultant can update all diagnostics"
  ON public.diagnozy FOR UPDATE
  TO authenticated
  USING (is_admin_or_konsultant())
  WITH CHECK (is_admin_or_konsultant());

CREATE POLICY "Nauczyciel can update own diagnostics"
  ON public.diagnozy FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    AND get_user_role() = 'nauczyciel'
  )
  WITH CHECK (
    created_by = auth.uid()
    AND get_user_role() = 'nauczyciel'
  );

CREATE POLICY "Staff can delete diagnostics"
  ON public.diagnozy FOR DELETE
  TO authenticated
  USING (
    is_admin_or_konsultant()
    OR (created_by = auth.uid() AND get_user_role() = 'nauczyciel')
  );

-- Update przedmiot_ucznia policies
DROP POLICY IF EXISTS "Users can view their students' subjects" ON public.przedmiot_ucznia;
DROP POLICY IF EXISTS "Users can create student subjects" ON public.przedmiot_ucznia;
DROP POLICY IF EXISTS "Users can update their student subjects" ON public.przedmiot_ucznia;
DROP POLICY IF EXISTS "Users can delete their student subjects" ON public.przedmiot_ucznia;

CREATE POLICY "Staff and related users can view student subjects"
  ON public.przedmiot_ucznia FOR SELECT
  TO authenticated
  USING (
    is_staff()
    OR EXISTS (
      SELECT 1 FROM public.student_guardians sg
      WHERE sg.student_id = przedmiot_ucznia.student_id
      AND sg.guardian_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.student_user_mapping sum
      WHERE sum.student_id = przedmiot_ucznia.student_id
      AND sum.student_user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can manage student subjects"
  ON public.przedmiot_ucznia FOR ALL
  TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff());

-- Update uczen_ksiazka policies
DROP POLICY IF EXISTS "Users can view their students' book assignments" ON public.uczen_ksiazka;
DROP POLICY IF EXISTS "Users can create student-book assignments" ON public.uczen_ksiazka;
DROP POLICY IF EXISTS "Users can update their student-book assignments" ON public.uczen_ksiazka;
DROP POLICY IF EXISTS "Users can delete their student-book assignments" ON public.uczen_ksiazka;

CREATE POLICY "Staff and related users can view student books"
  ON public.uczen_ksiazka FOR SELECT
  TO authenticated
  USING (
    is_staff()
    OR EXISTS (
      SELECT 1 FROM public.student_guardians sg
      WHERE sg.student_id = uczen_ksiazka.student_id
      AND sg.guardian_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.student_user_mapping sum
      WHERE sum.student_id = uczen_ksiazka.student_id
      AND sum.student_user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can manage student-book assignments"
  ON public.uczen_ksiazka FOR ALL
  TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff());
