/*
  # Add SLA Tracking to Repair Tickets

  1. Changes
    - Add `status_changed_at` timestamp column to track when status was last changed
    - Add `sla_hours` column to define SLA threshold per ticket (default 72 hours)
    - Create function to automatically update `status_changed_at` when status changes
    - Create trigger to call the function on status updates
    - Add index on `status_changed_at` for performance
    - Backfill existing tickets with current timestamp

  2. Purpose
    - Enable SLA monitoring and alerting
    - Track how long tickets have been in current status
    - Alert users when tickets are overdue
*/

-- Add new columns to repair_tickets table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'repair_tickets' AND column_name = 'status_changed_at'
  ) THEN
    ALTER TABLE repair_tickets ADD COLUMN status_changed_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'repair_tickets' AND column_name = 'sla_hours'
  ) THEN
    ALTER TABLE repair_tickets ADD COLUMN sla_hours integer DEFAULT 72;
  END IF;
END $$;

-- Create function to update status_changed_at when status changes
CREATE OR REPLACE FUNCTION update_status_changed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_changed_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_update_status_changed_at ON repair_tickets;

CREATE TRIGGER trigger_update_status_changed_at
  BEFORE UPDATE ON repair_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_status_changed_at();

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_repair_tickets_status_changed_at 
  ON repair_tickets(status_changed_at);

-- Backfill status_changed_at for existing tickets (use updated_at or created_at)
UPDATE repair_tickets
SET status_changed_at = COALESCE(updated_at, created_at)
WHERE status_changed_at IS NULL OR status_changed_at = created_at;