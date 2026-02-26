import { supabase } from './supabase';
import { keysToCamel } from './caseMapper';
import type { Project, BoQItem, WeeklyReport, ItemProgress, Photo } from '@/types';

// ── Mapping Utilities ────────────────────────────────────────────────────────

/**
 * Maps a Supabase DB row (snake_case, flat + nested relations)
 * into the UI `Project` interface (camelCase, structured).
 *
 * Note: We still use explicit mapping here rather than the generic `keysToCamel`
 * because the DB schema has structural differences from the UI model
 * (e.g., `location_lat`/`location_lng` → `location: [lat, lng]`,
 *  `contract_price` as numeric → `contractPrice` as string,
 *  photos split between project-level and report-level).
 */
function mapProjectFromDb(row: any): Project {
  const boq: BoQItem[] = (row.boq_items || []).map((item: any) => ({
    id: item.id,
    itemNumber: item.item_number,
    description: item.description,
    unit: item.unit,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unit_price),
  }));

  const weeklyReports: WeeklyReport[] = (row.weekly_reports || []).map((report: any) => {
    const itemProgress: ItemProgress[] = (report.item_progress || []).map((ip: any) => ({
      boqItemId: ip.boq_item_id,
      quantity: Number(ip.quantity),
    }));

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
    createdBy: row.created_by || undefined,
    createdByNickname: row.creator?.nickname || undefined,
    updatedByNickname: row.editor?.nickname || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── Project Service ──────────────────────────────────────────────────────────

const SELECT_QUERY = `
  *,
  creator:profiles!projects_created_by_profiles_fkey(nickname),
  editor:profiles!projects_updated_by_profiles_fkey(nickname),
  boq_items(*),
  weekly_reports(
    *,
    item_progress(*)
  ),
  photos(*)
`;

export const projectService = {
  /** Upload a photo to Supabase Storage under the project's folder. */
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

  /** Fetch all projects with their relations (BoQ, reports, photos). */
  async getAll(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select(SELECT_QUERY)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapProjectFromDb);
  },

  /** Fetch a single project by ID, or undefined if not found. */
  async getById(id: string): Promise<Project | undefined> {
    const { data, error } = await supabase
      .from('projects')
      .select(SELECT_QUERY)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    return data ? mapProjectFromDb(data) : undefined;
  },

  /** Create a new project atomically via Postgres RPC. */
  async create(project: Project): Promise<string> {
    await this._callSyncRpc(project);
    return project.id;
  },

  /** Update a project atomically via Postgres RPC. Merges partial updates with current state. */
  async update(id: string, updates: Partial<Project>): Promise<number> {
    const current = await this.getById(id);
    if (!current) throw new Error('Project not found during update');

    const merged: Project = { ...current, ...updates };
    merged.boq = updates.boq !== undefined ? updates.boq : current.boq;
    merged.weeklyReports = updates.weeklyReports !== undefined ? updates.weeklyReports : current.weeklyReports;
    merged.photos = updates.photos !== undefined ? updates.photos : current.photos;

    await this._callSyncRpc(merged);
    return 1;
  },

  /** Delete a project and all its relations (via CASCADE). */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  /** Search projects by name or contractor. */
  async search(query: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select(SELECT_QUERY)
      .or(`name.ilike.%${query}%,contractor.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapProjectFromDb);
  },

  /**
   * Calls the `sync_project_complete` Postgres RPC to atomically
   * upsert a project and replace all relational data in one transaction.
   */
  async _callSyncRpc(project: Project) {
    const p_project = {
      id: project.id,
      name: project.name,
      contractor: project.contractor,
      supervisor: project.supervisor,
      contract_price: Number(project.contractPrice) || 0,
      work_type: project.workType,
      road_hierarchy: project.roadHierarchy,
      maintenance_type: project.maintenanceType,
      start_date: project.startDate,
      end_date: project.endDate,
      length: project.length || 0,
      average_width: project.averageWidth || 0,
      location_lat: project.location ? project.location[0] : null,
      location_lng: project.location ? project.location[1] : null,
      district: project.district || '',
      sub_district: project.subDistrict || '',
    };

    const p_boq_items = (project.boq || []).map(b => ({
      id: b.id,
      item_number: b.itemNumber,
      description: b.description,
      unit: b.unit,
      quantity: b.quantity,
      unit_price: b.unitPrice,
    }));

    const p_weekly_reports = (project.weeklyReports || []).map(wr => ({
      id: wr.id,
      week_number: wr.weekNumber,
      start_date: wr.startDate,
      end_date: wr.endDate,
      work_description: wr.workDescription,
      created_at: wr.createdAt || new Date().toISOString(),
      item_progress: (wr.itemProgress || []).map(ip => ({
        boq_item_id: ip.boqItemId,
        quantity: ip.quantity,
      })),
    }));

    let p_photos: any[] = [];

    if (project.photos && project.photos.length > 0) {
      p_photos = p_photos.concat(project.photos.map(p => ({
        id: p.id,
        project_id: project.id,
        weekly_report_id: null,
        url: p.url,
        caption: p.caption || null,
        created_at: p.createdAt || new Date().toISOString(),
      })));
    }

    (project.weeklyReports || []).forEach(wr => {
      if (wr.photos && wr.photos.length > 0) {
        p_photos = p_photos.concat(wr.photos.map(p => ({
          id: p.id,
          project_id: project.id,
          weekly_report_id: wr.id,
          url: p.url,
          caption: p.caption || null,
          created_at: p.createdAt || new Date().toISOString(),
        })));
      }
    });

    const { error } = await supabase.rpc('sync_project_complete', {
      p_project,
      p_boq_items,
      p_weekly_reports,
      p_photos,
    });

    if (error) throw error;
  },
};
