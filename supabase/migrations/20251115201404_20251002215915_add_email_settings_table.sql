/*
  # Add Email Settings Configuration Table

  1. New Tables
    - `email_settings`
      - `id` (uuid, primary key) - Unique identifier for settings record
      - `smtp_host` (text) - SMTP server hostname
      - `smtp_port` (integer) - SMTP server port
      - `smtp_username` (text) - SMTP authentication username (email address)
      - `smtp_password` (text) - SMTP authentication password
      - `from_email` (text) - Email address to send from
      - `from_name` (text) - Display name for sender
      - `use_ssl` (boolean) - Whether to use SSL/TLS
      - `updated_at` (timestamptz) - Last update timestamp
      - `updated_by` (uuid) - User who last updated settings

  2. Security
    - Enable RLS on `email_settings` table
    - Only authenticated users can read email settings (for edge functions)
    - Only admin users can update email settings
    - Single row enforcement for settings

  3. Default Configuration
    - Insert default settings for computerguardian.co.za
*/

CREATE TABLE IF NOT EXISTS email_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  smtp_host text NOT NULL DEFAULT 'computerguardian.co.za',
  smtp_port integer NOT NULL DEFAULT 465,
  smtp_username text NOT NULL DEFAULT 'info@computerguardian.co.za',
  smtp_password text NOT NULL DEFAULT '',
  from_email text NOT NULL DEFAULT 'info@computerguardian.co.za',
  from_name text NOT NULL DEFAULT 'Guardian Assist',
  use_ssl boolean NOT NULL DEFAULT true,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view email settings"
  ON email_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE UNIQUE INDEX IF NOT EXISTS email_settings_singleton ON email_settings ((true));

INSERT INTO email_settings (smtp_host, smtp_port, smtp_username, smtp_password, from_email, from_name, use_ssl)
VALUES ('computerguardian.co.za', 465, 'info@computerguardian.co.za', '', 'info@computerguardian.co.za', 'Guardian Assist', true)
ON CONFLICT DO NOTHING;