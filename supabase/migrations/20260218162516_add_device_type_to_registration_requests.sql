/*
  # Add device_type column to registration_requests

  1. Changes
    - Add `device_type` column to `registration_requests` table to track what type of device is being registered (Laptop, Desktop, Tablet, Phone, Other)
    
  2. Notes
    - Column is nullable to not break existing records
    - Default value is not set to preserve data integrity
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'registration_requests' AND column_name = 'device_type'
  ) THEN
    ALTER TABLE registration_requests ADD COLUMN device_type text;
  END IF;
END $$;
