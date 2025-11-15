/*
  # Add Admin Settings Table

  1. New Tables
    - `admin_settings`
      - `id` (uuid, primary key)
      - `setting_key` (text, unique) - The setting name
      - `setting_value` (text) - The setting value
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Initial Data
    - Insert default admin password setting

  3. Security
    - Enable RLS on `admin_settings` table
    - Add policy for authenticated users to read settings
    - Add policy for authenticated users to update settings

  4. Important Notes
    - Stores system-wide admin settings
    - Admin password is stored here for easy management
    - Can be extended for other admin settings in the future
*/

CREATE TABLE IF NOT EXISTS admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read admin settings"
  ON admin_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update admin settings"
  ON admin_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can insert admin settings"
  ON admin_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admin_settings WHERE setting_key = 'admin_password') THEN
    INSERT INTO admin_settings (setting_key, setting_value)
    VALUES ('admin_password', 'admin123');
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON admin_settings(setting_key);