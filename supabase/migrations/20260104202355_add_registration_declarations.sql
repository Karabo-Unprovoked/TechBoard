/*
  # Add Customer Declarations to Registration Requests

  1. Changes to Tables
    - Add `customer_declarations` column to `registration_requests` table
      - Stores customer's mandatory declarations and acknowledgments
      - JSONB format with boolean flags for each declaration
      - Required fields: legal_owner, diagnostics_nonrefundable, timeline_estimate, data_backup, terms_accepted

  2. Security
    - No RLS changes needed (inherits from existing policies)
*/

-- Add customer declarations column to registration_requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'registration_requests' AND column_name = 'customer_declarations'
  ) THEN
    ALTER TABLE registration_requests ADD COLUMN customer_declarations jsonb DEFAULT NULL;
  END IF;
END $$;