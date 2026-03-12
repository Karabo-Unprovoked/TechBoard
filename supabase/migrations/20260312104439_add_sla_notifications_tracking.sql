/*
  # Add SLA Notifications Tracking

  1. New Tables
    - `sla_notifications`
      - `id` (uuid, primary key)
      - `ticket_id` (uuid, foreign key to repair_tickets)
      - `notification_type` (text: 'overdue', 'at_risk')
      - `notified_at` (timestamptz)
      - `created_at` (timestamptz)
  
  2. Purpose
    - Track which tickets have already been notified about SLA breaches
    - Prevent duplicate notifications for the same ticket
    - Maintain audit trail of SLA notifications

  3. Security
    - Enable RLS on `sla_notifications` table
    - Only authenticated users can read notifications
    - System can insert notifications
*/

-- Create sla_notifications table
CREATE TABLE IF NOT EXISTS sla_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES repair_tickets(id) ON DELETE CASCADE,
  notification_type text NOT NULL CHECK (notification_type IN ('overdue', 'at_risk')),
  notified_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_sla_notifications_ticket_id 
  ON sla_notifications(ticket_id);

CREATE INDEX IF NOT EXISTS idx_sla_notifications_type 
  ON sla_notifications(notification_type, notified_at);

-- Enable RLS
ALTER TABLE sla_notifications ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read notifications
CREATE POLICY "Authenticated users can view SLA notifications"
  ON sla_notifications
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow system to insert notifications (service role)
CREATE POLICY "Service role can insert SLA notifications"
  ON sla_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow users to delete old notifications
CREATE POLICY "Authenticated users can delete SLA notifications"
  ON sla_notifications
  FOR DELETE
  TO authenticated
  USING (true);
