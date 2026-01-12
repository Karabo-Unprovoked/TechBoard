/*
  # Fix Remaining RLS Policies with 'true' Clauses

  ## Changes
  
  Fix authenticated SELECT policies that still use USING (true):
  - admin_settings read policy
  - deleted_customers read policy
  - email_settings view policy
  - registration_requests view policy
  - ticket_sub_statuses read policy
  
  Note: Public/anonymous policies intentionally left with true for:
  - customers (anonymous tracking)
  - repair_tickets (anonymous tracking)
  - ticket_statuses (public viewing)
  - registration_requests (public submissions)
*/

-- Fix admin_settings SELECT policy
DROP POLICY IF EXISTS "Authenticated users can read admin settings" ON admin_settings;

CREATE POLICY "Authenticated users can read admin settings"
  ON admin_settings FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Fix deleted_customers SELECT policy
DROP POLICY IF EXISTS "Authenticated users can read deleted customers" ON deleted_customers;

CREATE POLICY "Authenticated users can read deleted customers"
  ON deleted_customers FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Fix email_settings SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view email settings" ON email_settings;

CREATE POLICY "Authenticated users can view email settings"
  ON email_settings FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Fix registration_requests SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view registration requests" ON registration_requests;

CREATE POLICY "Authenticated users can view registration requests"
  ON registration_requests FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Fix ticket_sub_statuses SELECT policy
DROP POLICY IF EXISTS "Authenticated users can read sub-statuses" ON ticket_sub_statuses;

CREATE POLICY "Authenticated users can read sub-statuses"
  ON ticket_sub_statuses FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);
