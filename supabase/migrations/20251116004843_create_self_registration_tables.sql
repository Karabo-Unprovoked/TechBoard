/*
  # Create Self-Registration System

  1. New Tables
    - `registration_requests`
      - `id` (uuid, primary key)
      - `title` (text) - Mr, Mrs, Ms, Dr, etc.
      - `first_name` (text)
      - `last_name` (text)
      - `phone_number` (text)
      - `email` (text)
      - `preferred_contact_method` (text) - email, phone, whatsapp
      - `referral_source` (text) - where they heard about us
      - `needs_collection` (boolean) - collection and delivery service
      - `street_address` (text)
      - `address_line_2` (text)
      - `city` (text)
      - `province` (text)
      - `postal_code` (text)
      - `country` (text, default 'South Africa')
      - `laptop_brand` (text)
      - `laptop_model` (text)
      - `laptop_problem` (text)
      - `serial_number` (text)
      - `device_includes` (text[]) - accessories included
      - `additional_notes` (text)
      - `device_images` (text[]) - array of image URLs
      - `status` (text) - pending, approved, declined
      - `reviewed_by` (uuid) - user who reviewed
      - `reviewed_at` (timestamptz)
      - `decline_reason` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `registration_requests` table
    - Allow anonymous users to insert (for self-registration)
    - Allow authenticated users to read and update (for admin approval)
*/

-- Create registration_requests table
CREATE TABLE IF NOT EXISTS registration_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone_number text NOT NULL,
  email text,
  preferred_contact_method text DEFAULT 'email',
  referral_source text,
  needs_collection boolean DEFAULT false,
  street_address text,
  address_line_2 text,
  city text,
  province text,
  postal_code text,
  country text DEFAULT 'South Africa',
  laptop_brand text,
  laptop_model text,
  laptop_problem text NOT NULL,
  serial_number text,
  device_includes text[],
  additional_notes text,
  device_images text[],
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  decline_reason text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE registration_requests ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert registration requests
CREATE POLICY "Anyone can submit registration request"
  ON registration_requests
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users to read all registration requests
CREATE POLICY "Authenticated users can view registration requests"
  ON registration_requests
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to update registration requests
CREATE POLICY "Authenticated users can update registration requests"
  ON registration_requests
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_registration_requests_status ON registration_requests(status);
CREATE INDEX IF NOT EXISTS idx_registration_requests_created_at ON registration_requests(created_at DESC);