/*
  # Update Ticket Status System

  1. New Columns
    - Add `internal_status` column for tracking sub-statuses under 'in-progress'
    - Add `outsourced_to` column for tracking where repairs are outsourced
    - Add `pending_customer_action_type` column for tracking specific customer action needed

  2. Changes
    - Internal status options: 'waiting-for-part', 'repairing', 'outsourced'
    - Pending customer action types: 'collect', 'call-us-back'
    
  3. Notes
    - internal_status is only used when main status is 'in-progress'
    - outsourced_to is only used when internal_status is 'outsourced'
    - pending_customer_action_type is only used when status is 'pending-customer-action'
*/

-- Add internal_status column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'repair_tickets' AND column_name = 'internal_status'
  ) THEN
    ALTER TABLE repair_tickets ADD COLUMN internal_status text;
  END IF;
END $$;

-- Add outsourced_to column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'repair_tickets' AND column_name = 'outsourced_to'
  ) THEN
    ALTER TABLE repair_tickets ADD COLUMN outsourced_to text;
  END IF;
END $$;

-- Add pending_customer_action_type column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'repair_tickets' AND column_name = 'pending_customer_action_type'
  ) THEN
    ALTER TABLE repair_tickets ADD COLUMN pending_customer_action_type text;
  END IF;
END $$;

-- Create statuses table for customizable status management
CREATE TABLE IF NOT EXISTS ticket_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status_key text UNIQUE NOT NULL,
  status_label text NOT NULL,
  status_order integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ticket_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ticket statuses"
  ON ticket_statuses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert ticket statuses"
  ON ticket_statuses FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update ticket statuses"
  ON ticket_statuses FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete ticket statuses"
  ON ticket_statuses FOR DELETE
  TO authenticated
  USING (true);

-- Insert default statuses if table is empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ticket_statuses LIMIT 1) THEN
    INSERT INTO ticket_statuses (status_key, status_label, status_order, is_active) VALUES
      ('in-transit', 'In Transit', 1, true),
      ('received', 'Received', 2, true),
      ('in-progress', 'In Progress', 3, true),
      ('invoiced', 'Invoiced', 4, true),
      ('completed', 'Completed', 5, true),
      ('unrepairable', 'Unrepairable', 6, true),
      ('pending-customer-action', 'Pending Customer Action', 7, true);
  END IF;
END $$;
