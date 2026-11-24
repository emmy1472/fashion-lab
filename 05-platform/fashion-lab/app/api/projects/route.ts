import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { projectToGDM, validateGDM, GarmentDocument } from '@/lib/contracts';
import { draftTShirt } from '@/lib/production/drafting/tshirt';
import { computeCuttingPlan } from '@/lib/production/nesting';
import { DEFAULT_FABRIC } from '@/lib/production/fabrics';
import {
  DEFAULT_MEASUREMENT_PROFILE,
  STANDARD_COMPONENTS,
  STANDARD_ASSEMBLY_SEQUENCE,
  STANDARD_FINISHING,
} from '@/lib/production/defaults';

// Default in-memory project for offline / placeholder / development sessions
function getStarterProject(): GarmentDocument {
  const drafted = draftTShirt(DEFAULT_MEASUREMENT_PROFILE);
  const cutting = computeCuttingPlan(drafted.pieces);

  return projectToGDM({
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
    activeStage: 2,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

/**
 * GET /api/projects
 * Lists all projects owned by the authenticated user, or returns starter projects if offline
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: projects, error } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          garment_category,
          status,
          version,
          created_at,
          updated_at,
          garment_designs (
            id,
            version,
            thumbnail_url
          )
        `)
        .eq('owner_id', user.id)
        .order('updated_at', { ascending: false });

      if (!error && projects && projects.length > 0) {
        return NextResponse.json({
          projects,
          source: 'database',
        });
      }
    }

    // Fallback: Starter project for guest/development mode
    const starterGdm = getStarterProject();
    return NextResponse.json({
      projects: [
        {
          id: starterGdm.metadata.id,
          name: starterGdm.metadata.name,
          garment_category: starterGdm.metadata.garmentCategory,
          status: starterGdm.metadata.status,
          version: starterGdm.metadata.version,
          created_at: starterGdm.metadata.createdAt,
          updated_at: starterGdm.metadata.updatedAt,
          garment_designs: [
            {
              id: 'design_default_1',
              version: starterGdm.metadata.version,
              thumbnail_url: null,
            },
          ],
        },
      ],
      source: 'starter_template',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json(
      { error: message, projects: [getStarterProject()] },
      { status: 200 } // Graceful degraded response
    );
  }
}

/**
 * POST /api/projects
 * Creates a new garment project with initial pattern geometry and canonical GDM document
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = body.name || 'New Bespoke Garment';
    const garmentCategory = body.garmentCategory || 't-shirt';
    const measurementProfile = body.bodyProfile || DEFAULT_MEASUREMENT_PROFILE;

    const projectId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const drafted = draftTShirt(measurementProfile);
    const cutting = computeCuttingPlan(drafted.pieces);

    const initialGdm = projectToGDM({
      id: projectId,
      name,
      garmentCategory,
      bodyProfile: measurementProfile,
      patternPieces: drafted.pieces,
      sewingRelationships: drafted.sewingRelationships,
      fabric: DEFAULT_FABRIC,
      cuttingPlan: cutting,
      components: STANDARD_COMPONENTS,
      assemblySequence: STANDARD_ASSEMBLY_SEQUENCE,
      finishing: STANDARD_FINISHING,
      activeStage: 1,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const validation = validateGDM(initialGdm);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'GDM validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // Attempt database persistence if Supabase credentials and session exist
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: projectRow, error: pError } = await supabase
          .from('projects')
          .insert({
            name,
            garment_category: garmentCategory,
            owner_id: user.id,
            status: 'draft',
            version: 1,
          })
          .select()
          .single();

        if (pError) throw pError;

        const { error: dError } = await supabase
          .from('garment_designs')
          .insert({
            project_id: projectRow.id,
            gdm_data: initialGdm,
            version: 1,
          });

        if (dError) throw dError;

        initialGdm.metadata.id = projectRow.id;
        return NextResponse.json(
          { project: projectRow, gdm: initialGdm, persisted: true },
          { status: 201 }
        );
      }
    } catch {
      // Supabase unconfigured or offline - proceed with valid client response
    }

    return NextResponse.json(
      {
        project: {
          id: projectId,
          name,
          garment_category: garmentCategory,
          status: 'draft',
          version: 1,
          created_at: initialGdm.metadata.createdAt,
          updated_at: initialGdm.metadata.updatedAt,
        },
        gdm: initialGdm,
        persisted: false,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
