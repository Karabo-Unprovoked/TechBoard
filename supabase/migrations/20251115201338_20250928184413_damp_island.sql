/*
  # Create repair system tables

  1. New Tables
    - `customers`
      - `id` (uuid, primary key)
      - `customer_number` (text, unique)
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

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_number text UNIQUE,
  name text NOT NULL,
  email text,
  phone text,
  created_at timestamptz DEFAULT now()
);

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

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_tickets ENABLE ROW LEVEL SECURITY;

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