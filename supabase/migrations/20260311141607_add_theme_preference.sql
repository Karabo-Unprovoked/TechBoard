/*
  # Add Theme Preference

  1. Changes
    - Add `theme` column to `user_preferences` table
    - This stores the user's preferred theme (light or dark)
    - Defaults to 'light'
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'theme'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN theme text DEFAULT 'light' NOT NULL;
  END IF;
END $$;
