/*
  # Add ticket number generation function

  1. New Functions
    - `generate_ticket_number()` - Generates unique ticket numbers in format TK-YYYYMMDD-XXX
  
  2. Security
    - Function is accessible to authenticated users
    - Uses current date and sequential numbering
*/

-- Function to generate unique ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
  today_date TEXT;
  ticket_count INTEGER;
  ticket_number TEXT;
BEGIN
  -- Get today's date in YYYYMMDD format
  today_date := to_char(CURRENT_DATE, 'YYYYMMDD');
  
  -- Count existing tickets created today
  SELECT COUNT(*) INTO ticket_count
  FROM repair_tickets
  WHERE DATE(created_at) = CURRENT_DATE;
  
  -- Generate ticket number: TK-YYYYMMDD-XXX
  ticket_number := 'TK-' || today_date || '-' || LPAD((ticket_count + 1)::TEXT, 3, '0');
  
  RETURN ticket_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;