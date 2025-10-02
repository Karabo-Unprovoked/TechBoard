/*
  # Add Deleted Customers Recycle Bin

  1. New Tables
    - `deleted_customers`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, original customer ID)
      - `customer_number` (text, customer number)
      - `first_name` (text)
      - `last_name` (text)
      - `name` (text)
      - `email` (text)
      - `phone` (text)
      - `gender` (text)
      - `referral_source` (text)
      - `original_created_at` (timestamptz, when customer was originally created)
      - `deleted_at` (timestamptz, when customer was deleted)
      - `deleted_by` (uuid, user who deleted)
      - `tickets_data` (jsonb, stored ticket information)
      - `auto_delete_at` (timestamptz, when to permanently delete - 30 days)

  2. Security
    - Enable RLS on `deleted_customers` table
    - Add policy for authenticated users to read deleted customers
    - Add policy for authenticated users to insert deleted customers
    - Add policy for authenticated users to delete (restore) deleted customers

  3. Important Notes
    - Tickets are stored as JSON when customer is deleted
    - After 30 days, records can be automatically purged
    - Restoration will recreate customer and their completed tickets
*/

CREATE TABLE IF NOT EXISTS deleted_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  customer_number text NOT NULL,
  first_name text DEFAULT '',
  last_name text DEFAULT '',
  name text NOT NULL,
  email text,
  phone text,
  gender text,
  referral_source text,
  original_created_at timestamptz NOT NULL,
  deleted_at timestamptz DEFAULT now(),
  deleted_by uuid REFERENCES auth.users(id),
  tickets_data jsonb DEFAULT '[]'::jsonb,
  auto_delete_at timestamptz DEFAULT (now() + interval '30 days')
);

ALTER TABLE deleted_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read deleted customers"
  ON deleted_customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert deleted customers"
  ON deleted_customers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete from recycle bin"
  ON deleted_customers FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_deleted_customers_auto_delete 
  ON deleted_customers(auto_delete_at);

CREATE INDEX IF NOT EXISTS idx_deleted_customers_customer_id 
  ON deleted_customers(customer_id);
