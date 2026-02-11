/*
  # Add Error Logs Table

  1. New Tables
    - `error_logs`
      - `id` (uuid, primary key) - Unique identifier for the log entry
      - `error_type` (text) - Type of error (e.g., 'SMTP', 'Database', 'Validation')
      - `error_message` (text) - The error message
      - `error_details` (jsonb) - Additional error details (stack trace, context, etc.)
      - `user_email` (text, nullable) - Email of the user who encountered the error
      - `source` (text) - Where the error occurred (component/function name)
      - `created_at` (timestamptz) - When the error was logged

  2. Security
    - Enable RLS on `error_logs` table
    - Add policy for admin users to view all error logs
    - Add policy for authenticated users to insert error logs
    - No update or delete policies (logs are immutable)

  3. Indexes
    - Index on created_at for efficient querying of recent errors
    - Index on error_type for filtering by error type
*/

CREATE TABLE IF NOT EXISTS error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type text NOT NULL DEFAULT 'Unknown',
  error_message text NOT NULL,
  error_details jsonb DEFAULT '{}'::jsonb,
  user_email text,
  source text NOT NULL DEFAULT 'Unknown',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Admin users can view all error logs (check user_metadata for role)
CREATE POLICY "Admin users can view all error logs"
  ON error_logs
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Any authenticated user can insert error logs
CREATE POLICY "Authenticated users can insert error logs"
  ON error_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON error_logs(error_type);