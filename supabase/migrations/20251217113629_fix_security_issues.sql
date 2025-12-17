/*
  # Fix Security and Performance Issues

  1. Add Missing Foreign Key Indexes
    - Add index on `deleted_customers.deleted_by`
    - Add index on `email_settings.updated_by`
    - Add index on `registration_requests.reviewed_by`
    - Add index on `repair_tickets.customer_id`
    - Add index on `ticket_attachments.ticket_id`
    - Add index on `ticket_emails.ticket_id`
    - Add index on `ticket_notes.ticket_id`

  2. Remove Unused Indexes
    - Drop `idx_deleted_customers_auto_delete`
    - Drop `idx_deleted_customers_customer_id`
    - Drop `idx_admin_settings_key`
    - Drop `idx_ticket_sub_statuses_parent`
    - Drop `idx_registration_requests_created_at`
    - Drop `customers_email_lower_idx`

  3. Security Fixes
    - Fix function `generate_ticket_number` to have immutable search_path
*/

-- Add missing foreign key indexes for performance
CREATE INDEX IF NOT EXISTS idx_deleted_customers_deleted_by ON deleted_customers(deleted_by);
CREATE INDEX IF NOT EXISTS idx_email_settings_updated_by ON email_settings(updated_by);
CREATE INDEX IF NOT EXISTS idx_registration_requests_reviewed_by ON registration_requests(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_repair_tickets_customer_id ON repair_tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket_id ON ticket_attachments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_emails_ticket_id ON ticket_emails(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_notes_ticket_id ON ticket_notes(ticket_id);

-- Drop unused indexes to reduce maintenance overhead
DROP INDEX IF EXISTS idx_deleted_customers_auto_delete;
DROP INDEX IF EXISTS idx_deleted_customers_customer_id;
DROP INDEX IF EXISTS idx_admin_settings_key;
DROP INDEX IF EXISTS idx_ticket_sub_statuses_parent;
DROP INDEX IF EXISTS idx_registration_requests_created_at;
DROP INDEX IF EXISTS customers_email_lower_idx;

-- Fix function search_path security issue
-- First, let's recreate the function with a secure search_path
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  -- Get the current counter from admin_settings
  SELECT COALESCE((value::integer), 0) INTO counter
  FROM admin_settings
  WHERE key = 'ticket_counter';
  
  -- Increment the counter
  counter := counter + 1;
  
  -- Update the counter in admin_settings
  INSERT INTO admin_settings (key, value)
  VALUES ('ticket_counter', counter::text)
  ON CONFLICT (key) 
  DO UPDATE SET value = counter::text;
  
  -- Format the ticket number (e.g., T-00001)
  new_number := 'T-' || LPAD(counter::text, 5, '0');
  
  RETURN new_number;
END;
$$;