-- SQL query to create the bucket and apply public RLS policies
-- Run this in your Supabase SQL Editor

-- 1. Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-photos', 'project-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public access to view files
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'project-photos' );

-- 3. Allow authenticated access to upload files (or public depending on the auth setup)
-- Since the app uses anon keys for upload right now without proper users, we need a public insert policy for the scope of this project.
CREATE POLICY "Public Uploads"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'project-photos' );

-- 3b. Allow public to update files (REQUIRED for upload completion — Supabase uses multipart uploads internally)
CREATE POLICY "Public Updates"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'project-photos' );

-- 4. Allow public to delete files (required if deleting photos)
CREATE POLICY "Public Deletes"
ON storage.objects FOR DELETE
USING ( bucket_id = 'project-photos' );
