/*
  # Add ticket number generation function

  1. New Functions
    - `generate_ticket_number()` - Generates unique ticket numbers in format TK20250115-001
  
  2. Security
    - Function is accessible to authenticated users
*/

CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
  today_date TEXT;
  sequence_num INTEGER;
  ticket_number TEXT;
BEGIN
  -- Get today's date in YYYYMMDD format
  today_date := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
  
  -- Get the next sequence number for today
  SELECT COALESCE(MAX(
    CAST(
      SUBSTRING(ticket_number FROM LENGTH(today_date) + 4)
      AS INTEGER
    )
  ), 0) + 1
  INTO sequence_num
  FROM repair_tickets
  WHERE ticket_number LIKE 'TK' || today_date || '-%';
  
  -- Format the ticket number
  ticket_number := 'TK' || today_date || '-' || LPAD(sequence_num::TEXT, 3, '0');
  
  RETURN ticket_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;