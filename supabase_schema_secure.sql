-- =================================================================================
-- SIGIMARGA - PRODUCTION RLS & STORAGE SECURITY
-- Run this AFTER the initial schema has been applied.
-- This script is idempotent (safe to re-run).
-- =================================================================================

-- 1. Enable RLS on all tables (idempotent)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE boq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- 2. Drop previous insecure/conflicting policies
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON projects;
DROP POLICY IF EXISTS "Enable insert access for all authenticated users" ON projects;
DROP POLICY IF EXISTS "Enable update access for all authenticated users" ON projects;
DROP POLICY IF EXISTS "Enable delete access for all authenticated users" ON projects;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON boq_items;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON weekly_reports;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON item_progress;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON photos;

-- Also drop the new policies if re-running this script
DROP POLICY IF EXISTS "Projects - Read Only for Public" ON projects;
DROP POLICY IF EXISTS "Projects - Insert for Staff" ON projects;
DROP POLICY IF EXISTS "Projects - Update for Staff" ON projects;
DROP POLICY IF EXISTS "Projects - Delete for Staff" ON projects;

DROP POLICY IF EXISTS "BoQ - Read Only for Public" ON boq_items;
DROP POLICY IF EXISTS "BoQ - Insert for Staff" ON boq_items;
DROP POLICY IF EXISTS "BoQ - Update for Staff" ON boq_items;
DROP POLICY IF EXISTS "BoQ - Delete for Staff" ON boq_items;

DROP POLICY IF EXISTS "Reports - Read Only for Public" ON weekly_reports;
DROP POLICY IF EXISTS "Reports - Insert for Staff" ON weekly_reports;
DROP POLICY IF EXISTS "Reports - Update for Staff" ON weekly_reports;
DROP POLICY IF EXISTS "Reports - Delete for Staff" ON weekly_reports;

DROP POLICY IF EXISTS "Progress - Read Only for Public" ON item_progress;
DROP POLICY IF EXISTS "Progress - Insert for Staff" ON item_progress;
DROP POLICY IF EXISTS "Progress - Update for Staff" ON item_progress;
DROP POLICY IF EXISTS "Progress - Delete for Staff" ON item_progress;

DROP POLICY IF EXISTS "Photos - Read Only for Public" ON photos;
DROP POLICY IF EXISTS "Photos - Insert for Staff" ON photos;
DROP POLICY IF EXISTS "Photos - Update for Staff" ON photos;
DROP POLICY IF EXISTS "Photos - Delete for Staff" ON photos;

-- =================================================================================
-- 3. Create Secure RLS Policies
-- =================================================================================

-- PROJECTS
CREATE POLICY "Projects - Read Only for Public" ON projects FOR SELECT TO public USING (true);
CREATE POLICY "Projects - Insert for Staff" ON projects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Projects - Update for Staff" ON projects FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Projects - Delete for Staff" ON projects FOR DELETE TO authenticated USING (true);

-- BOQ ITEMS
CREATE POLICY "BoQ - Read Only for Public" ON boq_items FOR SELECT TO public USING (true);
CREATE POLICY "BoQ - Insert for Staff" ON boq_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "BoQ - Update for Staff" ON boq_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "BoQ - Delete for Staff" ON boq_items FOR DELETE TO authenticated USING (true);

-- WEEKLY REPORTS
CREATE POLICY "Reports - Read Only for Public" ON weekly_reports FOR SELECT TO public USING (true);
CREATE POLICY "Reports - Insert for Staff" ON weekly_reports FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Reports - Update for Staff" ON weekly_reports FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Reports - Delete for Staff" ON weekly_reports FOR DELETE TO authenticated USING (true);

-- ITEM PROGRESS
CREATE POLICY "Progress - Read Only for Public" ON item_progress FOR SELECT TO public USING (true);
CREATE POLICY "Progress - Insert for Staff" ON item_progress FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Progress - Update for Staff" ON item_progress FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Progress - Delete for Staff" ON item_progress FOR DELETE TO authenticated USING (true);

-- PHOTOS
CREATE POLICY "Photos - Read Only for Public" ON photos FOR SELECT TO public USING (true);
CREATE POLICY "Photos - Insert for Staff" ON photos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Photos - Update for Staff" ON photos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Photos - Delete for Staff" ON photos FOR DELETE TO authenticated USING (true);

-- =================================================================================
-- 4. Storage Bucket for Photos
-- =================================================================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-photos', 'project-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if re-running
DROP POLICY IF EXISTS "Storage - Read Only for Public" ON storage.objects;
DROP POLICY IF EXISTS "Storage - Insert for Staff" ON storage.objects;
DROP POLICY IF EXISTS "Storage - Update for Staff" ON storage.objects;
DROP POLICY IF EXISTS "Storage - Delete for Staff" ON storage.objects;

-- Anyone can view photos (public bucket)
CREATE POLICY "Storage - Read Only for Public" 
ON storage.objects FOR SELECT TO public 
USING (bucket_id = 'project-photos');

-- Only logged-in users can upload
CREATE POLICY "Storage - Insert for Staff" 
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'project-photos');

-- Only logged-in users can update
CREATE POLICY "Storage - Update for Staff" 
ON storage.objects FOR UPDATE TO authenticated 
USING (bucket_id = 'project-photos');

-- Only logged-in users can delete
CREATE POLICY "Storage - Delete for Staff" 
ON storage.objects FOR DELETE TO authenticated 
USING (bucket_id = 'project-photos');
