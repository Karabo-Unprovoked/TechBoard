/*
  # Create Device Images Storage Bucket

  1. New Storage Bucket
    - `device-images` - Public bucket for storing device photos from registration requests
  
  2. Security
    - Enable public access for reading images
    - Allow authenticated users to upload images
    - Allow authenticated users to delete their own uploads

  3. Notes
    - Images are uploaded during self-registration process
    - Public URLs are stored in registration_requests and repair_tickets tables
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('device-images', 'device-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read from the bucket (public images)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'device-images');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload device images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'device-images');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete device images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'device-images');
