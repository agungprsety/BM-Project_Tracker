export interface Project {
  id: string;
  name: string;
  contractor: string;
  supervisor: string;
  contractPrice: string;
  workType: WorkType;
  roadHierarchy: RoadHierarchy;
  maintenanceType: MaintenanceType;
  startDate: string;
  endDate: string;
  length: number;
  averageWidth: number;
  location: [number, number] | null;
  district: string;
  subDistrict: string;
  boq: BoQItem[];
  weeklyReports: WeeklyReport[];
  photos: Photo[];
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BoQItem {
  id: string;
  itemNumber: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
}

export interface ItemProgress {
  boqItemId: string;
  quantity: number;
}

export interface WeeklyReport {
  id: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  workDescription: string;
  itemProgress: ItemProgress[];
  photos: Photo[];
  createdAt: string;
}

export interface Photo {
  id: string;
  url: string;
  caption?: string;
  createdAt: string;
}

export enum WorkType {
  RIGID_PAVEMENT = 'rigid-pavement',
  FLEXIBLE_PAVEMENT = 'flexible-pavement',
  COMBINATION = 'combination',
  OTHER = 'other',
}

export enum RoadHierarchy {
  JAS = 'JAS',
  JKS = 'JKS',
  JLS = 'JLS',
  JLING_S = 'Jling-S',
  JLING_KOTA = 'J-ling Kota',
}

export enum MaintenanceType {
  RECONSTRUCTION = 'reconstruction',
  REHABILITATION = 'rehabilitation',
  PERIODIC_REHABILITATION = 'periodic-rehabilitation',
  ROUTINE_MAINTENANCE = 'routine-maintenance',
}
