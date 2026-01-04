/*
  # Add Customer Declarations to Repair Tickets

  1. Changes to Tables
    - Add `customer_declarations` column to `repair_tickets` table
      - Stores customer's mandatory declarations and acknowledgments
      - JSONB format with boolean flags for each declaration
      - Required fields: legal_owner, diagnostics_nonrefundable, timeline_estimate, data_backup, terms_accepted

  2. Security
    - No RLS changes needed (inherits from existing policies)
*/

-- Add customer declarations column to repair_tickets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'repair_tickets' AND column_name = 'customer_declarations'
  ) THEN
    ALTER TABLE repair_tickets ADD COLUMN customer_declarations jsonb DEFAULT NULL;
  END IF;
END $$;