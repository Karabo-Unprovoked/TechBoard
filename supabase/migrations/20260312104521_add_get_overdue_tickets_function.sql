/*
  # Add Get Overdue Tickets Function

  1. New Functions
    - `get_overdue_tickets()` - Returns all tickets that have exceeded their SLA
    
  2. Purpose
    - Efficiently identify tickets that are overdue
    - Calculate hours overdue for each ticket
    - Used by automated notification system

  3. Returns
    - Ticket details including id, ticket_number, status, customer info
    - SLA hours and actual hours elapsed
    - Hours overdue calculation
*/

-- Create function to get overdue tickets
CREATE OR REPLACE FUNCTION get_overdue_tickets()
RETURNS TABLE (
  id uuid,
  ticket_number text,
  status text,
  customer_name text,
  device_type text,
  sla_hours integer,
  status_changed_at timestamptz,
  hours_overdue numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rt.id,
    rt.ticket_number,
    rt.status,
    c.name as customer_name,
    rt.device_type,
    rt.sla_hours,
    rt.status_changed_at,
    ROUND(
      EXTRACT(EPOCH FROM (now() - rt.status_changed_at)) / 3600 - rt.sla_hours,
      1
    ) as hours_overdue
  FROM repair_tickets rt
  JOIN customers c ON rt.customer_id = c.id
  WHERE 
    rt.sla_hours IS NOT NULL
    AND rt.status NOT IN ('completed', 'void', 'unrepairable')
    AND EXTRACT(EPOCH FROM (now() - rt.status_changed_at)) / 3600 > rt.sla_hours
  ORDER BY hours_overdue DESC;
END;
$$;
