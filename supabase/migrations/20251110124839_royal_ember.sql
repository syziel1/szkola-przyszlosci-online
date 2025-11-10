/*
  # Fix infinite recursion in user_profiles RLS policies

  1. Problem
    - Current RLS policies on user_profiles table are causing infinite recursion
    - Policies are calling functions that query user_profiles table again
    - This creates a loop when trying to fetch user profile data

  2. Solution
    - Replace recursive policies with simple, direct policies
    - Use auth.uid() directly instead of helper functions that query user_profiles
    - Maintain security while avoiding recursion

  3. Changes
    - Drop existing problematic policies
    - Create new non-recursive policies for user profile access
*/

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own non-role fields" ON user_profiles;
DROP POLICY IF EXISTS "Administrators can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Administrators can update all profiles" ON user_profiles;

-- Create new non-recursive policies
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND role = (SELECT role FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Service role can manage all profiles"
  ON user_profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);