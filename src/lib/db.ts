import Dexie, { type Table } from 'dexie';
import type { Project, BoQItem, WeeklyReport, Photo } from '@/types';

export class ProjectDatabase extends Dexie {
  projects!: Table<Project>;

  constructor() {
    super('BMProjectTracker');
    this.version(1).stores({
      projects: 'id, name, contractor, createdAt, updatedAt',
    });
  }
}

export const db = new ProjectDatabase();

export const projectService = {
  async getAll(): Promise<Project[]> {
    return db.projects.toArray();
  },

  async getById(id: string): Promise<Project | undefined> {
    return db.projects.get(id);
  },

  async create(project: Project): Promise<string> {
    return db.projects.add(project);
  },

  async update(id: string, updates: Partial<Project>): Promise<number> {
    return db.projects.update(id, { ...updates, updatedAt: new Date().toISOString() });
  },

  async delete(id: string): Promise<void> {
    return db.projects.delete(id);
  },

  async search(query: string): Promise<Project[]> {
    const lowerQuery = query.toLowerCase();
    return db.projects
      .filter((p) => 
        p.name.toLowerCase().includes(lowerQuery) ||
        p.contractor.toLowerCase().includes(lowerQuery)
      )
      .toArray();
  },
};
