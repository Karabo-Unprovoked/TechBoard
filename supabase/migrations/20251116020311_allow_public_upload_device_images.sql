/*
  # Allow Public Uploads to Device Images Bucket

  1. Changes
    - Allow anonymous users to upload device images during self-registration
    - Keep existing policies for authenticated users
  
  2. Security
    - Public can read (already enabled via bucket.public = true)
    - Public can upload (needed for self-registration)
    - Authenticated users can delete their uploads
*/

-- Drop the old authenticated-only upload policy
DROP POLICY IF EXISTS "Authenticated users can upload device images" ON storage.objects;

-- Create new policy that allows both authenticated and anonymous uploads
CREATE POLICY "Allow uploads to device images"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'device-images');
