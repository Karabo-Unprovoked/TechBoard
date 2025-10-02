/*
  # Add Device Accessories Column

  1. Changes
    - Add `device_accessories` column to `repair_tickets` table to store accessories that came with the device
    - Column type is text array to store multiple accessory names
    - Default value is empty array
  
  2. Purpose
    - Track what accessories (bag, charger, battery, RAM, SSD, etc.) came with the device
    - Helps prevent disputes about missing items
    - Provides clear record of device condition at intake
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'repair_tickets' AND column_name = 'device_accessories'
  ) THEN
    ALTER TABLE repair_tickets ADD COLUMN device_accessories text[] DEFAULT '{}';
  END IF;
END $$;