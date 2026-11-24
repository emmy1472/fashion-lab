-- ==============================================================================
-- FASHION-LAB DATABASE MIGRATION (MODULE 2: GARMENT PRODUCTION & GDM DATA ARCHITECTURE)
-- ==============================================================================

-- 1. Helper Function for Automatic Timestamp Updating
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  garment_category TEXT NOT NULL CHECK (garment_category IN ('t-shirt', 'shirt', 'trouser', 'dress', 'jacket', 'hoodie')),
  status           TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'sample_approved', 'production_ready', 'archived')),
  version          INTEGER NOT NULL DEFAULT 1,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger for Projects updated_at
DROP TRIGGER IF EXISTS tr_projects_updated_at ON public.projects;
CREATE TRIGGER tr_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 3. Garment Designs Table (Stores Canonical GDM Document in JSONB)
CREATE TABLE IF NOT EXISTS public.garment_designs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  gdm_data      JSONB NOT NULL,
  thumbnail_url TEXT,
  version       INTEGER NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger for Garment Designs updated_at
DROP TRIGGER IF EXISTS tr_garment_designs_updated_at ON public.garment_designs;
CREATE TRIGGER tr_garment_designs_updated_at
  BEFORE UPDATE ON public.garment_designs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 4. Measurement Profiles Table
CREATE TABLE IF NOT EXISTS public.measurement_profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  gender        TEXT NOT NULL DEFAULT 'unisex' CHECK (gender IN ('unisex', 'female', 'male')),
  unit          TEXT NOT NULL DEFAULT 'cm' CHECK (unit IN ('cm', 'in')),
  landmarks     JSONB NOT NULL,
  is_default    BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger for Measurement Profiles updated_at
DROP TRIGGER IF EXISTS tr_measurement_profiles_updated_at ON public.measurement_profiles;
CREATE TRIGGER tr_measurement_profiles_updated_at
  BEFORE UPDATE ON public.measurement_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 5. Materials Catalog Table
CREATE TABLE IF NOT EXISTS public.materials_catalog (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  category      TEXT NOT NULL CHECK (category IN ('cotton', 'denim', 'silk', 'wool', 'polyester', 'linen', 'leather', 'velvet', 'chiffon', 'satin')),
  description   TEXT,
  weight_gsm    NUMERIC(6,2) NOT NULL,
  thickness_mm  NUMERIC(5,2) NOT NULL,
  xpbd_params   JSONB NOT NULL,
  pbr_params    JSONB NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_projects_owner ON public.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_category ON public.projects(garment_category);
CREATE INDEX IF NOT EXISTS idx_garment_designs_project ON public.garment_designs(project_id);
CREATE INDEX IF NOT EXISTS idx_measurement_profiles_user ON public.measurement_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_materials_category ON public.materials_catalog(category);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garment_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measurement_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials_catalog ENABLE ROW LEVEL SECURITY;

-- Projects Policies
CREATE POLICY "projects_owner_select" ON public.projects
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "projects_owner_insert" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "projects_owner_update" ON public.projects
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "projects_owner_delete" ON public.projects
  FOR DELETE USING (auth.uid() = owner_id);

-- Garment Designs Policies (Cascade access through project ownership)
CREATE POLICY "garment_designs_owner_select" ON public.garment_designs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = garment_designs.project_id
        AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "garment_designs_owner_insert" ON public.garment_designs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = garment_designs.project_id
        AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "garment_designs_owner_update" ON public.garment_designs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = garment_designs.project_id
        AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "garment_designs_owner_delete" ON public.garment_designs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = garment_designs.project_id
        AND projects.owner_id = auth.uid()
    )
  );

-- Measurement Profiles Policies
CREATE POLICY "measurements_owner_select" ON public.measurement_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "measurements_owner_insert" ON public.measurement_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "measurements_owner_update" ON public.measurement_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "measurements_owner_delete" ON public.measurement_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Materials Catalog Policies (Public read for all authenticated/active users, admin-only writes)
CREATE POLICY "materials_catalog_read" ON public.materials_catalog
  FOR SELECT USING (true);

-- ==============================================================================
-- SEED DATA: CANONICAL FABRICS & XPBD / PBR SPECIFICATIONS
-- ==============================================================================
INSERT INTO public.materials_catalog (id, name, category, description, weight_gsm, thickness_mm, xpbd_params, pbr_params)
VALUES
  (
    'cotton-jersey',
    'Combed Cotton Single Jersey',
    'cotton',
    '100% Ring-spun combed cotton. Soft hand feel with natural 2-way stretch, ideal for premium T-shirts and essential tops.',
    180.0,
    0.48,
    '{"stretchStiffness": 0.72, "bendingStiffness": 0.15, "shearStiffness": 0.35, "densityKgM3": 375, "friction": 0.45, "damping": 0.08}'::jsonb,
    '{"baseColor": "#0E6E55", "roughness": 0.76, "metallic": 0.0, "sheen": 0.12, "bumpScale": 0.0018, "textureScale": 1.0}'::jsonb
  ),
  (
    'cotton-heavy-french-terry',
    'Heavyweight French Terry',
    'cotton',
    '420 GSM structured loopback fleece. Substantial body, minimal stretch, sharp silhouettes for streetwear and premium hoodies.',
    420.0,
    1.25,
    '{"stretchStiffness": 0.88, "bendingStiffness": 0.52, "shearStiffness": 0.65, "densityKgM3": 336, "friction": 0.55, "damping": 0.14}'::jsonb,
    '{"baseColor": "#062D24", "roughness": 0.88, "metallic": 0.0, "sheen": 0.05, "bumpScale": 0.0035, "textureScale": 1.2}'::jsonb
  ),
  (
    'raw-selvedge-denim',
    '13.5 oz Raw Selvedge Denim',
    'denim',
    '100% Cotton 3x1 right-hand twill. Stiff, rigid drape that forms distinctive wear fades and creases under tension.',
    460.0,
    0.95,
    '{"stretchStiffness": 0.95, "bendingStiffness": 0.82, "shearStiffness": 0.85, "densityKgM3": 484, "friction": 0.62, "damping": 0.18}'::jsonb,
    '{"baseColor": "#1E293B", "roughness": 0.82, "metallic": 0.0, "sheen": 0.08, "bumpScale": 0.0042, "textureScale": 1.5}'::jsonb
  ),
  (
    'silk-charmeuse',
    'Mulberry Silk Charmeuse',
    'silk',
    '16 momme pure mulberry silk with a lustrous satin face and crepe reverse. Exceptionally fluid, cascading drape with delicate surface slip.',
    70.0,
    0.18,
    '{"stretchStiffness": 0.85, "bendingStiffness": 0.02, "shearStiffness": 0.12, "densityKgM3": 388, "friction": 0.22, "damping": 0.04}'::jsonb,
    '{"baseColor": "#E2E8F0", "roughness": 0.28, "metallic": 0.05, "sheen": 0.75, "bumpScale": 0.0006, "textureScale": 0.8}'::jsonb
  ),
  (
    'worsted-wool-suiting',
    'Super 120s Worsted Wool',
    'wool',
    'Fine 2-ply worsted wool yarn in a twill weave. Crisp tailoring resilience, natural spring-back crease recovery, and tailored drape.',
    260.0,
    0.58,
    '{"stretchStiffness": 0.90, "bendingStiffness": 0.45, "shearStiffness": 0.58, "densityKgM3": 448, "friction": 0.48, "damping": 0.12}'::jsonb,
    '{"baseColor": "#1E3A8A", "roughness": 0.68, "metallic": 0.0, "sheen": 0.18, "bumpScale": 0.0022, "textureScale": 1.0}'::jsonb
  ),
  (
    'performance-poly-spandex',
    '4-Way Stretch Performance Interlock',
    'polyester',
    '82% Micro-polyester / 18% Spandex. High elasticity, rapid recovery, moisture management, hugging bodily contours with mild compression.',
    220.0,
    0.52,
    '{"stretchStiffness": 0.35, "bendingStiffness": 0.08, "shearStiffness": 0.22, "densityKgM3": 423, "friction": 0.32, "damping": 0.06}'::jsonb,
    '{"baseColor": "#111827", "roughness": 0.45, "metallic": 0.0, "sheen": 0.30, "bumpScale": 0.0012, "textureScale": 1.0}'::jsonb
  ),
  (
    'slub-irish-linen',
    'Artisanal Slub Woven Linen',
    'linen',
    'Pure European flax with pronounced organic slub texture. Breathable, crisp hand that softens with washing, exhibiting sharp angular folds.',
    210.0,
    0.65,
    '{"stretchStiffness": 0.94, "bendingStiffness": 0.60, "shearStiffness": 0.70, "densityKgM3": 323, "friction": 0.58, "damping": 0.15}'::jsonb,
    '{"baseColor": "#E7E5E4", "roughness": 0.84, "metallic": 0.0, "sheen": 0.04, "bumpScale": 0.0038, "textureScale": 1.2}'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  weight_gsm = EXCLUDED.weight_gsm,
  thickness_mm = EXCLUDED.thickness_mm,
  xpbd_params = EXCLUDED.xpbd_params,
  pbr_params = EXCLUDED.pbr_params;
