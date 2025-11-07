/*
  # Create Authentication Settings Table

  ## Overview
  This migration creates a table to manage authentication and security settings for users.

  ## 1. New Tables

  ### `auth_settings` (Authentication Settings)
  - `id` (uuid, primary key) - Unique setting record identifier
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  - `user_id` (uuid, unique) - Reference to auth.users, one settings record per user
  - `enable_2fa` (boolean) - Whether two-factor authentication is enabled
  - `session_timeout_minutes` (integer) - Session timeout duration in minutes
  - `require_password_change` (boolean) - Whether user needs to change password
  - `last_password_change` (timestamptz) - Timestamp of last password change
  - `failed_login_attempts` (integer) - Count of consecutive failed login attempts
  - `account_locked_until` (timestamptz, nullable) - Account lock expiry time
  - `email_notifications` (boolean) - Whether to send email notifications for security events
  - `login_notification` (boolean) - Whether to notify on new login
  - `allowed_ip_addresses` (text[], nullable) - Array of allowed IP addresses (if IP restriction enabled)
  - `security_questions_set` (boolean) - Whether security questions are configured
  - `backup_email` (text, nullable) - Backup/recovery email address

  ## 2. Security
  - Enable RLS on auth_settings table
  - Users can only view and update their own authentication settings
  - Settings are automatically created for new users via trigger
  - Strict policies ensure data isolation per user

  ## 3. Triggers
  - Auto-update `updated_at` timestamp on row changes
  - Create default settings when new user registers

  ## 4. Indexes
  - Index on `user_id` for fast user lookups
  - Index on `account_locked_until` for lock expiry checks

  ## 5. Important Notes
  - Each user has exactly one auth_settings record
  - Default values provide sensible security defaults
  - Account locking mechanism helps prevent brute force attacks
  - Settings are fully customizable per user
*/

-- Create auth_settings table
CREATE TABLE IF NOT EXISTS auth_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  enable_2fa boolean DEFAULT false NOT NULL,
  session_timeout_minutes integer DEFAULT 480 NOT NULL CHECK (session_timeout_minutes > 0),
  require_password_change boolean DEFAULT false NOT NULL,
  last_password_change timestamptz DEFAULT now(),
  failed_login_attempts integer DEFAULT 0 NOT NULL CHECK (failed_login_attempts >= 0),
  account_locked_until timestamptz,
  email_notifications boolean DEFAULT true NOT NULL,
  login_notification boolean DEFAULT false NOT NULL,
  allowed_ip_addresses text[],
  security_questions_set boolean DEFAULT false NOT NULL,
  backup_email text
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_auth_settings_user_id ON auth_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_settings_locked_until ON auth_settings(account_locked_until) WHERE account_locked_until IS NOT NULL;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_auth_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_auth_settings_updated_at ON auth_settings;
CREATE TRIGGER trigger_update_auth_settings_updated_at
  BEFORE UPDATE ON auth_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_auth_settings_updated_at();

-- Create function to initialize auth settings for new users
CREATE OR REPLACE FUNCTION initialize_auth_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO auth_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create settings for new users
DROP TRIGGER IF EXISTS trigger_initialize_auth_settings ON auth.users;
CREATE TRIGGER trigger_initialize_auth_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_auth_settings();

-- Enable Row Level Security
ALTER TABLE auth_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for auth_settings
CREATE POLICY "Users can view own auth settings"
  ON auth_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own auth settings"
  ON auth_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Note: INSERT and DELETE are handled by triggers and cascading deletes
-- Users should not manually insert or delete settings records