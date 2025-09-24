-- Supabase Storage Setup
-- Run this SQL in your Supabase SQL Editor after creating the storage buckets

-- Create storage buckets (do this via Supabase Dashboard first):
-- 1. site-drawings (public: true, file size limit: 10MB, allowed types: image/*, application/pdf)
-- 2. blocker-photos (public: true, file size limit: 5MB, allowed types: image/*)

-- Storage Policies

-- Allow authenticated users to upload site drawings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('site-drawings', 'site-drawings', true, 10485760, ARRAY['image/*', 'application/pdf']),
  ('blocker-photos', 'blocker-photos', true, 5242880, ARRAY['image/*'])
ON CONFLICT (id) DO NOTHING;

-- Site drawings policies
CREATE POLICY "Allow authenticated uploads to site-drawings" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'site-drawings' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated access to site-drawings" ON storage.objects
FOR SELECT USING (bucket_id = 'site-drawings');

CREATE POLICY "Allow supervisors to delete site-drawings" ON storage.objects
FOR DELETE USING (
  bucket_id = 'site-drawings' AND
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role IN ('supervisor', 'admin')
  )
);

-- Blocker photos policies
CREATE POLICY "Allow authenticated uploads to blocker-photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'blocker-photos' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated access to blocker-photos" ON storage.objects
FOR SELECT USING (bucket_id = 'blocker-photos');

CREATE POLICY "Allow users to delete own blocker photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'blocker-photos' AND (
    auth.uid()::text = (string_to_array(name, '/'))[1] OR
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('supervisor', 'admin')
    )
  )
);