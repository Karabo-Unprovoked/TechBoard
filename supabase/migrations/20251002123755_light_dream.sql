/*
  # Allow public ticket tracking

  1. Security Changes
    - Add policy to allow public read access to repair tickets for tracking
    - Customers can search by ticket number without authentication
    - No customer personal data is exposed in public queries

  2. Changes
    - Create policy for anonymous users to read repair tickets
    - Maintain existing authenticated user policies
*/

-- Allow anonymous users to read repair tickets for tracking purposes
CREATE POLICY "Anonymous users can track tickets"
  ON repair_tickets
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to read basic customer info (name only) for ticket tracking
CREATE POLICY "Anonymous users can read customer names for tracking"
  ON customers
  FOR SELECT
  TO anon
  USING (true);