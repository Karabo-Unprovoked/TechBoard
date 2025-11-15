-- Add Ticket Sub-Statuses Management
--
-- 1. New Tables
--    - ticket_sub_statuses table for managing sub-statuses within parent statuses
--
-- 2. Security
--    - Enable RLS on ticket_sub_statuses table
--    - Add policies for authenticated users to read sub-statuses
--    - Add policies for admins to manage sub-statuses
--
-- 3. Indexes
--    - Add index on parent_status_id for faster lookups
--    - Add unique constraint on (parent_status_id, sub_status_key)

-- Create ticket_sub_statuses table
CREATE TABLE IF NOT EXISTS ticket_sub_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_status_id uuid NOT NULL REFERENCES ticket_statuses(id) ON DELETE CASCADE,
  sub_status_key text NOT NULL,
  sub_status_label text NOT NULL,
  sub_status_order integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(parent_status_id, sub_status_key)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ticket_sub_statuses_parent ON ticket_sub_statuses(parent_status_id);

-- Enable RLS
ALTER TABLE ticket_sub_statuses ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read active sub-statuses
CREATE POLICY "Authenticated users can read sub-statuses"
  ON ticket_sub_statuses
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Admins can insert sub-statuses
CREATE POLICY "Admins can insert sub-statuses"
  ON ticket_sub_statuses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policy: Admins can update sub-statuses
CREATE POLICY "Admins can update sub-statuses"
  ON ticket_sub_statuses
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policy: Admins can delete sub-statuses
CREATE POLICY "Admins can delete sub-statuses"
  ON ticket_sub_statuses
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );
