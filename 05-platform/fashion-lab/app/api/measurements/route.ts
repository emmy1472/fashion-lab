import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DEFAULT_MEASUREMENT_PROFILE } from '@/lib/production/defaults';
import { BodyMeasurementProfile } from '@/lib/contracts';

/**
 * GET /api/measurements
 * Retrieves measurement profiles for user, with default fallback
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: profiles, error } = await supabase
        .from('measurement_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (!error && profiles && profiles.length > 0) {
        return NextResponse.json({
          profiles: profiles.map((p) => ({
            id: p.id,
            name: p.name,
            gender: p.gender,
            unit: p.unit,
            ...p.landmarks,
            updatedAt: p.updated_at,
          })),
        });
      }
    }

    return NextResponse.json({
      profiles: [DEFAULT_MEASUREMENT_PROFILE],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json(
      { error: message, profiles: [DEFAULT_MEASUREMENT_PROFILE] },
      { status: 200 }
    );
  }
}

/**
 * POST /api/measurements
 * Creates or updates a measurement profile
 */
export async function POST(request: NextRequest) {
  try {
    const profile: BodyMeasurementProfile = await request.json();

    if (!profile.name || !profile.chestGirth || !profile.height) {
      return NextResponse.json(
        { error: 'Incomplete measurement landmarks provided' },
        { status: 400 }
      );
    }

    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { height, neckGirth, shoulderWidth, chestGirth, waistGirth, hipGirth, ...rest } = profile;
        const landmarks = { height, neckGirth, shoulderWidth, chestGirth, waistGirth, hipGirth, ...rest };

        const { data, error } = await supabase
          .from('measurement_profiles')
          .upsert({
            id: profile.id.startsWith('profile_') ? undefined : profile.id,
            user_id: user.id,
            name: profile.name,
            gender: profile.gender || 'unisex',
            unit: profile.unit || 'cm',
            landmarks,
          })
          .select()
          .single();

        if (error) throw error;
        return NextResponse.json({ profile: data, persisted: true }, { status: 201 });
      }
    } catch {
      // Supabase unconfigured / offline
    }

    return NextResponse.json({ profile, persisted: false }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
