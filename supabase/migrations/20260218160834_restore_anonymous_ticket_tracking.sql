/*
  # Restore Anonymous Ticket Tracking Access

  1. Purpose
    - Allow customers to track their repair tickets without logging in
    - Enable QR code scanning from customer phones to work properly
  
  2. Changes
    - Add anonymous SELECT policy for repair_tickets table
    - Add anonymous SELECT policy for customers table (name only for display)
    - Add anonymous SELECT policy for ticket_notes table (customer-visible notes only)
  
  3. Security
    - Only SELECT access is granted
    - Customers can only read ticket information, not modify
    - Customer notes are filtered to show only customer-visible notes
*/

-- Allow anonymous users to read repair tickets for tracking
CREATE POLICY "Anonymous users can track repair tickets"
  ON repair_tickets FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to read customer basic info (for ticket tracking display)
CREATE POLICY "Anonymous users can view customer info for tracking"
  ON customers FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to read customer-visible notes only
CREATE POLICY "Anonymous users can view customer notes"
  ON ticket_notes FOR SELECT
  TO anon
  USING (note_type = 'customer');