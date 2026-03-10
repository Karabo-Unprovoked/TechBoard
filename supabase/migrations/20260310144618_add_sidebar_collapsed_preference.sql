/*
  # Add Sidebar Collapsed Preference

  1. Changes
    - Add `sidebar_collapsed` column to `user_preferences` table
    - This stores whether the user prefers the sidebar collapsed or expanded
    - Defaults to false (expanded)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'sidebar_collapsed'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN sidebar_collapsed boolean DEFAULT false NOT NULL;
  END IF;
END $$;