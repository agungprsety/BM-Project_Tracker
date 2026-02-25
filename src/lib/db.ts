import { supabase } from './supabase';
import type { Project, BoQItem, WeeklyReport, ItemProgress, Photo } from '@/types';

// ── Mapping Utilities ────────────────────────────────────────────────────────

// Map a Database row to our UI `Project` interface
function mapProjectFromDb(row: any): Project {
  // Map boq_items
  const boq: BoQItem[] = (row.boq_items || []).map((item: any) => ({
    id: item.id,
    itemNumber: item.item_number,
    description: item.description,
    unit: item.unit,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unit_price),
  }));

  // Map weekly_reports and nested item_progress
  const weeklyReports: WeeklyReport[] = (row.weekly_reports || []).map((report: any) => {
    const itemProgress: ItemProgress[] = (report.item_progress || []).map((ip: any) => ({
      boqItemId: ip.boq_item_id,
      quantity: Number(ip.quantity),
    }));

    // Photos specific to this weekly report
    const reportPhotos = (row.photos || [])
      .filter((p: any) => p.weekly_report_id === report.id)
      .map((p: any) => ({
        id: p.id,
        url: p.url,
        caption: p.caption || undefined,
        createdAt: p.created_at,
      }));

    return {
      id: report.id,
      weekNumber: report.week_number,
      startDate: report.start_date,
      endDate: report.end_date,
      workDescription: report.work_description,
      itemProgress,
      photos: reportPhotos,
      createdAt: report.created_at,
    };
  });

  // Photos attached directly to the project (not a specific weekly report)
  const projectPhotos: Photo[] = (row.photos || [])
    .filter((p: any) => !p.weekly_report_id)
    .map((p: any) => ({
      id: p.id,
      url: p.url,
      caption: p.caption || undefined,
      createdAt: p.created_at,
    }));

  return {
    id: row.id,
    name: row.name,
    contractor: row.contractor,
    supervisor: row.supervisor,
    contractPrice: String(row.contract_price),
    workType: row.work_type,
    roadHierarchy: row.road_hierarchy,
    maintenanceType: row.maintenance_type,
    startDate: row.start_date,
    endDate: row.end_date,
    length: Number(row.length),
    averageWidth: Number(row.average_width),
    location: (row.location_lat && row.location_lng) ? [Number(row.location_lat), Number(row.location_lng)] : null,
    district: row.district,
    subDistrict: row.sub_district,
    boq,
    weeklyReports,
    photos: projectPhotos,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Map a UI `Project` interface to a Database row (excluding relations)
function mapProjectToDb(project: Partial<Project>) {
  const data: any = {};
  if (project.id !== undefined) data.id = project.id;
  if (project.name !== undefined) data.name = project.name;
  if (project.contractor !== undefined) data.contractor = project.contractor;
  if (project.supervisor !== undefined) data.supervisor = project.supervisor;
  if (project.contractPrice !== undefined) data.contract_price = Number(project.contractPrice) || 0;
  if (project.workType !== undefined) data.work_type = project.workType;
  if (project.roadHierarchy !== undefined) data.road_hierarchy = project.roadHierarchy;
  if (project.maintenanceType !== undefined) data.maintenance_type = project.maintenanceType;
  if (project.startDate !== undefined) data.start_date = project.startDate;
  if (project.endDate !== undefined) data.end_date = project.endDate;
  if (project.length !== undefined) data.length = project.length;
  if (project.averageWidth !== undefined) data.average_width = project.averageWidth;

  if (project.location !== undefined) {
    if (project.location) {
      data.location_lat = project.location[0];
      data.location_lng = project.location[1];
    } else {
      data.location_lat = null;
      data.location_lng = null;
    }
  }

  if (project.district !== undefined) data.district = project.district;
  if (project.subDistrict !== undefined) data.sub_district = project.subDistrict;

  return data;
}

// ── Project Service ──────────────────────────────────────────────────────────

const SELECT_QUERY = `
  *,
  boq_items(*),
  weekly_reports(
    *,
    item_progress(*)
  ),
  photos(*)
`;

export const projectService = {
  async uploadPhoto(file: File, projectId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${projectId}/${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('project-photos')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('project-photos')
      .getPublicUrl(fileName);

    return data.publicUrl;
  },
  async getAll(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select(SELECT_QUERY)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapProjectFromDb);
  },

  async getById(id: string): Promise<Project | undefined> {
    const { data, error } = await supabase
      .from('projects')
      .select(SELECT_QUERY)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return undefined; // missing row
      throw error;
    }
    return data ? mapProjectFromDb(data) : undefined;
  },

  async create(project: Project): Promise<string> {
    // 1. Insert Project
    const projectRow = mapProjectToDb(project);
    const { error: projectError } = await supabase
      .from('projects')
      .insert([projectRow]);

    if (projectError) throw projectError;

    // 2. Insert all relations (BoQ, Weekly Reports, Photos)
    await this._syncRelations(project.id, project.boq || [], project.weeklyReports || [], project.photos || []);

    return project.id;
  },

  async update(id: string, updates: Partial<Project>): Promise<number> {
    // 1. Update Project Scalar Fields
    const projectUpdates = mapProjectToDb(updates);

    // Only perform the update query if there are fields to update (excluding relations like boq or weeklyReports)
    if (Object.keys(projectUpdates).length > 0) {
      const { error: updateError } = await supabase
        .from('projects')
        .update(projectUpdates)
        .eq('id', id);

      if (updateError) throw updateError;
    }

    // 2. Re-sync Relations if provided
    if (updates.boq || updates.weeklyReports || updates.photos) {
      // Because updates are partial, we only have what changed. 
      // The easiest NoSQL-like behavior is to completely overwrite relations if they are present in the `updates` object.
      // But we must be careful: if `updates` has `weeklyReports` but no `boq`, we need to make sure we don't break things.

      // Let's fetch the current state first to have full arrays
      const current = await this.getById(id);
      if (!current) throw new Error("Project not found during update");

      const boqToSync = updates.boq !== undefined ? updates.boq : current.boq;
      const reportsToSync = updates.weeklyReports !== undefined ? updates.weeklyReports : current.weeklyReports;
      const photosToSync = updates.photos !== undefined ? updates.photos : current.photos;

      await this._syncRelations(id, boqToSync, reportsToSync, photosToSync);
    }

    return 1;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async search(query: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select(SELECT_QUERY)
      .or(`name.ilike.%${query}%,contractor.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapProjectFromDb);
  },

  // Helper to completely overwrite relational arrays (similar to NoSQL replacement)
  async _syncRelations(projectId: string, boq: BoQItem[], weeklyReports: WeeklyReport[], photos: Photo[]) {
    // To mimic the overwrite behavior of the UI:
    // 1. Delete all existing relations for this project.
    // Note: CASCADE constraints on Supabase mean if you delete BoQ or Weekly reports, child rows (like item_progress) die too,
    // but deleting the project isn't happening.
    // We explicitly clear them out prior to insert.

    const { error: delBoqErr } = await supabase.from('boq_items').delete().eq('project_id', projectId);
    if (delBoqErr) throw delBoqErr;

    const { error: delWrErr } = await supabase.from('weekly_reports').delete().eq('project_id', projectId);
    if (delWrErr) throw delWrErr;

    const { error: delPhotoErr } = await supabase.from('photos').delete().eq('project_id', projectId);
    if (delPhotoErr) throw delPhotoErr;

    // Now insert the fresh state
    // --- BOQ ---
    if (boq.length > 0) {
      const boqRows = boq.map(b => ({
        id: b.id,
        project_id: projectId,
        item_number: b.itemNumber,
        description: b.description,
        unit: b.unit,
        quantity: b.quantity,
        unit_price: b.unitPrice
      }));
      const { error } = await supabase.from('boq_items').insert(boqRows);
      if (error) throw error;
    }

    // --- Weekly Reports & item_progress ---
    if (weeklyReports.length > 0) {
      const wrRows = weeklyReports.map(wr => ({
        id: wr.id,
        project_id: projectId,
        week_number: wr.weekNumber,
        start_date: wr.startDate,
        end_date: wr.endDate,
        work_description: wr.workDescription,
        created_at: wr.createdAt || new Date().toISOString()
      }));
      const { error: wrError } = await supabase.from('weekly_reports').insert(wrRows);
      if (wrError) throw wrError;

      // Flatten item_progress across all reports
      const ipRows: any[] = [];
      weeklyReports.forEach(wr => {
        if (wr.itemProgress && wr.itemProgress.length > 0) {
          wr.itemProgress.forEach(ip => {
            ipRows.push({
              weekly_report_id: wr.id,
              boq_item_id: ip.boqItemId,
              quantity: ip.quantity
            });
          });
        }
      });

      if (ipRows.length > 0) {
        const { error: ipError } = await supabase.from('item_progress').insert(ipRows);
        if (ipError) throw ipError;
      }
    }

    // --- Photos ---
    // Distinguish between project photos and weekly report photos (UI maps all project photos to top level, but some are tied to reports)
    // Actually in UI `project.photos` are project-wide gallery. Weekly reports have their own embedded `photos` array.
    // Wait, is there a `wr.photos`? Yes, `WeeklyReport` interface has `photos: Photo[]`.
    // Let's gather them all.

    let allPhotosRows: any[] = [];

    // Project level photos
    if (photos.length > 0) {
      allPhotosRows = allPhotosRows.concat(photos.map(p => ({
        id: p.id,
        project_id: projectId,
        url: p.url,
        caption: p.caption,
        created_at: p.createdAt || new Date().toISOString()
      })));
    }

    // Weekly report photos
    weeklyReports.forEach(wr => {
      if (wr.photos && wr.photos.length > 0) {
        allPhotosRows = allPhotosRows.concat(wr.photos.map(p => ({
          id: p.id,
          weekly_report_id: wr.id,  // No project_id needed due to CHECK constraint allowing one OR other, but we can set both or just wr_id.
          project_id: projectId,    // Best to set both if we want to cascade on project delete easily!
          url: p.url,
          caption: p.caption,
          created_at: p.createdAt || new Date().toISOString()
        })));
      }
    });

    if (allPhotosRows.length > 0) {
      const { error: pError } = await supabase.from('photos').insert(allPhotosRows);
      if (pError) throw pError;
    }
  }
};
