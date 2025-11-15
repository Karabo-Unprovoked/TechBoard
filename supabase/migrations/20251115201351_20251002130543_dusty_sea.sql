/*
  # Add ticket management features

  1. New Tables
    - `ticket_notes` - For tracking repair progress notes
    - `ticket_emails` - For email communication history
    - `ticket_attachments` - For photos and documents

  2. Updates
    - Add estimated completion date to repair_tickets
    - Add priority field to repair_tickets
    - Add cost estimates to repair_tickets

  3. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'repair_tickets' AND column_name = 'estimated_completion'
  ) THEN
    ALTER TABLE repair_tickets ADD COLUMN estimated_completion timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'repair_tickets' AND column_name = 'priority'
  ) THEN
    ALTER TABLE repair_tickets ADD COLUMN priority text DEFAULT 'medium';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'repair_tickets' AND column_name = 'estimated_cost'
  ) THEN
    ALTER TABLE repair_tickets ADD COLUMN estimated_cost decimal(10,2);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'repair_tickets' AND column_name = 'actual_cost'
  ) THEN
    ALTER TABLE repair_tickets ADD COLUMN actual_cost decimal(10,2);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS ticket_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES repair_tickets(id) ON DELETE CASCADE,
  note_type text DEFAULT 'internal',
  content text NOT NULL,
  created_by text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ticket_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage ticket notes"
  ON ticket_notes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS ticket_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES repair_tickets(id) ON DELETE CASCADE,
  email_type text DEFAULT 'status_update',
  recipient_email text NOT NULL,
  subject text NOT NULL,
  content text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  sent_by text
);

ALTER TABLE ticket_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage ticket emails"
  ON ticket_emails
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS ticket_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES repair_tickets(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_type text,
  file_size integer,
  file_url text NOT NULL,
  uploaded_by text,
  uploaded_at timestamptz DEFAULT now()
);

ALTER TABLE ticket_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage ticket attachments"
  ON ticket_attachments
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);