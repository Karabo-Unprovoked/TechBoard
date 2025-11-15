/*
  # Update Customer Number Start Default

  1. Changes
    - Update default customer number starting point from 1000 to 100
    - Only updates if the value is still at the old default (1000)

  2. Important Notes
    - This preserves any custom values set by users
    - New format is CG100, CG101, etc.
*/

DO $$
BEGIN
  -- Only update if it's still at the old default value
  UPDATE admin_settings
  SET setting_value = '100'
  WHERE setting_key = 'customer_number_start'
  AND setting_value = '1000';
END $$;
