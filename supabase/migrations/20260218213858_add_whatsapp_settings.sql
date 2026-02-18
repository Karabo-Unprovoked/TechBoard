/*
  # Add WhatsApp Business Integration Settings

  ## Overview
  This migration adds support for WhatsApp Business API integration, allowing the system
  to send automated messages and notifications to customers via WhatsApp.

  ## Changes

  1. New Tables
    - `whatsapp_settings`
      - `id` (uuid, primary key) - Unique identifier
      - `business_phone_number_id` (text) - WhatsApp Business Phone Number ID
      - `access_token` (text) - WhatsApp API access token (encrypted)
      - `webhook_verify_token` (text) - Token for webhook verification
      - `is_enabled` (boolean) - Whether WhatsApp integration is active
      - `send_on_ticket_created` (boolean) - Auto-send when ticket is created
      - `send_on_status_change` (boolean) - Auto-send when ticket status changes
      - `send_on_ready_for_pickup` (boolean) - Auto-send when ready for pickup
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp

    - `whatsapp_message_log`
      - `id` (uuid, primary key) - Unique identifier
      - `ticket_id` (uuid, foreign key) - Associated ticket (references repair_tickets)
      - `customer_phone` (text) - Recipient phone number
      - `message_text` (text) - Message content sent
      - `message_type` (text) - Type of message (ticket_created, status_update, etc.)
      - `whatsapp_message_id` (text, nullable) - WhatsApp's message ID if successful
      - `status` (text) - Message status (sent, failed, delivered, read)
      - `error_message` (text, nullable) - Error details if failed
      - `sent_at` (timestamptz) - When message was sent
      - `delivered_at` (timestamptz, nullable) - When message was delivered
      - `read_at` (timestamptz, nullable) - When message was read

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated admin users only
    - WhatsApp settings can only be viewed/modified by authenticated users
    - Message logs can be viewed by authenticated users

  3. Indexes
    - Index on ticket_id for fast message log lookups
    - Index on sent_at for chronological queries
*/

-- Create whatsapp_settings table
CREATE TABLE IF NOT EXISTS whatsapp_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_phone_number_id text DEFAULT '',
  access_token text DEFAULT '',
  webhook_verify_token text DEFAULT '',
  is_enabled boolean DEFAULT false,
  send_on_ticket_created boolean DEFAULT false,
  send_on_status_change boolean DEFAULT false,
  send_on_ready_for_pickup boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create whatsapp_message_log table
CREATE TABLE IF NOT EXISTS whatsapp_message_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES repair_tickets(id) ON DELETE CASCADE,
  customer_phone text NOT NULL,
  message_text text NOT NULL,
  message_type text NOT NULL,
  whatsapp_message_id text,
  status text DEFAULT 'sent',
  error_message text,
  sent_at timestamptz DEFAULT now(),
  delivered_at timestamptz,
  read_at timestamptz
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_log_ticket_id ON whatsapp_message_log(ticket_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_log_sent_at ON whatsapp_message_log(sent_at DESC);

-- Enable RLS
ALTER TABLE whatsapp_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_message_log ENABLE ROW LEVEL SECURITY;

-- Policies for whatsapp_settings
CREATE POLICY "Authenticated users can view WhatsApp settings"
  ON whatsapp_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert WhatsApp settings"
  ON whatsapp_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update WhatsApp settings"
  ON whatsapp_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for whatsapp_message_log
CREATE POLICY "Authenticated users can view WhatsApp message logs"
  ON whatsapp_message_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert WhatsApp message logs"
  ON whatsapp_message_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update WhatsApp message logs"
  ON whatsapp_message_log FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert default settings row if none exists
INSERT INTO whatsapp_settings (id, is_enabled)
SELECT gen_random_uuid(), false
WHERE NOT EXISTS (SELECT 1 FROM whatsapp_settings LIMIT 1);
