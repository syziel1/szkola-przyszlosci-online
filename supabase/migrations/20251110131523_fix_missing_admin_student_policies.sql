/*
  # Fix Missing Administrator and Konsultant Policies for Students
  
  ## Problem
  The RLS policies for administrators and konsultants on the uczniowie (students) table
  are completely missing. This prevents administrators from creating, viewing, updating,
  or deleting any students in the system.
  
  ## Root Cause
  During previous migrations that updated the RLS policies, the administrator and konsultant
  policies were dropped but never properly recreated. Only the nauczyciel (teacher),
  opiekun (guardian), and uczen (student) policies exist.
  
  ## Solution
  Add comprehensive RLS policies for administrators and konsultants that allow them to:
  - SELECT: View all students in the system
  - INSERT: Create students with any created_by value
  - UPDATE: Modify any student record
  - DELETE: Remove any student record
  
  ## Security Considerations
  - Administrators and konsultants need elevated privileges to manage the entire system
  - These roles can create students on behalf of teachers (setting created_by to teacher's ID)
  - This is intentional and required for administrative functions
  - The is_admin_or_konsultant() function ensures only authorized users get these privileges
  
  ## Tables Affected
  - uczniowie (students)
  
  ## Policies Added
  1. "Admin and konsultant can view all students" - SELECT
  2. "Admin and konsultant can create students" - INSERT  
  3. "Admin and konsultant can update all students" - UPDATE
  4. "Admin and konsultant can delete all students" - DELETE
*/

-- Add missing SELECT policy for administrators and konsultants
CREATE POLICY "Admin and konsultant can view all students"
  ON public.uczniowie FOR SELECT
  TO authenticated
  USING (is_admin_or_konsultant());

-- Add missing INSERT policy for administrators and konsultants
-- Note: No restriction on created_by field - admins can create students for any teacher
CREATE POLICY "Admin and konsultant can create students"
  ON public.uczniowie FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_or_konsultant());

-- Add missing UPDATE policy for administrators and konsultants
CREATE POLICY "Admin and konsultant can update all students"
  ON public.uczniowie FOR UPDATE
  TO authenticated
  USING (is_admin_or_konsultant())
  WITH CHECK (is_admin_or_konsultant());

-- Add missing DELETE policy for administrators and konsultants
CREATE POLICY "Admin and konsultant can delete all students"
  ON public.uczniowie FOR DELETE
  TO authenticated
  USING (is_admin_or_konsultant());