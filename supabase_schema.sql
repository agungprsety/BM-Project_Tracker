-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Enums
CREATE TYPE work_type AS ENUM ('rigid-pavement', 'flexible-pavement', 'combination', 'other');
CREATE TYPE road_hierarchy AS ENUM ('JAS', 'JKS', 'JLS', 'Jling-S', 'J-ling Kota');
CREATE TYPE maintenance_type AS ENUM ('reconstruction', 'rehabilitation', 'periodic-rehabilitation', 'routine-maintenance');

-- 2. Create Projects Table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    contractor TEXT NOT NULL,
    supervisor TEXT NOT NULL,
    contract_price NUMERIC NOT NULL,
    work_type work_type NOT NULL,
    road_hierarchy road_hierarchy NOT NULL,
    maintenance_type maintenance_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    length NUMERIC NOT NULL,
    average_width NUMERIC NOT NULL,
    location_lat NUMERIC,
    location_lng NUMERIC,
    district TEXT NOT NULL,
    sub_district TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create BoQ Items Table
CREATE TABLE boq_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    item_number TEXT NOT NULL,
    description TEXT NOT NULL,
    unit TEXT NOT NULL,
    quantity NUMERIC NOT NULL,
    unit_price NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Weekly Reports Table
CREATE TABLE weekly_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    week_number INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    work_description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Item Progress Table
CREATE TABLE item_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    weekly_report_id UUID NOT NULL REFERENCES weekly_reports(id) ON DELETE CASCADE,
    boq_item_id UUID NOT NULL REFERENCES boq_items(id) ON DELETE CASCADE,
    quantity NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (weekly_report_id, boq_item_id)
);

-- 6. Create Photos Table
CREATE TABLE photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    weekly_report_id UUID REFERENCES weekly_reports(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    caption TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (project_id IS NOT NULL OR weekly_report_id IS NOT NULL)
);

-- 7. Add updated_at trigger for projects
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 8. Create Indexes on Foreign Keys
CREATE INDEX idx_boq_items_project_id ON boq_items(project_id);
CREATE INDEX idx_weekly_reports_project_id ON weekly_reports(project_id);
CREATE INDEX idx_item_progress_weekly_report_id ON item_progress(weekly_report_id);
CREATE INDEX idx_item_progress_boq_item_id ON item_progress(boq_item_id);
CREATE INDEX idx_photos_project_id ON photos(project_id);
CREATE INDEX idx_photos_weekly_report_id ON photos(weekly_report_id);

-- 9. Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE boq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- 10. Basic RLS Policies (Allow authenticated users to manage all data)
-- Note: Replace with more specific policies as needed (e.g., project-based access)
CREATE POLICY "Enable read access for all authenticated users" ON projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert access for all authenticated users" ON projects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update access for all authenticated users" ON projects FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete access for all authenticated users" ON projects FOR DELETE TO authenticated USING (true);

-- Repeat for other tables
CREATE POLICY "Enable all access for authenticated users" ON boq_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for authenticated users" ON weekly_reports FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for authenticated users" ON item_progress FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for authenticated users" ON photos FOR ALL TO authenticated USING (true) WITH CHECK (true);
