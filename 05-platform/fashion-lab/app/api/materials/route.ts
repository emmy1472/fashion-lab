import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { FABRIC_LIBRARY } from '@/lib/production/fabrics';

/**
 * GET /api/materials
 * Returns the catalog of physical materials & XPBD / PBR parameters
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: materials, error } = await supabase
      .from('materials_catalog')
      .select('*')
      .order('name');

    if (!error && materials && materials.length > 0) {
      const formatted = materials.map((m) => ({
        id: m.id,
        name: m.name,
        category: m.category,
        description: m.description || '',
        weightGSM: Number(m.weight_gsm),
        thicknessMm: Number(m.thickness_mm),
        ...m.xpbd_params,
        ...m.pbr_params,
      }));

      return NextResponse.json({
        materials: formatted,
        source: 'database',
      });
    }

    return NextResponse.json({
      materials: Object.values(FABRIC_LIBRARY),
      source: 'fallback_catalog',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json(
      {
        materials: Object.values(FABRIC_LIBRARY),
        source: 'fallback_catalog',
        error: message,
      },
      { status: 200 }
    );
  }
}
