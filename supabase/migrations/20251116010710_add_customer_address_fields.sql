/*
  # Add Address Fields to Customers Table

  1. Changes to `customers` table
    - Add `title` (text) - Mr, Mrs, Ms, Dr, etc.
    - Add `street_address` (text)
    - Add `address_line_2` (text)
    - Add `city` (text)
    - Add `province` (text)
    - Add `postal_code` (text)
    - Add `country` (text)
    - Add `preferred_contact_method` (text)
    - Add `needs_collection` (boolean) - tracks if customer wants collection/delivery service

  2. Purpose
    - Store complete customer information from registration forms
    - Track customer preferences for communication and service
    - Enable better customer management and service delivery
*/

-- Add new fields to customers table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'title'
  ) THEN
    ALTER TABLE customers ADD COLUMN title text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'street_address'
  ) THEN
    ALTER TABLE customers ADD COLUMN street_address text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'address_line_2'
  ) THEN
    ALTER TABLE customers ADD COLUMN address_line_2 text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'city'
  ) THEN
    ALTER TABLE customers ADD COLUMN city text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'province'
  ) THEN
    ALTER TABLE customers ADD COLUMN province text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'postal_code'
  ) THEN
    ALTER TABLE customers ADD COLUMN postal_code text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'country'
  ) THEN
    ALTER TABLE customers ADD COLUMN country text DEFAULT 'South Africa';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'preferred_contact_method'
  ) THEN
    ALTER TABLE customers ADD COLUMN preferred_contact_method text DEFAULT 'email';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'needs_collection'
  ) THEN
    ALTER TABLE customers ADD COLUMN needs_collection boolean DEFAULT false;
  END IF;
END $$;