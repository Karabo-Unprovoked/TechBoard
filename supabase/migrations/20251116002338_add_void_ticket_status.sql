/*
  # Add Void Status to Ticket System

  1. Changes
    - Add 'void' status to ticket_statuses table
    - This allows tickets to be voided/cancelled
    - Voided tickets are considered closed but not completed
  
  2. Security
    - No changes to RLS policies needed
    - Existing policies cover the new status
*/

INSERT INTO ticket_statuses (status_key, status_label, status_order, is_active)
VALUES ('void', 'Void', 10, true)
ON CONFLICT (status_key) DO NOTHING;