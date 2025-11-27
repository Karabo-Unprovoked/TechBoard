/*
  # Add Delete Policy for Registration Requests

  1. Changes
    - Add DELETE policy for authenticated users to delete registration requests
  
  2. Security
    - Only authenticated users can delete registration requests
    - This allows admins to clear approved/declined lists
*/

-- Allow authenticated users to delete registration requests
CREATE POLICY "Authenticated users can delete registration requests"
  ON registration_requests
  FOR DELETE
  TO authenticated
  USING (true);
