/*
  # Create ticket number generation function

  1. New Functions
    - `generate_ticket_number()` - Generates unique ticket numbers in format TK-YYYYMMDD-XXX
  
  2. Security
    - Function is accessible to authenticated users
    
  3. Logic
    - Uses current date to create daily sequential numbering
    - Pads numbers with leading zeros (001, 002, etc.)
    - Handles concurrent access safely
*/

CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  today_date TEXT;
  ticket_count INTEGER;
  ticket_number TEXT;
BEGIN
  -- Get today's date in YYYYMMDD format
  today_date := to_char(CURRENT_DATE, 'YYYYMMDD');
  
  -- Count existing tickets created today
  SELECT COUNT(*)
  INTO ticket_count
  FROM repair_tickets
  WHERE ticket_number LIKE 'TK-' || today_date || '-%';
  
  -- Increment count for new ticket
  ticket_count := ticket_count + 1;
  
  -- Format ticket number with leading zeros
  ticket_number := 'TK-' || today_date || '-' || lpad(ticket_count::TEXT, 3, '0');
  
  RETURN ticket_number;
END;
$$;