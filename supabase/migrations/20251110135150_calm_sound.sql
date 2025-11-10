/*
  # Add INSERT policy for zajecia table

  1. Security
    - Add policy for authenticated users to insert their own zajecia records
    - Ensures created_by field matches the authenticated user's ID

  This fixes the RLS policy violation when creating new zajecia records.
*/

-- Add INSERT policy for zajecia table
CREATE POLICY "Nauczyciel can create own classes"
  ON zajecia
  FOR INSERT
  TO authenticated
  WITH CHECK ((created_by = uid()) AND (get_user_role() = 'nauczyciel'::user_role_enum));

-- Also add INSERT policy for admin and konsultant roles
CREATE POLICY "Admin and konsultant can create classes"
  ON zajecia
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_or_konsultant());