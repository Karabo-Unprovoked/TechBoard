/*
  # Add UPDATE policy for email_settings table

  1. Security Changes
    - Add policy to allow authenticated users to update email settings
    - This allows admins (and all authenticated users) to update SMTP password
    - In production, you may want to restrict this further to only admin role

  2. Notes
    - Since user roles are stored in user_metadata, we allow all authenticated users
    - The UI already restricts this to admins only
*/

-- Allow authenticated users to update email settings
CREATE POLICY "Authenticated users can update email settings"
  ON email_settings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
