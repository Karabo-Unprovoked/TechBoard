/*
  # Add case-insensitive email index

  1. Changes
    - Add a case-insensitive index on the customers email column
    - This ensures email lookups are always case-insensitive
    - Improves performance for email-based queries

  2. Notes
    - Uses LOWER() function to create a functional index
    - This makes email searches case-insensitive and faster
*/

-- Create a case-insensitive index on email
CREATE INDEX IF NOT EXISTS customers_email_lower_idx ON customers (LOWER(email));
