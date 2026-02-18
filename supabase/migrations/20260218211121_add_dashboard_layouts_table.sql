/*
  # Dashboard Layouts Table

  1. New Tables
    - `dashboard_layouts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `layout_config` (jsonb) - stores widget positions and sizes
      - `visible_widgets` (text[]) - array of visible widget IDs
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `dashboard_layouts` table
    - Add policy for authenticated users to manage their own layouts
  
  3. Notes
    - Each user can have their own customized dashboard layout
    - Layout config stores positions in react-grid-layout format
    - Visible widgets array controls which widgets are shown/hidden
*/

CREATE TABLE IF NOT EXISTS dashboard_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  layout_config jsonb NOT NULL DEFAULT '[]'::jsonb,
  visible_widgets text[] NOT NULL DEFAULT ARRAY['stats', 'quick-actions', 'recent-tickets', 'revenue-chart', 'status-overview']::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE dashboard_layouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dashboard layout"
  ON dashboard_layouts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dashboard layout"
  ON dashboard_layouts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dashboard layout"
  ON dashboard_layouts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own dashboard layout"
  ON dashboard_layouts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_user_id ON dashboard_layouts(user_id);