import {
  GarmentDocument,
  GDM_SCHEMA_VERSION,
  GarmentCategory,
  GarmentDesignState,
  BodyMeasurementProfile,
  PatternPiece,
  SewingRelationship,
  FabricMaterial,
  CuttingPlan,
  GarmentComponent,
  AssemblyStep,
  FinishingSpecification,
  FitAnalysis,
} from './gdm';
import {
  DEFAULT_MEASUREMENT_PROFILE,
  STANDARD_COMPONENTS,
  STANDARD_ASSEMBLY_SEQUENCE,
  STANDARD_FINISHING,
} from '@/lib/production/defaults';

export interface GarmentProject {
  id: string;
  name: string;
  garmentCategory: GarmentCategory;
  bodyProfile: BodyMeasurementProfile;
  patternPieces: PatternPiece[];
  sewingRelationships: SewingRelationship[];
  fabric: FabricMaterial;
  cuttingPlan: CuttingPlan;
  components: GarmentComponent[];
  assemblySequence: AssemblyStep[];
  finishing: FinishingSpecification;
  fitAnalysis?: FitAnalysis;
  design?: GarmentDesignState;
  activeStage: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_DESIGN_STATE: GarmentDesignState = {
  garmentId: 'crewneck-tshirt',
  zoneColors: {
    body: '#1C2826',
    sleeves: '#1C2826',
    collar: '#111827',
  },
  patternSettings: {
    patternId: 'solid',
    scale: 75,
  },
  layersByView: {
    front: [
      {
        id: 'layer-brand',
        name: 'Brand Typography',
        type: 'text',
        text: 'FASHION-LAB',
        font: 'Montserrat',
        size: 22,
        x: 300,
        y: 355,
        scale: 1,
        rotation: 0,
        fill: '#FFFFFF',
        view: 'front',
        visible: true,
      },
    ],
    back: [],
  },
};

/**
 * Transforms a working GarmentProject into the canonical GDM schema for persistence
 */
export function projectToGDM(
  project: GarmentProject,
  designState?: GarmentDesignState
): GarmentDocument {
  return {
    schemaVersion: GDM_SCHEMA_VERSION,
    metadata: {
      id: project.id,
      name: project.name,
      garmentCategory: project.garmentCategory,
      status: 'draft',
      version: project.version,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    },
    bodyProfile: project.bodyProfile,
    design: designState || project.design || DEFAULT_DESIGN_STATE,
    patterns: {
      pieces: project.patternPieces,
      sewingRelationships: project.sewingRelationships,
      activeUnits: project.bodyProfile.unit || 'cm',
    },
    material: project.fabric,
    manufacturing: {
      cuttingPlan: project.cuttingPlan,
      components: project.components,
      assemblySequence: project.assemblySequence,
      finishing: project.finishing,
    },
    fit: project.fitAnalysis,
    activeStage: project.activeStage,
  };
}

/**
 * Reconstructs a runtime GarmentProject from a canonical GDM document
 */
export function gdmToProject(doc: GarmentDocument): GarmentProject {
  return {
    id: doc.metadata.id,
    name: doc.metadata.name,
    garmentCategory: doc.metadata.garmentCategory,
    // Fallbacks repair documents saved while the API produced incomplete starters.
    bodyProfile: doc.bodyProfile ?? DEFAULT_MEASUREMENT_PROFILE,
    patternPieces: doc.patterns.pieces,
    sewingRelationships: doc.patterns.sewingRelationships,
    fabric: doc.material,
    cuttingPlan: doc.manufacturing.cuttingPlan,
    components: doc.manufacturing.components ?? STANDARD_COMPONENTS,
    assemblySequence: doc.manufacturing.assemblySequence ?? STANDARD_ASSEMBLY_SEQUENCE,
    finishing: doc.manufacturing.finishing ?? STANDARD_FINISHING,
    fitAnalysis: doc.fit,
    design: doc.design,
    activeStage: doc.activeStage,
    version: doc.metadata.version,
    createdAt: doc.metadata.createdAt,
    updatedAt: doc.metadata.updatedAt,
  };
}
