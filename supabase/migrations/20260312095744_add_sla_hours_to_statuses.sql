/*
  # Add SLA Hours to Ticket Statuses

  1. Changes
    - Add `sla_hours` column to ticket_statuses table to define SLA per status
    - Update existing statuses with the specified SLA hours:
      - Pending: 24 hours (1 day)
      - Received: 48 hours (2 days)
      - In Progress: 120 hours (5 days)
      - Invoiced: 480 hours (20 days)
      - Unrepairable: NULL (no SLA)
    - Modify trigger to automatically set ticket SLA based on status
    - Backfill existing tickets with correct SLA hours based on current status

  2. Purpose
    - Centralize SLA configuration at the status level
    - Automatically apply correct SLA when ticket status changes
    - Support different SLA requirements for different ticket statuses
*/

-- Add sla_hours column to ticket_statuses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ticket_statuses' AND column_name = 'sla_hours'
  ) THEN
    ALTER TABLE ticket_statuses ADD COLUMN sla_hours integer;
  END IF;
END $$;

-- Update existing statuses with SLA hours
UPDATE ticket_statuses SET sla_hours = 24 WHERE status_key = 'pending';
UPDATE ticket_statuses SET sla_hours = 48 WHERE status_key = 'received';
UPDATE ticket_statuses SET sla_hours = 120 WHERE status_key = 'in-progress';
UPDATE ticket_statuses SET sla_hours = 480 WHERE status_key = 'invoiced';
UPDATE ticket_statuses SET sla_hours = NULL WHERE status_key = 'unrepairable';

-- Set default SLA for other statuses if they exist
UPDATE ticket_statuses 
SET sla_hours = 72 
WHERE status_key NOT IN ('pending', 'received', 'in-progress', 'invoiced', 'unrepairable')
  AND sla_hours IS NULL;

-- Create or replace function to update status_changed_at and sla_hours when status changes
CREATE OR REPLACE FUNCTION update_status_changed_at()
RETURNS TRIGGER AS $$
DECLARE
  status_sla_hours integer;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_changed_at = now();
    
    -- Get SLA hours for the new status
    SELECT sla_hours INTO status_sla_hours
    FROM ticket_statuses
    WHERE status_key = NEW.status;
    
    -- Update ticket SLA hours based on status
    NEW.sla_hours = status_sla_hours;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger already exists from previous migration, no need to recreate

-- Backfill existing tickets with correct SLA hours based on their current status
UPDATE repair_tickets rt
SET sla_hours = ts.sla_hours
FROM ticket_statuses ts
WHERE rt.status = ts.status_key;
