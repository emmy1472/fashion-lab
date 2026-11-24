/**
 * FASHION-LAB: CANONICAL PRODUCTION STORE & STATE SYNCHRONIZATION
 * 
 * Central reactive store ensuring single-source-of-truth across all 9 production stages:
 * - Upstream changes (Measurements, Pattern Dimensions, Fabric) automatically propagate
 *   downstream to Seams, 3D Mesh, Cutting Nesting, BOM, and Technical Specification Sheets.
 * - Integrated debounced autosave to /api/projects with persistent localStorage fallback.
 * - Bidirectional synchronization with Canonical Garment Document Model (GDM).
 */

'use client';

import { useSyncExternalStore } from 'react';
import {
  GarmentProject,
  BodyMeasurementProfile,
  FabricMaterial,
  PatternPiece,
  SewingRelationship,
  CuttingPlan,
  GarmentComponent,
  AssemblyStep,
  FinishingSpecification,
  GarmentCategory,
  GarmentDesignState,
} from './types';
import { DEFAULT_FABRIC, FABRIC_LIBRARY } from './fabrics';
import { draftTShirt, TShirtDraftOptions } from './drafting/tshirt';
import { computeCuttingPlan } from './nesting';
import { GarmentSize, SIZE_PROFILES, STANDARD_SIZES } from './grading';
export type { GarmentSize } from './grading';
export { STANDARD_SIZES } from './grading';
import {
  projectToGDM,
  gdmToProject,
  validateGDM,
  DEFAULT_DESIGN_STATE,
  GarmentDocument,
} from '@/lib/contracts';

import {
  DEFAULT_MEASUREMENT_PROFILE,
  STANDARD_COMPONENTS,
  STANDARD_ASSEMBLY_SEQUENCE,
  STANDARD_FINISHING,
} from "./defaults";
export {
  DEFAULT_MEASUREMENT_PROFILE,
  STANDARD_COMPONENTS,
  STANDARD_ASSEMBLY_SEQUENCE,
  STANDARD_FINISHING,
};

function createInitialProject(): GarmentProject {
  const drafted = draftTShirt(DEFAULT_MEASUREMENT_PROFILE);
  const cutting = computeCuttingPlan(drafted.pieces);

  return {
    id: 'proj_essential_tshirt',
    name: 'Tailored Essential Crewneck T-Shirt',
    garmentCategory: 't-shirt',
    bodyProfile: DEFAULT_MEASUREMENT_PROFILE,
    patternPieces: drafted.pieces,
    sewingRelationships: drafted.sewingRelationships,
    fabric: DEFAULT_FABRIC,
    cuttingPlan: cutting,
    components: STANDARD_COMPONENTS,
    assemblySequence: STANDARD_ASSEMBLY_SEQUENCE,
    finishing: STANDARD_FINISHING,
    design: DEFAULT_DESIGN_STATE,
    activeStage: 2,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// Storage Constants
const STORAGE_PREFIX = 'fashionlab_project_';
const ACTIVE_PROJECT_KEY = 'fashionlab_active_project_id';

export interface LocalProjectSummary {
  id: string;
  name: string;
  garmentCategory: GarmentCategory;
  status: GarmentDocument['metadata']['status'];
  version: number;
  createdAt: string;
  updatedAt: string;
  activeStage?: GarmentProject['activeStage'];
}

export interface GarmentSaveStatus {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSavedAt: string | null;
  isDirty: boolean;
  syncError: string | null;
}

// Global Store State
let currentProject: GarmentProject = createInitialProject();
let saveStatusState: GarmentSaveStatus = {
  status: 'idle',
  lastSavedAt: null,
  isDirty: false,
  syncError: null,
};

/** Id of the project that was actually loaded from persistence (or created) in this session. */
let hydratedProjectId: string | null = null;

const listeners = new Set<() => void>();
const saveStatusListeners = new Set<() => void>();
let autosaveTimer: ReturnType<typeof setTimeout> | null = null;

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

function notifySaveStatus() {
  for (const listener of saveStatusListeners) {
    listener();
  }
}

function triggerAutosave() {
  saveStatusState = {
    ...saveStatusState,
    isDirty: true,
  };
  notifySaveStatus();

  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
  }

  autosaveTimer = setTimeout(() => {
    garmentStore.saveProject().catch((err) => {
      console.warn('Autosave error:', err);
    });
  }, 1200);
}

export const garmentStore = {
  getSnapshot(): GarmentProject {
    return currentProject;
  },

  getSaveStatusSnapshot(): GarmentSaveStatus {
    return saveStatusState;
  },

  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  subscribeSaveStatus(listener: () => void) {
    saveStatusListeners.add(listener);
    return () => saveStatusListeners.delete(listener);
  },

  setActiveStage(stage: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9) {
    currentProject = {
      ...currentProject,
      activeStage: stage,
      updatedAt: new Date().toISOString(),
    };
    notify();
    triggerAutosave();
  },

  setProjectName(name: string) {
    currentProject = {
      ...currentProject,
      name,
      updatedAt: new Date().toISOString(),
    };
    notify();
    triggerAutosave();
  },

  updateBodyMeasurements(partial: Partial<BodyMeasurementProfile>) {
    const updatedProfile: BodyMeasurementProfile = {
      ...currentProject.bodyProfile,
      ...partial,
      updatedAt: new Date().toISOString(),
    };

    // Re-draft pattern pieces with new measurements
    const drafted = draftTShirt(updatedProfile);
    const cutting = computeCuttingPlan(drafted.pieces);

    currentProject = {
      ...currentProject,
      bodyProfile: updatedProfile,
      patternPieces: drafted.pieces,
      sewingRelationships: drafted.sewingRelationships,
      cuttingPlan: cutting,
      version: currentProject.version + 1,
      updatedAt: new Date().toISOString(),
    };
    notify();
    triggerAutosave();
  },

  updatePatternDraftOptions(options: TShirtDraftOptions) {
    const drafted = draftTShirt(currentProject.bodyProfile, options);
    const cutting = computeCuttingPlan(drafted.pieces);

    currentProject = {
      ...currentProject,
      patternPieces: drafted.pieces,
      sewingRelationships: drafted.sewingRelationships,
      cuttingPlan: cutting,
      version: currentProject.version + 1,
      updatedAt: new Date().toISOString(),
    };
    notify();
    triggerAutosave();
  },

  gradeToSize(size: GarmentSize, options?: TShirtDraftOptions) {
    const profile = SIZE_PROFILES[size] || DEFAULT_MEASUREMENT_PROFILE;
    const drafted = draftTShirt(profile, options);
    const cutting = computeCuttingPlan(drafted.pieces);

    currentProject = {
      ...currentProject,
      bodyProfile: profile,
      patternPieces: drafted.pieces,
      sewingRelationships: drafted.sewingRelationships,
      cuttingPlan: cutting,
      version: currentProject.version + 1,
      updatedAt: new Date().toISOString(),
    };
    notify();
    triggerAutosave();
  },

  setFabric(fabricId: string) {
    const fabric = FABRIC_LIBRARY[fabricId] || DEFAULT_FABRIC;
    // Recomputing cutting nesting in case fabric width or constraints changed
    const cutting = computeCuttingPlan(currentProject.patternPieces);

    currentProject = {
      ...currentProject,
      fabric,
      cuttingPlan: cutting,
      version: currentProject.version + 1,
      updatedAt: new Date().toISOString(),
    };
    notify();
    triggerAutosave();
  },

  /** Recolours the current fabric. Material properties (and therefore the cutting plan) are unchanged. */
  setFabricColor(hex: string) {
    if (currentProject.fabric.baseColor.toLowerCase() === hex.toLowerCase()) return;
    currentProject = {
      ...currentProject,
      fabric: { ...currentProject.fabric, baseColor: hex },
      updatedAt: new Date().toISOString(),
    };
    notify();
    triggerAutosave();
  },

  updateDesignState(partialDesign: Partial<GarmentDesignState>) {
    currentProject = {
      ...currentProject,
      design: {
        ...(currentProject.design || DEFAULT_DESIGN_STATE),
        ...partialDesign,
      },
      updatedAt: new Date().toISOString(),
    };
    notify();
    triggerAutosave();
  },

  toggleAssemblyStep(stepNumber: number) {
    const updatedSequence = currentProject.assemblySequence.map((step) =>
      step.stepNumber === stepNumber ? { ...step, completed: !step.completed } : step
    );
    currentProject = {
      ...currentProject,
      assemblySequence: updatedSequence,
      updatedAt: new Date().toISOString(),
    };
    notify();
    triggerAutosave();
  },

  toggleComponentStatus(componentId: string) {
    const updatedComponents = currentProject.components.map((comp) => {
      if (comp.id === componentId) {
        const nextStatus = comp.status === 'ready' ? 'pending' : comp.status === 'pending' ? 'prepared' : 'ready';
        return { ...comp, status: nextStatus as any };
      }
      return comp;
    });
    currentProject = {
      ...currentProject,
      components: updatedComponents,
      updatedAt: new Date().toISOString(),
    };
    notify();
    triggerAutosave();
  },

  toggleInspectionCheck(checkId: string) {
    const updatedChecklist = currentProject.finishing.inspectionChecklist.map((item) =>
      item.id === checkId ? { ...item, verified: !item.verified } : item
    );
    currentProject = {
      ...currentProject,
      finishing: {
        ...currentProject.finishing,
        inspectionChecklist: updatedChecklist,
      },
      updatedAt: new Date().toISOString(),
    };
    notify();
    triggerAutosave();
  },

  /**
   * Persists current project to localStorage and API endpoint
   */
  async saveProject(): Promise<boolean> {
    if (autosaveTimer) {
      clearTimeout(autosaveTimer);
      autosaveTimer = null;
    }

    saveStatusState = {
      ...saveStatusState,
      status: 'saving',
      syncError: null,
    };
    notifySaveStatus();

    try {
      const gdm = projectToGDM(currentProject, currentProject.design);
      const validation = validateGDM(gdm);

      if (!validation.isValid) {
        console.warn('GDM Validation warnings/errors during save:', validation.errors);
      }

      // 1. Instant local persistence
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_PREFIX + currentProject.id, JSON.stringify(gdm));
          localStorage.setItem(ACTIVE_PROJECT_KEY, currentProject.id);
        } catch (storageErr) {
          console.warn('LocalStorage save failed:', storageErr);
        }
      }

      // 2. Remote API persistence
      try {
        const res = await fetch(`/api/projects/${encodeURIComponent(currentProject.id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gdm }),
        });

        if (res.ok) {
          const resData = await res.json().catch(() => ({}));
          saveStatusState = {
            status: 'saved',
            lastSavedAt: resData.updatedAt || new Date().toISOString(),
            isDirty: false,
            syncError: null,
          };
          notifySaveStatus();
          return true;
        }
      } catch (networkErr) {
        // Network or server unreachable; offline storage succeeded
        console.info('Offline persistence mode active (saved locally).');
      }

      saveStatusState = {
        status: 'saved',
        lastSavedAt: new Date().toISOString(),
        isDirty: false,
        syncError: null,
      };
      notifySaveStatus();
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Save failed';
      saveStatusState = {
        status: 'error',
        lastSavedAt: saveStatusState.lastSavedAt,
        isDirty: true,
        syncError: message,
      };
      notifySaveStatus();
      return false;
    }
  },

  /**
   * Loads a project by ID from API or LocalStorage
   */
  async loadProject(projectId: string): Promise<boolean> {
    // Check LocalStorage first for instant responsiveness
    let localGdm: GarmentDocument | null = null;
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_PREFIX + projectId);
        if (raw) localGdm = JSON.parse(raw);
      } catch {
        // Parse error ignored
      }
    }

    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}`);
      if (res.ok) {
        const data = await res.json();
        // Without a database the API answers every id with a starter template.
        // Only let it win over a locally saved copy when it came from the database.
        const isAuthoritative = data.source === 'database' || !localGdm;
        if (data.gdm && isAuthoritative) {
          currentProject = gdmToProject(data.gdm);
          hydratedProjectId = currentProject.id;
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_PREFIX + projectId, JSON.stringify(data.gdm));
            localStorage.setItem(ACTIVE_PROJECT_KEY, projectId);
          }
          saveStatusState = {
            status: 'saved',
            lastSavedAt: data.gdm.metadata.updatedAt || new Date().toISOString(),
            isDirty: false,
            syncError: null,
          };
          notify();
          notifySaveStatus();
          return true;
        }
      }
    } catch {
      // API unavailable, use local copy
    }

    if (localGdm) {
      currentProject = gdmToProject(localGdm);
      hydratedProjectId = currentProject.id;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(ACTIVE_PROJECT_KEY, projectId);
        } catch {
          // ignore
        }
      }
      saveStatusState = {
        status: 'saved',
        lastSavedAt: localGdm.metadata.updatedAt || new Date().toISOString(),
        isDirty: false,
        syncError: null,
      };
      notify();
      notifySaveStatus();
      return true;
    }

    saveStatusState = {
      status: 'idle',
      lastSavedAt: null,
      isDirty: false,
      syncError: null,
    };
    notifySaveStatus();
    return false;
  },

  /**
   * Makes a freshly created document the active project (e.g. the response of POST /api/projects).
   */
  hydrateFromGDM(gdm: GarmentDocument) {
    currentProject = gdmToProject(gdm);
    hydratedProjectId = currentProject.id;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_PREFIX + currentProject.id, JSON.stringify(gdm));
        localStorage.setItem(ACTIVE_PROJECT_KEY, currentProject.id);
      } catch {
        // Storage unavailable; project still lives in memory
      }
    }
    notify();
  },

  /** True once the given project has been loaded from persistence (not just the built-in default). */
  isLoaded(projectId: string): boolean {
    return hydratedProjectId === projectId && currentProject.id === projectId;
  },

  /** Id of the project the user last worked on. */
  getActiveProjectId(): string {
    if (typeof window !== 'undefined') {
      try {
        const id = localStorage.getItem(ACTIVE_PROJECT_KEY);
        if (id) return id;
      } catch {
        // ignore
      }
    }
    return currentProject.id;
  },

  /** Projects saved in this browser (used when no database is connected). */
  listLocalProjects(): LocalProjectSummary[] {
    if (typeof window === 'undefined') return [];
    const out: LocalProjectSummary[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith(STORAGE_PREFIX)) continue;
        try {
          const gdm = JSON.parse(localStorage.getItem(key) || 'null') as GarmentDocument | null;
          if (!gdm?.metadata?.id) continue;
          out.push({
            id: gdm.metadata.id,
            name: gdm.metadata.name,
            garmentCategory: gdm.metadata.garmentCategory,
            status: gdm.metadata.status,
            version: gdm.metadata.version,
            createdAt: gdm.metadata.createdAt,
            updatedAt: gdm.metadata.updatedAt,
            activeStage: gdm.activeStage,
          });
        } catch {
          // Skip corrupt entries
        }
      }
    } catch {
      // Storage unavailable
    }
    return out;
  },

  removeLocalProject(projectId: string) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_PREFIX + projectId);
      if (localStorage.getItem(ACTIVE_PROJECT_KEY) === projectId) {
        localStorage.removeItem(ACTIVE_PROJECT_KEY);
      }
    } catch {
      // ignore
    }
  },

  /**
   * Resets or creates a new project from category template
   */
  createNewProject(name: string = 'New Bespoke T-Shirt', category: GarmentCategory = 't-shirt') {
    const projectId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const drafted = draftTShirt(DEFAULT_MEASUREMENT_PROFILE);
    const cutting = computeCuttingPlan(drafted.pieces);

    currentProject = {
      id: projectId,
      name,
      garmentCategory: category,
      bodyProfile: DEFAULT_MEASUREMENT_PROFILE,
      patternPieces: drafted.pieces,
      sewingRelationships: drafted.sewingRelationships,
      fabric: DEFAULT_FABRIC,
      cuttingPlan: cutting,
      components: STANDARD_COMPONENTS,
      assemblySequence: STANDARD_ASSEMBLY_SEQUENCE,
      finishing: STANDARD_FINISHING,
      design: DEFAULT_DESIGN_STATE,
      activeStage: 1,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    hydratedProjectId = projectId;
    notify();
    garmentStore.saveProject().catch(() => {});
  },
};

/**
 * React Hook to subscribe to the Canonical Garment Project
 */
export function useGarmentProject(): GarmentProject {
  return useSyncExternalStore(
    garmentStore.subscribe,
    garmentStore.getSnapshot,
    garmentStore.getSnapshot
  );
}

/**
 * React Hook to subscribe to persistence status (idle, saving, saved, error)
 */
export function useGarmentSaveStatus(): GarmentSaveStatus {
  return useSyncExternalStore(
    garmentStore.subscribeSaveStatus,
    garmentStore.getSaveStatusSnapshot,
    garmentStore.getSaveStatusSnapshot
  );
}
