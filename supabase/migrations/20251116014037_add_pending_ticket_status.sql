/*
  # Add Pending Ticket Status

  1. Changes
    - Add 'pending' status to ticket_statuses table
    - Set it as the first status (status_order = 0)
    - Shift other statuses order by 1

  2. Notes
    - This status represents tickets that are newly created and awaiting initial review
    - Useful for tickets created from registration requests
*/

-- Update existing status orders to make room for pending
UPDATE ticket_statuses 
SET status_order = status_order + 1 
WHERE status_order >= 0;

-- Insert pending status
INSERT INTO ticket_statuses (status_key, status_label, status_order, is_active)
VALUES ('pending', 'Pending', 0, true)
ON CONFLICT (status_key) DO NOTHING;
