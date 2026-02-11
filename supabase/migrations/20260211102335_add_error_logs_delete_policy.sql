/*
  # Add Delete Policy for Error Logs

  1. Changes
    - Add DELETE policy for admin users to delete error logs
    - Allows admins to clean up error logs as needed

  2. Security
    - Only users with 'admin' role can delete error logs
    - Checks user_metadata for role verification
*/

-- Admin users can delete error logs
CREATE POLICY "Admin users can delete error logs"
  ON error_logs
  FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );