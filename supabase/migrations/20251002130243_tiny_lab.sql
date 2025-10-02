/*
  # Add new ticket statuses and repair notes

  1. Schema Changes
    - Add `repair_notes` column to store reasons for unrepairable devices
    - Update status options to include new statuses

  2. New Statuses
    - `unrepairable`: For devices that cannot be repaired
    - `pending-customer-action`: For tickets waiting on customer response/action

  3. Security
    - Maintain existing RLS policies
*/

-- Add repair_notes column to store reasons for unrepairable devices
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'repair_tickets' AND column_name = 'repair_notes'
  ) THEN
    ALTER TABLE repair_tickets ADD COLUMN repair_notes text;
  END IF;
END $$;