/*
  # Add Dashboard Layout Preference

  1. Changes
    - Add `dashboard_layout` column to `user_preferences` table
    - Column stores the order and arrangement of dashboard blocks as JSONB
    - Allows users to customize their dashboard layout through drag-and-drop

  2. Security
    - No policy changes needed (existing RLS policies cover this column)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'dashboard_layout'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN dashboard_layout jsonb DEFAULT NULL;
  END IF;
END $$;