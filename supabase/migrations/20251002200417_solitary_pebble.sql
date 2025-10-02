/*
  # Add customer numbers and improve customer management

  1. Schema Changes
    - Add `customer_number` column to customers table
    - Make customer_number unique and required
    - Update existing customers with generated numbers

  2. Security
    - Maintain existing RLS policies
    - Ensure customer numbers are properly indexed
*/

-- Add customer_number column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'customer_number'
  ) THEN
    ALTER TABLE customers ADD COLUMN customer_number text;
  END IF;
END $$;

-- Generate customer numbers for existing customers
DO $$
DECLARE
  customer_record RECORD;
  counter INTEGER := 1;
BEGIN
  FOR customer_record IN 
    SELECT id FROM customers WHERE customer_number IS NULL ORDER BY created_at
  LOOP
    UPDATE customers 
    SET customer_number = 'CG' || LPAD(counter::text, 3, '0')
    WHERE id = customer_record.id;
    counter := counter + 1;
  END LOOP;
END $$;

-- Make customer_number required and unique
ALTER TABLE customers ALTER COLUMN customer_number SET NOT NULL;

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'customers' AND constraint_name = 'customers_customer_number_key'
  ) THEN
    ALTER TABLE customers ADD CONSTRAINT customers_customer_number_key UNIQUE (customer_number);
  END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS customers_customer_number_idx ON customers(customer_number);