-- =================================================================================
-- SIGIMARGA - PHASE 3: ATOMIC SYNC RPC
-- Run this AFTER Phase 1 & 2 have been applied.
-- This script is idempotent (safe to re-run).
-- =================================================================================

-- Drop if re-running
DROP FUNCTION IF EXISTS sync_project_complete(JSONB, JSONB, JSONB, JSONB);

-- =================================================================================
-- sync_project_complete
--
-- Atomically upserts a project and fully replaces its relational data
-- (boq_items, weekly_reports, item_progress, photos) in one transaction.
--
-- Uses SECURITY DEFINER to bypass per-row RLS overhead during bulk operations,
-- but enforces ownership manually at the start of the function.
-- =================================================================================

CREATE OR REPLACE FUNCTION sync_project_complete(
  p_project     JSONB,   -- project scalar fields (snake_case keys)
  p_boq_items   JSONB DEFAULT '[]'::jsonb,  -- array of boq items
  p_weekly_reports JSONB DEFAULT '[]'::jsonb, -- array of weekly reports (with nested item_progress)
  p_photos      JSONB DEFAULT '[]'::jsonb   -- array of ALL photos (project-level + report-level)
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id  UUID;
  v_user_id     UUID;
  v_existing_owner UUID;
  v_report      JSONB;
BEGIN
  v_project_id := (p_project->>'id')::uuid;
  v_user_id    := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- ── Ownership check ────────────────────────────────────────────────────────
  -- If the project already exists, verify the caller owns it.
  SELECT created_by INTO v_existing_owner FROM projects WHERE id = v_project_id;

  IF v_existing_owner IS NOT NULL AND v_existing_owner != v_user_id THEN
    RAISE EXCEPTION 'Permission denied: you do not own this project.';
  END IF;

  -- ── 1. Upsert project scalar fields ────────────────────────────────────────
  INSERT INTO projects (
    id, name, contractor, supervisor, contract_price,
    work_type, road_hierarchy, maintenance_type,
    start_date, end_date, length, average_width,
    location_lat, location_lng, district, sub_district,
    created_by
  ) VALUES (
    v_project_id,
    p_project->>'name',
    p_project->>'contractor',
    p_project->>'supervisor',
    COALESCE((p_project->>'contract_price')::numeric, 0),
    (p_project->>'work_type')::work_type,
    (p_project->>'road_hierarchy')::road_hierarchy,
    (p_project->>'maintenance_type')::maintenance_type,
    (p_project->>'start_date')::date,
    (p_project->>'end_date')::date,
    COALESCE((p_project->>'length')::numeric, 0),
    COALESCE((p_project->>'average_width')::numeric, 0),
    (p_project->>'location_lat')::numeric,
    (p_project->>'location_lng')::numeric,
    COALESCE(p_project->>'district', ''),
    COALESCE(p_project->>'sub_district', ''),
    v_user_id
  )
  ON CONFLICT (id) DO UPDATE SET
    name             = EXCLUDED.name,
    contractor       = EXCLUDED.contractor,
    supervisor       = EXCLUDED.supervisor,
    contract_price   = EXCLUDED.contract_price,
    work_type        = EXCLUDED.work_type,
    road_hierarchy   = EXCLUDED.road_hierarchy,
    maintenance_type = EXCLUDED.maintenance_type,
    start_date       = EXCLUDED.start_date,
    end_date         = EXCLUDED.end_date,
    length           = EXCLUDED.length,
    average_width    = EXCLUDED.average_width,
    location_lat     = EXCLUDED.location_lat,
    location_lng     = EXCLUDED.location_lng,
    district         = EXCLUDED.district,
    sub_district     = EXCLUDED.sub_district,
    updated_at       = NOW();

  -- ── 2. Delete existing relations (CASCADE handles item_progress via weekly_reports) ──
  DELETE FROM photos         WHERE project_id = v_project_id;
  DELETE FROM boq_items      WHERE project_id = v_project_id;
  DELETE FROM weekly_reports  WHERE project_id = v_project_id; -- cascades item_progress

  -- ── 3. Insert BoQ items ────────────────────────────────────────────────────
  INSERT INTO boq_items (id, project_id, item_number, description, unit, quantity, unit_price)
  SELECT
    (item->>'id')::uuid,
    v_project_id,
    item->>'item_number',
    item->>'description',
    item->>'unit',
    (item->>'quantity')::numeric,
    (item->>'unit_price')::numeric
  FROM jsonb_array_elements(p_boq_items) AS item
  WHERE jsonb_array_length(p_boq_items) > 0;

  -- ── 4. Insert weekly reports ───────────────────────────────────────────────
  INSERT INTO weekly_reports (id, project_id, week_number, start_date, end_date, work_description, created_at)
  SELECT
    (report->>'id')::uuid,
    v_project_id,
    (report->>'week_number')::int,
    (report->>'start_date')::date,
    (report->>'end_date')::date,
    report->>'work_description',
    COALESCE((report->>'created_at')::timestamptz, NOW())
  FROM jsonb_array_elements(p_weekly_reports) AS report
  WHERE jsonb_array_length(p_weekly_reports) > 0;

  -- ── 5. Insert item_progress (nested inside weekly reports) ─────────────────
  FOR v_report IN SELECT * FROM jsonb_array_elements(p_weekly_reports)
  LOOP
    IF v_report ? 'item_progress' AND jsonb_array_length(v_report->'item_progress') > 0 THEN
      INSERT INTO item_progress (weekly_report_id, boq_item_id, quantity)
      SELECT
        (v_report->>'id')::uuid,
        (ip->>'boq_item_id')::uuid,
        (ip->>'quantity')::numeric
      FROM jsonb_array_elements(v_report->'item_progress') AS ip;
    END IF;
  END LOOP;

  -- ── 6. Insert photos ──────────────────────────────────────────────────────
  INSERT INTO photos (id, project_id, weekly_report_id, url, caption, created_at)
  SELECT
    (photo->>'id')::uuid,
    CASE WHEN photo->>'project_id' IS NOT NULL THEN (photo->>'project_id')::uuid ELSE NULL END,
    CASE WHEN photo->>'weekly_report_id' IS NOT NULL THEN (photo->>'weekly_report_id')::uuid ELSE NULL END,
    photo->>'url',
    photo->>'caption',
    COALESCE((photo->>'created_at')::timestamptz, NOW())
  FROM jsonb_array_elements(p_photos) AS photo
  WHERE jsonb_array_length(p_photos) > 0;

  RETURN v_project_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION sync_project_complete(JSONB, JSONB, JSONB, JSONB) TO authenticated;
