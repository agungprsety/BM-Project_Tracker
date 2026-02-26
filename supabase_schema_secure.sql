-- =================================================================================
-- SIGIMARGA - PHASE 1: SECURITY HARDENING (Ownership & RLS)
-- Run this AFTER the initial schema has been applied.
-- This script is idempotent (safe to re-run).
-- =================================================================================

-- =================================================================================
-- 1. ADD OWNERSHIP COLUMN
-- =================================================================================

-- Add created_by column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'projects' AND column_name = 'created_by'
    ) THEN
        -- Add without NOT NULL first, then backfill, then add constraint
        ALTER TABLE projects ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Backfill: assign all existing projects to the first registered user
UPDATE projects
SET created_by = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1)
WHERE created_by IS NULL;

-- Now enforce NOT NULL + set default for future inserts
ALTER TABLE projects ALTER COLUMN created_by SET NOT NULL;
ALTER TABLE projects ALTER COLUMN created_by SET DEFAULT auth.uid();

-- Performance index for RLS lookups
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);

-- =================================================================================
-- 2. ENABLE RLS (idempotent)
-- =================================================================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE boq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- =================================================================================
-- 3. DROP ALL PREVIOUS POLICIES
-- =================================================================================

-- Old broad policies
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON projects;
DROP POLICY IF EXISTS "Enable insert access for all authenticated users" ON projects;
DROP POLICY IF EXISTS "Enable update access for all authenticated users" ON projects;
DROP POLICY IF EXISTS "Enable delete access for all authenticated users" ON projects;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON boq_items;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON weekly_reports;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON item_progress;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON photos;

-- Previous "secure" policies (v1)
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

-- New policies (v2) - drop if re-running this script
DROP POLICY IF EXISTS "projects_select_public" ON projects;
DROP POLICY IF EXISTS "projects_insert_owner" ON projects;
DROP POLICY IF EXISTS "projects_update_owner" ON projects;
DROP POLICY IF EXISTS "projects_delete_owner" ON projects;

DROP POLICY IF EXISTS "boq_select_public" ON boq_items;
DROP POLICY IF EXISTS "boq_insert_owner" ON boq_items;
DROP POLICY IF EXISTS "boq_update_owner" ON boq_items;
DROP POLICY IF EXISTS "boq_delete_owner" ON boq_items;

DROP POLICY IF EXISTS "reports_select_public" ON weekly_reports;
DROP POLICY IF EXISTS "reports_insert_owner" ON weekly_reports;
DROP POLICY IF EXISTS "reports_update_owner" ON weekly_reports;
DROP POLICY IF EXISTS "reports_delete_owner" ON weekly_reports;

DROP POLICY IF EXISTS "progress_select_public" ON item_progress;
DROP POLICY IF EXISTS "progress_insert_owner" ON item_progress;
DROP POLICY IF EXISTS "progress_update_owner" ON item_progress;
DROP POLICY IF EXISTS "progress_delete_owner" ON item_progress;

DROP POLICY IF EXISTS "photos_select_public" ON photos;
DROP POLICY IF EXISTS "photos_insert_owner" ON photos;
DROP POLICY IF EXISTS "photos_update_owner" ON photos;
DROP POLICY IF EXISTS "photos_delete_owner" ON photos;

-- =================================================================================
-- 4. CREATE OWNERSHIP-BASED RLS POLICIES
-- =================================================================================

-- ── PROJECTS ─────────────────────────────────────────────────────────────────────
-- Anyone (including anon) can read all projects
CREATE POLICY "projects_select_public"
  ON projects FOR SELECT
  TO public
  USING (true);

-- Only the owner can insert (created_by must equal the current user)
CREATE POLICY "projects_insert_owner"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Only the owner can update their own projects
CREATE POLICY "projects_update_owner"
  ON projects FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

-- Only the owner can delete their own projects
CREATE POLICY "projects_delete_owner"
  ON projects FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- ── BOQ_ITEMS (inherits from projects via EXISTS) ────────────────────────────────
CREATE POLICY "boq_select_public"
  ON boq_items FOR SELECT
  TO public
  USING (true);

CREATE POLICY "boq_insert_owner"
  ON boq_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = boq_items.project_id
        AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "boq_update_owner"
  ON boq_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = boq_items.project_id
        AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "boq_delete_owner"
  ON boq_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = boq_items.project_id
        AND projects.created_by = auth.uid()
    )
  );

-- ── WEEKLY_REPORTS (inherits from projects via EXISTS) ───────────────────────────
CREATE POLICY "reports_select_public"
  ON weekly_reports FOR SELECT
  TO public
  USING (true);

CREATE POLICY "reports_insert_owner"
  ON weekly_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = weekly_reports.project_id
        AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "reports_update_owner"
  ON weekly_reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = weekly_reports.project_id
        AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "reports_delete_owner"
  ON weekly_reports FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = weekly_reports.project_id
        AND projects.created_by = auth.uid()
    )
  );

-- ── ITEM_PROGRESS (chains: item_progress → weekly_reports → projects) ────────────
CREATE POLICY "progress_select_public"
  ON item_progress FOR SELECT
  TO public
  USING (true);

CREATE POLICY "progress_insert_owner"
  ON item_progress FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weekly_reports
      JOIN projects ON projects.id = weekly_reports.project_id
      WHERE weekly_reports.id = item_progress.weekly_report_id
        AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "progress_update_owner"
  ON item_progress FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weekly_reports
      JOIN projects ON projects.id = weekly_reports.project_id
      WHERE weekly_reports.id = item_progress.weekly_report_id
        AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "progress_delete_owner"
  ON item_progress FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weekly_reports
      JOIN projects ON projects.id = weekly_reports.project_id
      WHERE weekly_reports.id = item_progress.weekly_report_id
        AND projects.created_by = auth.uid()
    )
  );

-- ── PHOTOS (can belong to project OR weekly_report, check both paths) ────────────
CREATE POLICY "photos_select_public"
  ON photos FOR SELECT
  TO public
  USING (true);

CREATE POLICY "photos_insert_owner"
  ON photos FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Direct project photo
    (project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = photos.project_id
        AND projects.created_by = auth.uid()
    ))
    OR
    -- Weekly report photo (chain through weekly_reports → projects)
    (weekly_report_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM weekly_reports
      JOIN projects ON projects.id = weekly_reports.project_id
      WHERE weekly_reports.id = photos.weekly_report_id
        AND projects.created_by = auth.uid()
    ))
  );

CREATE POLICY "photos_update_owner"
  ON photos FOR UPDATE
  TO authenticated
  USING (
    (project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = photos.project_id
        AND projects.created_by = auth.uid()
    ))
    OR
    (weekly_report_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM weekly_reports
      JOIN projects ON projects.id = weekly_reports.project_id
      WHERE weekly_reports.id = photos.weekly_report_id
        AND projects.created_by = auth.uid()
    ))
  );

CREATE POLICY "photos_delete_owner"
  ON photos FOR DELETE
  TO authenticated
  USING (
    (project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = photos.project_id
        AND projects.created_by = auth.uid()
    ))
    OR
    (weekly_report_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM weekly_reports
      JOIN projects ON projects.id = weekly_reports.project_id
      WHERE weekly_reports.id = photos.weekly_report_id
        AND projects.created_by = auth.uid()
    ))
  );

-- =================================================================================
-- 5. STORAGE BUCKET — OWNERSHIP-BASED POLICIES
-- =================================================================================
-- Upload path convention: {project_id}/{uuid}.{ext}
-- We extract the project_id from the first path segment using storage.foldername()
-- and verify the user owns that project via an EXISTS subquery.

INSERT INTO storage.buckets (id, name, public)
VALUES ('project-photos', 'project-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if re-running
DROP POLICY IF EXISTS "Storage - Read Only for Public" ON storage.objects;
DROP POLICY IF EXISTS "Storage - Insert for Staff" ON storage.objects;
DROP POLICY IF EXISTS "Storage - Update for Staff" ON storage.objects;
DROP POLICY IF EXISTS "Storage - Delete for Staff" ON storage.objects;
DROP POLICY IF EXISTS "storage_select_public" ON storage.objects;
DROP POLICY IF EXISTS "storage_insert_owner" ON storage.objects;
DROP POLICY IF EXISTS "storage_update_owner" ON storage.objects;
DROP POLICY IF EXISTS "storage_delete_owner" ON storage.objects;

-- Anyone (including anon) can VIEW photos — bucket is public
CREATE POLICY "storage_select_public"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'project-photos');

-- Only the project owner can UPLOAD photos
CREATE POLICY "storage_insert_owner"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'project-photos'
    AND EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = (storage.foldername(name))[1]::uuid
        AND projects.created_by = auth.uid()
    )
  );

-- Only the project owner can UPDATE (replace) photos
CREATE POLICY "storage_update_owner"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'project-photos'
    AND EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = (storage.foldername(name))[1]::uuid
        AND projects.created_by = auth.uid()
    )
  );

-- Only the project owner can DELETE photos
CREATE POLICY "storage_delete_owner"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'project-photos'
    AND EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = (storage.foldername(name))[1]::uuid
        AND projects.created_by = auth.uid()
    )
  );

