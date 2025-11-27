/*
  # Add Public Access to Customer-Visible Notes

  1. Changes
    - Add new RLS policy to allow public (non-authenticated) users to read customer-visible notes
    - This enables customers to see technician notes on the tracking page without logging in
  
  2. Security
    - Only SELECT permission granted
    - Only notes with note_type = 'customer' are accessible
    - Internal notes remain protected and require authentication
*/

-- Create policy for public read access to customer-visible notes
CREATE POLICY "Public users can view customer notes"
  ON ticket_notes
  FOR SELECT
  TO anon
  USING (note_type = 'customer');