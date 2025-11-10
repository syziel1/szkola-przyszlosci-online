/*
  # Fix Security and Performance Issues
  
  ## Overview
  This migration addresses multiple security and performance issues identified by Supabase:
  
  ## 1. Missing Indexes on Foreign Keys
  Adds covering indexes for all `created_by` foreign key columns to improve query performance
  
  ## 2. RLS Policy Optimization
  Wraps `auth.uid()` calls in SELECT subqueries to prevent re-evaluation for each row
  
  ## 3. Function Security Hardening
  Sets explicit search_path for all security-sensitive functions
  
  ## Tables Affected
  - diagnozy, ksiazki, linki, przedmiot_ucznia, student_guardians
  - student_user_mapping, uczen_ksiazka, auth_settings, user_profiles
  - uczniowie, zajecia, platnosci, audit_log
  
  ## Performance Impact
  - Faster foreign key lookups
  - Reduced RLS evaluation overhead
  - More secure function execution context
*/

-- ============================================================================
-- PART 1: Add Missing Indexes on Foreign Keys
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_diagnozy_created_by ON public.diagnozy(created_by);
CREATE INDEX IF NOT EXISTS idx_ksiazki_created_by ON public.ksiazki(created_by);
CREATE INDEX IF NOT EXISTS idx_linki_created_by ON public.linki(created_by);
CREATE INDEX IF NOT EXISTS idx_przedmiot_ucznia_created_by ON public.przedmiot_ucznia(created_by);
CREATE INDEX IF NOT EXISTS idx_student_guardians_created_by ON public.student_guardians(created_by);
CREATE INDEX IF NOT EXISTS idx_student_user_mapping_created_by ON public.student_user_mapping(created_by);
CREATE INDEX IF NOT EXISTS idx_uczen_ksiazka_created_by ON public.uczen_ksiazka(created_by);

-- ============================================================================
-- PART 2: Drop and Recreate Functions with Fixed Search Paths
-- ============================================================================

DROP FUNCTION IF EXISTS get_user_role() CASCADE;
CREATE FUNCTION get_user_role()
RETURNS user_role_enum AS $$
BEGIN
  RETURN (
    SELECT role FROM public.user_profiles
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public, pg_temp;

DROP FUNCTION IF EXISTS is_admin_or_konsultant() CASCADE;
CREATE FUNCTION is_admin_or_konsultant()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('administrator', 'konsultant')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public, pg_temp;

DROP FUNCTION IF EXISTS is_staff() CASCADE;
CREATE FUNCTION is_staff()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('administrator', 'konsultant', 'nauczyciel')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public, pg_temp;

DROP FUNCTION IF EXISTS ensure_admin_role() CASCADE;
CREATE FUNCTION ensure_admin_role()
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid()
    AND role = 'administrator'
  ) THEN
    RAISE EXCEPTION 'Only administrators can perform this action';
  END IF;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

DROP FUNCTION IF EXISTS initialize_user_profile() CASCADE;
CREATE FUNCTION initialize_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, role, full_name, is_active)
  VALUES (NEW.id, 'uczen', COALESCE(NEW.raw_user_meta_data->>'full_name', ''), TRUE)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

DROP FUNCTION IF EXISTS update_auth_settings_updated_at() CASCADE;
CREATE FUNCTION update_auth_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

DROP FUNCTION IF EXISTS initialize_auth_settings() CASCADE;
CREATE FUNCTION initialize_auth_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.auth_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

DROP FUNCTION IF EXISTS update_user_profiles_updated_at() CASCADE;
CREATE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

DROP FUNCTION IF EXISTS log_role_change() CASCADE;
CREATE FUNCTION log_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.audit_log (
      user_id,
      action,
      table_name,
      record_id,
      old_values,
      new_values,
      changed_by
    ) VALUES (
      NEW.user_id,
      'role_change',
      'user_profiles',
      NEW.id,
      jsonb_build_object('role', OLD.role),
      jsonb_build_object('role', NEW.role),
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- ============================================================================
-- PART 3: Recreate Triggers (if they were CASCADE dropped)
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_profile();

DROP TRIGGER IF EXISTS on_auth_user_created_settings ON auth.users;
CREATE TRIGGER on_auth_user_created_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_auth_settings();

DROP TRIGGER IF EXISTS update_auth_settings_updated_at_trigger ON public.auth_settings;
CREATE TRIGGER update_auth_settings_updated_at_trigger
  BEFORE UPDATE ON public.auth_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_auth_settings_updated_at();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at_trigger ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at_trigger
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

DROP TRIGGER IF EXISTS log_user_profile_role_change ON public.user_profiles;
CREATE TRIGGER log_user_profile_role_change
  AFTER UPDATE OF role ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION log_role_change();

-- ============================================================================
-- PART 4: Optimize RLS Policies - auth_settings
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own auth settings" ON public.auth_settings;
DROP POLICY IF EXISTS "Users can update own auth settings" ON public.auth_settings;

CREATE POLICY "Users can view own auth settings"
  ON public.auth_settings FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own auth settings"
  ON public.auth_settings FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================================
-- PART 5: Optimize RLS Policies - ksiazki
-- ============================================================================

DROP POLICY IF EXISTS "Users can create books" ON public.ksiazki;
DROP POLICY IF EXISTS "Users can update their own books" ON public.ksiazki;
DROP POLICY IF EXISTS "Users can delete their own books" ON public.ksiazki;

CREATE POLICY "Users can create books"
  ON public.ksiazki FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = created_by);

CREATE POLICY "Users can update their own books"
  ON public.ksiazki FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = created_by)
  WITH CHECK ((SELECT auth.uid()) = created_by);

CREATE POLICY "Users can delete their own books"
  ON public.ksiazki FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = created_by);

-- ============================================================================
-- PART 6: Optimize RLS Policies - linki
-- ============================================================================

DROP POLICY IF EXISTS "Users can create links" ON public.linki;
DROP POLICY IF EXISTS "Users can update their own links" ON public.linki;
DROP POLICY IF EXISTS "Users can delete their own links" ON public.linki;

CREATE POLICY "Users can create links"
  ON public.linki FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = created_by);

CREATE POLICY "Users can update their own links"
  ON public.linki FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = created_by)
  WITH CHECK ((SELECT auth.uid()) = created_by);

CREATE POLICY "Users can delete their own links"
  ON public.linki FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = created_by);

-- ============================================================================
-- PART 7: Optimize RLS Policies - user_profiles
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Administrators can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Administrators can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own non-role fields" ON public.user_profiles;

CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Administrators can view all profiles"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = (SELECT auth.uid())
      AND up.role = 'administrator'
    )
  );

CREATE POLICY "Administrators can update all profiles"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = (SELECT auth.uid())
      AND up.role = 'administrator'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = (SELECT auth.uid())
      AND up.role = 'administrator'
    )
  );

CREATE POLICY "Users can update own non-role fields"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND role = (SELECT up.role FROM public.user_profiles up WHERE up.user_id = (SELECT auth.uid()))
  );

-- ============================================================================
-- PART 8: Optimize RLS Policies - student_guardians
-- ============================================================================

DROP POLICY IF EXISTS "Guardians can view their student relationships" ON public.student_guardians;
DROP POLICY IF EXISTS "Staff can create guardian relationships" ON public.student_guardians;
DROP POLICY IF EXISTS "Staff can delete guardian relationships" ON public.student_guardians;

CREATE POLICY "Guardians can view their student relationships"
  ON public.student_guardians FOR SELECT
  TO authenticated
  USING (guardian_user_id = (SELECT auth.uid()));

CREATE POLICY "Staff can create guardian relationships"
  ON public.student_guardians FOR INSERT
  TO authenticated
  WITH CHECK (is_staff());

CREATE POLICY "Staff can delete guardian relationships"
  ON public.student_guardians FOR DELETE
  TO authenticated
  USING (is_staff());

-- ============================================================================
-- PART 9: Optimize RLS Policies - student_user_mapping
-- ============================================================================

DROP POLICY IF EXISTS "Users can view relevant student mappings" ON public.student_user_mapping;
DROP POLICY IF EXISTS "Staff can create student user mappings" ON public.student_user_mapping;
DROP POLICY IF EXISTS "Staff can delete student user mappings" ON public.student_user_mapping;

CREATE POLICY "Users can view relevant student mappings"
  ON public.student_user_mapping FOR SELECT
  TO authenticated
  USING (
    student_user_id = (SELECT auth.uid())
    OR is_staff()
  );

CREATE POLICY "Staff can create student user mappings"
  ON public.student_user_mapping FOR INSERT
  TO authenticated
  WITH CHECK (is_staff());

CREATE POLICY "Staff can delete student user mappings"
  ON public.student_user_mapping FOR DELETE
  TO authenticated
  USING (is_staff());

-- ============================================================================
-- PART 10: Optimize RLS Policies - audit_log
-- ============================================================================

DROP POLICY IF EXISTS "Administrators can view audit logs" ON public.audit_log;

CREATE POLICY "Administrators can view audit logs"
  ON public.audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = (SELECT auth.uid())
      AND role = 'administrator'
    )
  );

-- ============================================================================
-- PART 11: Optimize RLS Policies - uczniowie
-- ============================================================================

DROP POLICY IF EXISTS "Nauczyciel can view own students" ON public.uczniowie;
DROP POLICY IF EXISTS "Opiekun can view linked students" ON public.uczniowie;
DROP POLICY IF EXISTS "Uczen can view own student record" ON public.uczniowie;
DROP POLICY IF EXISTS "Nauczyciel can create own students" ON public.uczniowie;
DROP POLICY IF EXISTS "Nauczyciel can update own students" ON public.uczniowie;
DROP POLICY IF EXISTS "Nauczyciel can delete own students" ON public.uczniowie;

CREATE POLICY "Nauczyciel can view own students"
  ON public.uczniowie FOR SELECT
  TO authenticated
  USING (
    created_by = (SELECT auth.uid())
    AND get_user_role() = 'nauczyciel'
  );

CREATE POLICY "Opiekun can view linked students"
  ON public.uczniowie FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.student_guardians
      WHERE student_guardians.student_id = uczniowie.id
      AND student_guardians.guardian_user_id = (SELECT auth.uid())
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
      AND student_user_mapping.student_user_id = (SELECT auth.uid())
    )
    AND get_user_role() = 'uczen'
  );

CREATE POLICY "Nauczyciel can create own students"
  ON public.uczniowie FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND get_user_role() = 'nauczyciel'
  );

CREATE POLICY "Nauczyciel can update own students"
  ON public.uczniowie FOR UPDATE
  TO authenticated
  USING (
    created_by = (SELECT auth.uid())
    AND get_user_role() = 'nauczyciel'
  )
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND get_user_role() = 'nauczyciel'
  );

CREATE POLICY "Nauczyciel can delete own students"
  ON public.uczniowie FOR DELETE
  TO authenticated
  USING (
    created_by = (SELECT auth.uid())
    AND get_user_role() = 'nauczyciel'
  );

-- ============================================================================
-- PART 12: Optimize RLS Policies - zajecia
-- ============================================================================

DROP POLICY IF EXISTS "Nauczyciel can view own classes" ON public.zajecia;
DROP POLICY IF EXISTS "Opiekun can view linked student classes" ON public.zajecia;
DROP POLICY IF EXISTS "Uczen can view own classes" ON public.zajecia;
DROP POLICY IF EXISTS "Nauczyciel can update own classes" ON public.zajecia;
DROP POLICY IF EXISTS "Staff can delete classes" ON public.zajecia;

CREATE POLICY "Nauczyciel can view own classes"
  ON public.zajecia FOR SELECT
  TO authenticated
  USING (
    created_by = (SELECT auth.uid())
    AND get_user_role() = 'nauczyciel'
  );

CREATE POLICY "Opiekun can view linked student classes"
  ON public.zajecia FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.student_guardians
      WHERE student_guardians.student_id = zajecia.student_id
      AND student_guardians.guardian_user_id = (SELECT auth.uid())
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
      AND student_user_mapping.student_user_id = (SELECT auth.uid())
    )
    AND get_user_role() = 'uczen'
  );

CREATE POLICY "Nauczyciel can update own classes"
  ON public.zajecia FOR UPDATE
  TO authenticated
  USING (
    created_by = (SELECT auth.uid())
    AND get_user_role() = 'nauczyciel'
  )
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND get_user_role() = 'nauczyciel'
  );

CREATE POLICY "Staff can delete classes"
  ON public.zajecia FOR DELETE
  TO authenticated
  USING (
    is_admin_or_konsultant()
    OR (created_by = (SELECT auth.uid()) AND get_user_role() = 'nauczyciel')
  );

-- ============================================================================
-- PART 13: Optimize RLS Policies - platnosci
-- ============================================================================

DROP POLICY IF EXISTS "Nauczyciel can view own payments" ON public.platnosci;
DROP POLICY IF EXISTS "Opiekun can view linked student payments" ON public.platnosci;
DROP POLICY IF EXISTS "Uczen can view own payments" ON public.platnosci;
DROP POLICY IF EXISTS "Nauczyciel can update own payments" ON public.platnosci;
DROP POLICY IF EXISTS "Staff can delete payments" ON public.platnosci;

CREATE POLICY "Nauczyciel can view own payments"
  ON public.platnosci FOR SELECT
  TO authenticated
  USING (
    created_by = (SELECT auth.uid())
    AND get_user_role() = 'nauczyciel'
  );

CREATE POLICY "Opiekun can view linked student payments"
  ON public.platnosci FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.student_guardians
      WHERE student_guardians.student_id = platnosci.student_id
      AND student_guardians.guardian_user_id = (SELECT auth.uid())
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
      AND student_user_mapping.student_user_id = (SELECT auth.uid())
    )
    AND get_user_role() = 'uczen'
  );

CREATE POLICY "Nauczyciel can update own payments"
  ON public.platnosci FOR UPDATE
  TO authenticated
  USING (
    created_by = (SELECT auth.uid())
    AND get_user_role() = 'nauczyciel'
  )
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND get_user_role() = 'nauczyciel'
  );

CREATE POLICY "Staff can delete payments"
  ON public.platnosci FOR DELETE
  TO authenticated
  USING (
    is_admin_or_konsultant()
    OR (created_by = (SELECT auth.uid()) AND get_user_role() = 'nauczyciel')
  );

-- ============================================================================
-- PART 14: Optimize RLS Policies - diagnozy
-- ============================================================================

DROP POLICY IF EXISTS "Nauczyciel can view own diagnostics" ON public.diagnozy;
DROP POLICY IF EXISTS "Opiekun can view linked student diagnostics" ON public.diagnozy;
DROP POLICY IF EXISTS "Uczen can view own diagnostics" ON public.diagnozy;
DROP POLICY IF EXISTS "Nauczyciel can update own diagnostics" ON public.diagnozy;
DROP POLICY IF EXISTS "Staff can delete diagnostics" ON public.diagnozy;

CREATE POLICY "Nauczyciel can view own diagnostics"
  ON public.diagnozy FOR SELECT
  TO authenticated
  USING (
    created_by = (SELECT auth.uid())
    AND get_user_role() = 'nauczyciel'
  );

CREATE POLICY "Opiekun can view linked student diagnostics"
  ON public.diagnozy FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.student_guardians
      WHERE student_guardians.student_id = diagnozy.student_id
      AND student_guardians.guardian_user_id = (SELECT auth.uid())
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
      AND student_user_mapping.student_user_id = (SELECT auth.uid())
    )
    AND get_user_role() = 'uczen'
  );

CREATE POLICY "Nauczyciel can update own diagnostics"
  ON public.diagnozy FOR UPDATE
  TO authenticated
  USING (
    created_by = (SELECT auth.uid())
    AND get_user_role() = 'nauczyciel'
  )
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND get_user_role() = 'nauczyciel'
  );

CREATE POLICY "Staff can delete diagnostics"
  ON public.diagnozy FOR DELETE
  TO authenticated
  USING (
    is_admin_or_konsultant()
    OR (created_by = (SELECT auth.uid()) AND get_user_role() = 'nauczyciel')
  );

-- ============================================================================
-- PART 15: Optimize RLS Policies - przedmiot_ucznia
-- ============================================================================

DROP POLICY IF EXISTS "Staff and related users can view student subjects" ON public.przedmiot_ucznia;

CREATE POLICY "Staff and related users can view student subjects"
  ON public.przedmiot_ucznia FOR SELECT
  TO authenticated
  USING (
    is_staff()
    OR EXISTS (
      SELECT 1 FROM public.student_guardians sg
      WHERE sg.student_id = przedmiot_ucznia.student_id
      AND sg.guardian_user_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.student_user_mapping sum
      WHERE sum.student_id = przedmiot_ucznia.student_id
      AND sum.student_user_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- PART 16: Optimize RLS Policies - uczen_ksiazka
-- ============================================================================

DROP POLICY IF EXISTS "Staff and related users can view student books" ON public.uczen_ksiazka;

CREATE POLICY "Staff and related users can view student books"
  ON public.uczen_ksiazka FOR SELECT
  TO authenticated
  USING (
    is_staff()
    OR EXISTS (
      SELECT 1 FROM public.student_guardians sg
      WHERE sg.student_id = uczen_ksiazka.student_id
      AND sg.guardian_user_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.student_user_mapping sum
      WHERE sum.student_id = uczen_ksiazka.student_id
      AND sum.student_user_id = (SELECT auth.uid())
    )
  );
