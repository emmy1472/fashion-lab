'use client';

import type { GarmentCategory, ProjectStatus } from '@/lib/contracts';
import { garmentStore } from './store';

export interface ProjectListItem {
  id: string;
  name: string;
  garment_category: GarmentCategory;
  status: ProjectStatus;
  version: number;
  created_at: string;
  updated_at: string;
  active_stage?: number;
}

/**
 * Lists the user's projects. When the API is backed by the database its list is authoritative;
 * otherwise projects saved in this browser are merged in so newly created work shows up.
 */
export async function fetchProjectList(): Promise<ProjectListItem[]> {
  let apiProjects: ProjectListItem[] = [];
  let fromDatabase = false;

  try {
    const res = await fetch('/api/projects');
    if (res.ok) {
      const data = await res.json();
      apiProjects = data.projects || [];
      fromDatabase = data.source === 'database';
    }
  } catch {
    // Offline; fall back to local projects
  }

  if (fromDatabase) return apiProjects;

  const byId = new Map<string, ProjectListItem>();
  for (const p of apiProjects) byId.set(p.id, p);
  for (const local of garmentStore.listLocalProjects()) {
    byId.set(local.id, {
      id: local.id,
      name: local.name,
      garment_category: local.garmentCategory,
      status: local.status,
      version: local.version,
      created_at: local.createdAt,
      updated_at: local.updatedAt,
      active_stage: local.activeStage,
    });
  }

  return [...byId.values()].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}
