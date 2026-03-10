/*
  # Add Ticket Number Generator Function

  1. New Functions
    - `generate_next_ticket_number()` - Atomic function to generate next ticket number
      - Uses advisory locks to prevent race conditions
      - Returns the next available ticket number
  
  2. Security
    - Function is accessible to authenticated users
    - Uses database locks to ensure uniqueness
*/

-- Create function to generate next ticket number atomically
CREATE OR REPLACE FUNCTION generate_next_ticket_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_number INTEGER;
  next_ticket_number TEXT;
BEGIN
  -- Use advisory lock to prevent concurrent execution
  PERFORM pg_advisory_lock(1234567890);
  
  -- Get the highest ticket number
  SELECT COALESCE(
    MAX(CAST(SUBSTRING(ticket_number FROM 3) AS INTEGER)),
    999
  ) INTO next_number
  FROM repair_tickets
  WHERE ticket_number ~ '^TK[0-9]+$';
  
  -- Generate next ticket number
  next_ticket_number := 'TK' || (next_number + 1)::TEXT;
  
  -- Release the lock
  PERFORM pg_advisory_unlock(1234567890);
  
  RETURN next_ticket_number;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION generate_next_ticket_number() TO authenticated;
