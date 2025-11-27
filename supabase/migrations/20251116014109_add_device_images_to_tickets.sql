/*
  # Add Device Images to Repair Tickets

  1. Changes
    - Add device_images column to repair_tickets table
    - Store array of image URLs from registration requests

  2. Notes
    - Images are transferred from registration_requests when ticket is created
    - Allows viewing device photos directly in ticket management
*/

-- Add device_images column to repair_tickets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'repair_tickets' AND column_name = 'device_images'
  ) THEN
    ALTER TABLE repair_tickets ADD COLUMN device_images text[];
  END IF;
END $$;
