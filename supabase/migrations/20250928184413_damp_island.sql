/*
  # Create repair system tables

  1. New Tables
    - `customers`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text)
      - `phone` (text)
      - `created_at` (timestamp)
    - `repair_tickets`
      - `id` (uuid, primary key)
      - `ticket_number` (text, unique)
      - `customer_id` (uuid, foreign key)
      - `device_type` (text)
      - `brand` (text)
      - `model` (text)
      - `serial_number` (text)
      - `issue_description` (text)
      - `status` (text, default 'received')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  created_at timestamptz DEFAULT now()
);

-- Create repair_tickets table
CREATE TABLE IF NOT EXISTS repair_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  device_type text NOT NULL DEFAULT 'Laptop',
  brand text,
  model text,
  serial_number text,
  issue_description text,
  status text DEFAULT 'received',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_tickets ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can manage customers"
  ON customers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage repair tickets"
  ON repair_tickets
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create function to generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS text AS $$
DECLARE
  new_number text;
  counter int;
BEGIN
  -- Get the current date in YYYYMMDD format
  SELECT 'TK' || to_char(now(), 'YYYYMMDD') || '-' INTO new_number;
  
  -- Get the count of tickets created today
  SELECT COUNT(*) + 1 INTO counter
  FROM repair_tickets
  WHERE created_at::date = CURRENT_DATE;
  
  -- Pad with zeros to make it 3 digits
  new_number := new_number || LPAD(counter::text, 3, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;