/*
  # Set Administrator User

  ## Overview
  This migration sets syziel@gmail.com as the main administrator of the system.
  This user will have full access to manage users, assign roles, and oversee all operations.

  ## Actions
  1. Check if user exists in auth.users with email syziel@gmail.com
  2. Update or insert user_profiles to set role as 'administrator'
  3. Set is_active to true
  4. Log this action in audit_log

  ## Important Notes
  - If the user doesn't exist yet, they will be assigned administrator role when they first sign up
  - This is idempotent - safe to run multiple times
  - Only affects the user_profiles table
*/

-- Update or insert administrator profile for syziel@gmail.com
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get user_id for syziel@gmail.com
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'syziel@gmail.com';

  -- If user exists, update their profile
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_profiles (user_id, role, is_active, full_name)
    VALUES (v_user_id, 'administrator', true, 'System Administrator')
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      role = 'administrator',
      is_active = true,
      updated_at = now();

    -- Log the action
    INSERT INTO public.audit_log (user_id, action, table_name, record_id, new_values)
    VALUES (
      v_user_id,
      'Set user as administrator',
      'user_profiles',
      (SELECT id FROM public.user_profiles WHERE user_id = v_user_id),
      jsonb_build_object('role', 'administrator', 'email', 'syziel@gmail.com')
    );

    RAISE NOTICE 'Successfully set syziel@gmail.com as administrator';
  ELSE
    RAISE NOTICE 'User syziel@gmail.com not found. They will be assigned administrator role upon first login.';
  END IF;
END $$;

-- Create a function to ensure syziel@gmail.com always gets administrator role
CREATE OR REPLACE FUNCTION ensure_admin_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email = 'syziel@gmail.com' THEN
    -- Update the profile that was just created by the initialize_user_profile trigger
    UPDATE public.user_profiles
    SET role = 'administrator', is_active = true
    WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to catch when syziel@gmail.com signs up
DROP TRIGGER IF EXISTS trigger_ensure_admin_role ON auth.users;
CREATE TRIGGER trigger_ensure_admin_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.email = 'syziel@gmail.com')
  EXECUTE FUNCTION ensure_admin_role();
