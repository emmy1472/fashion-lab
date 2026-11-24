import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  projectToGDM,
  validateGDM,
  GarmentDocument,
  GDMValidationResult,
} from '@/lib/contracts';
import { draftTShirt } from '@/lib/production/drafting/tshirt';
import { computeCuttingPlan } from '@/lib/production/nesting';
import { DEFAULT_FABRIC } from '@/lib/production/fabrics';
import {
  DEFAULT_MEASUREMENT_PROFILE,
  STANDARD_COMPONENTS,
  STANDARD_ASSEMBLY_SEQUENCE,
  STANDARD_FINISHING,
} from '@/lib/production/defaults';

function getStarterGdm(projectId: string = 'proj_essential_tshirt'): GarmentDocument {
  const drafted = draftTShirt(DEFAULT_MEASUREMENT_PROFILE);
  const cutting = computeCuttingPlan(drafted.pieces);

  return projectToGDM({
    id: projectId,
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
 * GET /api/projects/[id]
 * Fetches single project and its latest GDM document
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    try {
      const supabase = await createClient();
      const { data: project, error: pError } = await supabase
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
            gdm_data,
            version,
            thumbnail_url,
            updated_at
          )
        `)
        .eq('id', id)
        .single();

      if (!pError && project) {
        const latestDesign = Array.isArray(project.garment_designs)
          ? project.garment_designs[0]
          : project.garment_designs;

        return NextResponse.json({
          project: {
            id: project.id,
            name: project.name,
            garment_category: project.garment_category,
            status: project.status,
            version: project.version,
            created_at: project.created_at,
            updated_at: project.updated_at,
          },
          gdm: latestDesign?.gdm_data || getStarterGdm(id),
          source: 'database',
        });
      }
    } catch {
      // Supabase unconfigured or offline
    }

    // Default starter fallback
    const starter = getStarterGdm(id);
    return NextResponse.json({
      project: {
        id: starter.metadata.id,
        name: starter.metadata.name,
        garment_category: starter.metadata.garmentCategory,
        status: starter.metadata.status,
        version: starter.metadata.version,
        created_at: starter.metadata.createdAt,
        updated_at: starter.metadata.updatedAt,
      },
      gdm: starter,
      source: 'starter_template',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PUT/PATCH /api/projects/[id]
 * Saves and validates updated GDM document and project metadata
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const gdm: GarmentDocument = body.gdm || body;
    if (!gdm.metadata) {
      return NextResponse.json(
        { error: 'Missing metadata in GDM document payload' },
        { status: 400 }
      );
    }

    // Ensure ID alignment
    gdm.metadata.id = id;
    gdm.metadata.updatedAt = new Date().toISOString();
    gdm.metadata.version = (gdm.metadata.version || 1) + 1;

    // Validate GDM integrity
    const validation: GDMValidationResult = validateGDM(gdm);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: 'GDM validation failed',
          details: validation.errors,
          warnings: validation.warnings,
        },
        { status: 400 }
      );
    }

    // Attempt database persistence
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Update project row
        await supabase
          .from('projects')
          .update({
            name: gdm.metadata.name,
            garment_category: gdm.metadata.garmentCategory,
            status: gdm.metadata.status || 'draft',
            version: gdm.metadata.version,
            updated_at: gdm.metadata.updatedAt,
          })
          .eq('id', id);

        // Update or insert latest design row
        const { data: existingDesigns } = await supabase
          .from('garment_designs')
          .select('id')
          .eq('project_id', id)
          .limit(1);

        if (existingDesigns && existingDesigns.length > 0) {
          await supabase
            .from('garment_designs')
            .update({
              gdm_data: gdm,
              version: gdm.metadata.version,
              updated_at: gdm.metadata.updatedAt,
            })
            .eq('id', existingDesigns[0].id);
        } else {
          await supabase
            .from('garment_designs')
            .insert({
              project_id: id,
              gdm_data: gdm,
              version: gdm.metadata.version,
            });
        }

        return NextResponse.json({
          success: true,
          id,
          version: gdm.metadata.version,
          updatedAt: gdm.metadata.updatedAt,
          persisted: true,
          warnings: validation.warnings,
        });
      }
    } catch {
      // Supabase unconfigured / offline
    }

    // Offline / client-cached response
    return NextResponse.json({
      success: true,
      id,
      version: gdm.metadata.version,
      updatedAt: gdm.metadata.updatedAt,
      persisted: false,
      warnings: validation.warnings,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const PATCH = PUT;

/**
 * DELETE /api/projects/[id]
 * Deletes a project and its associated designs
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    try {
      const supabase = await createClient();
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch {
      // If offline, succeed locally
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
