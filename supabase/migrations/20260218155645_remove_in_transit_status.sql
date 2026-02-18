/*
  # Remove in-transit status and use pending instead

  1. Changes
    - Update all tickets with 'in-transit' status to 'pending'
    - Delete the 'in-transit' status from ticket_statuses table
    - Add 'pending' status if it doesn't exist
  
  2. Notes
    - This migration ensures consistency by removing the unused 'in-transit' status
    - All existing tickets are preserved with updated status
*/

-- First, ensure 'pending' status exists
INSERT INTO ticket_statuses (status_key, status_label, status_order, is_active)
VALUES ('pending', 'Pending', 0, true)
ON CONFLICT (status_key) DO UPDATE SET
  status_label = 'Pending',
  status_order = 0,
  is_active = true;

-- Update all tickets that have 'in-transit' status to 'pending'
UPDATE repair_tickets 
SET status = 'pending' 
WHERE status = 'in-transit';

-- Delete the 'in-transit' status from the statuses table
DELETE FROM ticket_statuses 
WHERE status_key = 'in-transit';

-- Update status order for remaining statuses
UPDATE ticket_statuses SET status_order = 1 WHERE status_key = 'received';
UPDATE ticket_statuses SET status_order = 2 WHERE status_key = 'in-progress';
UPDATE ticket_statuses SET status_order = 3 WHERE status_key = 'invoiced';
UPDATE ticket_statuses SET status_order = 4 WHERE status_key = 'completed';
UPDATE ticket_statuses SET status_order = 5 WHERE status_key = 'unrepairable';
UPDATE ticket_statuses SET status_order = 6 WHERE status_key = 'pending-customer-action';
UPDATE ticket_statuses SET status_order = 7 WHERE status_key = 'void';
