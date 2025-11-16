/*
  # Add Customer Number Start Setting

  1. Changes
    - Add new admin setting for customer number starting point
    - Default value is 1000 for customer numbering

  2. Important Notes
    - This setting controls where customer numbers should start
    - Format: CUS-{number}, where {number} starts at this value
    - Can be changed by admins in System Settings
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admin_settings WHERE setting_key = 'customer_number_start') THEN
    INSERT INTO admin_settings (setting_key, setting_value)
    VALUES ('customer_number_start', '1000');
  END IF;
END $$;
