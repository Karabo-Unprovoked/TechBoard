/*
  # Fix Ticket Statuses View Policy

  ## Changes
  
  Replace the authenticated users view policy for ticket_statuses that uses USING (true)
  with a proper authentication check.
*/

DROP POLICY IF EXISTS "Users can view ticket statuses" ON ticket_statuses;

CREATE POLICY "Authenticated users can view ticket statuses"
  ON ticket_statuses FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);
