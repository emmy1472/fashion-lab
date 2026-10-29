# 05 - Master Architecture & Database Specification

**Platform Project:** FASHION-LAB  
**Date:** October 2026  
**Auditor:** Principal Software Architect & Senior Full-Stack Engineer  
**Workspace Root:** `c:\fashion-lab`  
**Execution Context:** Unified System Architecture, Security & Database Planning

---

## 1. Vision & Technical Philosophy

Fashion-Lab is an all-in-one, enterprise-grade fashion technology platform designed for fashion designers, apparel brands, bespoke tailors, patternmakers, stylists, models, and clients. It unifies interactive 2D garment design, made-to-measure pattern generation, 3D garment previewing, talent discovery, realtime project collaboration, and end-to-end production workflows.

### Why Not Django?
- Per user constraint, Django is explicitly excluded.
- Django would force an unnecessary multi-language divide (Python backend vs. TypeScript frontend), introduce overhead for realtime WebSockets (Django Channels), and bypass Supabase's mature native PostgreSQL Row Level Security (RLS) and Realtime engines.

### Why Next.js 16 + React 19 + TypeScript + Tailwind v4 + shadcn/ui + Supabase?
- **Unified TypeScript Full-Stack:** Shared data contracts between the SVG studio renderer, FreeSewing pattern engine, Supabase database schema, and frontend React components.
- **Next.js 16 App Router:** Server Components (zero client JS for portfolio/read-heavy pages), Streaming SSR, Edge Middleware for auth gating, and TypeScript Route Handlers for authoritative APIs.
- **Tailwind CSS v4 + shadcn/ui:** Modern, accessible, themeable UI primitives (Radix UI-based) replacing ad-hoc CSS with polished enterprise components.
- **Supabase (PostgreSQL / RLS / Auth / Storage / Realtime):** Battle-tested infrastructure already validated by feysefit's 60+ SQL patches. Row Level Security enforces data isolation and anti-poaching at the relational engine level.

---

## 2. End-to-End System Topology

```
+-------------------------------------------------------------------------+
|                        Fashion-Lab Platform (Next.js 16)                 |
|                                                                         |
|  (public) Pages         (auth) Flows             (platform) Studio      |
|  - Landing Portal       - Supabase SSR Auth      - 2D SVG Studio Canvas |
|  - Talent Marketplace   - MFA (TOTP AAL2)        - Forge Raster Sub-Ed  |
|  - Public Portfolios    - Cloudflare Turnstile   - Three.js 3D Viewport |
|  (React Server Comps)   (HttpOnly Cookies)       (useReducer + Autosave)|
|                                                                         |
|             API Layer: Next.js Route Handlers + Edge Middleware         |
|             Security: Rate Limiting + SSRF Guards + Byte Checker        |
+------------------------------------+------------------------------------+
                                     |
        +----------------------------+----------------------------+
        |                            |                            |
+-------v--------+          +--------v-------+          +---------v-------+
| Supabase Auth  |          | Supabase Postg |          | Supabase Store  |
| - SSR Sessions |          | - 100% RLS     |          | - Private (.zip)|
| - Admin MFA    |          | - Anti-Poach   |          | - Public (web)  |
+----------------+          +--------+-------+          +-----------------+
                                     |
                            +--------v-------+
                            | Supabase Real  |
                            | - Chat WebSock |
                            | - Project Pres |
                            +----------------+
```

---

## 3. Frontend Architecture

### 3.1 App Router Route Layout
- `(public)/`: Marketing landing, talent directory, designer profiles (Server Components for fast SEO & LCP).
- `(auth)/`: Login, registration with role selection, email verification, password resets.
- `(platform)/`: Authenticated workspace:
  * `/dashboard`: Dynamic dashboard responding to current role (designer, tailor, brand, customer, admin).
  * `/studio/[id]`: Interactive design studio with full 2D SVG canvas and Forge graphics editor.
  * `/projects/[id]`: Project lifecycle tracker (brief -> design -> approval -> production -> delivery).
  * `/marketplace`: Verified talent discovery and commission requests.
  * `/messages`: Threaded real-time client-designer communication.
  * `/measurements`: Anthropometric body profile editor.
- `(admin)/`: Platform administration, marketplace verification, security audit viewer, user bans.

### 3.2 Studio Workspace 3-Rail Architecture
1. **Left Catalog Rail:** Garment silhouette selector (31+ styles), vector graphic library (82 emblems), user logo uploader, athletic fonts (OFL 1.1), and procedural fill patterns (24 fills).
2. **Central Stage:** High-DPI physical-inch scaled SVG garment canvas. Features Front/Back view toggle, drag-and-drop artwork positioning, scale/rotation gizmos, zone color fills, and knit/mesh overlays.
3. **Right Properties Rail:** Zone colorway picker, pattern density/scale controls, artwork layer manager, text typography tools, and export triggers (300 DPI PNG, SVG, PDF, ZIP).
4. **Forge Raster Sub-Editor:** Built-in modal canvas editor supporting 16 blend modes, layer stacks, and image adjustments for custom badge creation.

### 3.3 Design State & Persistence Hook
- `useDesignState`: React 19 `useReducer` managing garment selection, zone colors, artwork layers, roster table, and 50 levels of undo/redo.
- `useDesignPersistence`: Debounced 30-second autosave serializing `.project.json` directly to Supabase Storage `design-files` bucket and updating metadata in PostgreSQL.

---

## 4. Backend & Security Architecture

### 4.1 Authentication & Session Management
- **Supabase SSR:** Authentication state is stored in encrypted, HttpOnly cookies managed by `@supabase/ssr`. Zero client-side JWT persistence in localStorage.
- **Session Binding Guard:** Every incoming request passes through `session-binding.ts` in Next.js Edge Middleware, verifying the user IP address and User-Agent fingerprint.
- **MFA Enforcement:** Administrative actions and financial modifications require TOTP Authenticator enrollment enforcing Supabase AAL2 (Authenticator Assurance Level 2).

### 4.2 Row Level Security & Anti-Poaching
- Every single table in the database has `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`.
- **Anti-Poaching Isolation:** Designers can only query customer records if an active, mutual record exists in `designer_customer_relationships`. Unsolicited client scraping or poaching is blocked directly by PostgreSQL RLS filters.
- **Designer Private Details:** Banking, phone numbers, and physical residential addresses are stored in `designer_private_details` with exclusive owner-only read policies.

### 4.3 Upload Pipeline & Media Sanitization
- File uploads are validated before disk writing: magic numbers are checked (`upload-bytes.ts`) to prevent polyglot malware.
- Raster image uploads pass through **Sharp** on the server to strip EXIF GPS location tags and sanitize image buffers before re-encoding to WebP.

---

## 5. Evaluation of the 12 Core Application Modules

| Module Number & Name | Architectural Strategy | Codebase Source & Reuse Strategy |
|---|---|---|
| **01. Authentication & Onboarding** | **Direct Reuse & Expand** | Port `feysefit`'s Supabase SSR auth, Turnstile CAPTCHA, and multi-role onboarding flows. Add Tailor, Patternmaker, Brand roles. |
| **02. Designer & Brand Profiles** | **Direct Reuse & Expand** | Port `feysefit`'s `designer_profiles` & service layer. Add brand entity models with multi-seat teams. |
| **03. Fashion Design Studio** | **Direct Adaptation** | Port `cloPRO`'s SVG rendering pipeline, parametric geometries, and Forge editor into React 19 Client Components. |
| **04. Garment Templates & Artwork** | **Direct Reuse** | Migrate `cloPRO`'s 31 garment models, 24 fill pattern generators, and 82 emblem graphics into typed TypeScript catalogs. |
| **05. Projects, Collections & Revisions** | **Direct Reuse & Expand** | Port `feysefit`'s project management tables (`projects`, `project_items`). Add `design_revisions` table for versioned snapshots. |
| **06. Measurement Profiles & CAD Drafting**| **Hybrid NPM + Reuse** | Store measurements in `feysefit`'s measurement schema; execute `@freesewing/core` via Next.js Route Handlers to generate SVG patterns. |
| **07. 3D Visualization** | **Re-architect from Concept** | Re-implement `LetDesign`'s React Three Fiber viewport pattern using clean CC0/MIT 3D GLB garment models. |
| **08. Portfolios & Discovery** | **Direct Reuse & Polish** | Port `feysefit`'s marketplace discovery, geo-location filters, and category browser with `shadcn/ui` cards. |
| **09. Collaboration & Messaging** | **Direct Reuse** | Port `feysefit`'s threaded messaging, attachment handling, and Supabase Realtime WebSocket broadcast channels. |
| **10. Client Briefs & Approvals** | **Direct Reuse** | Port `feysefit`'s marketplace enquiry workflow, change request loops, and client digital sign-offs. |
| **11. Production Specs & Orders** | **Hybrid Build** | Adapt `cloPRO`'s PDF spec sheet generator combined with `medo`'s task and inventory order workflow concepts. |
| **12. Notifications & Admin** | **Direct Reuse** | Port `feysefit`'s notification dispatchers, Resend email hooks, admin MFA, and security incident monitors. |

---

## 6. Normalized Database & Storage Planning

### 6.1 Users and Profiles

```sql
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      TEXT UNIQUE NOT NULL CHECK (username ~ '^[a-zA-Z0-9_]{3,30}$'),
  display_name  TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN (
                  'designer','tailor','patternmaker','stylist','model',
                  'brand','client','admin')),
  avatar_url    TEXT,
  bio           TEXT,
  website_url   TEXT,
  location      TEXT,
  country_code  CHAR(2),
  onboarding_status TEXT NOT NULL DEFAULT 'pending',
  account_status    TEXT NOT NULL DEFAULT 'active'
                    CHECK (account_status IN ('active','suspended','banned')),
  terms_accepted_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_preferences (
  user_id             UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  measurement_unit    TEXT NOT NULL DEFAULT 'cm' CHECK (measurement_unit IN ('cm','in')),
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  push_alerts         BOOLEAN NOT NULL DEFAULT false,
  profile_visibility  TEXT NOT NULL DEFAULT 'public'
                      CHECK (profile_visibility IN ('public','private','marketplace')),
  two_factor_enabled  BOOLEAN NOT NULL DEFAULT false,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.designer_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name    TEXT NOT NULL,
  specialty        TEXT[],
  price_range_min  INTEGER,
  price_range_max  INTEGER,
  years_experience SMALLINT,
  offers_in_person BOOLEAN NOT NULL DEFAULT false,
  service_areas    TEXT[],
  appointment_slot_minutes INTEGER NOT NULL DEFAULT 60,
  offered_meeting_modes    TEXT[] NOT NULL DEFAULT '{}'::text[],
  rating           NUMERIC(3,2) NOT NULL DEFAULT 0,
  review_count     INTEGER NOT NULL DEFAULT 0,
  marketplace_live BOOLEAN NOT NULL DEFAULT false,
  admin_approved_at TIMESTAMPTZ,
  cover_image      TEXT,
  tagline          TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.brand_profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  brand_name    TEXT NOT NULL,
  logo_url      TEXT,
  description   TEXT,
  established   SMALLINT,
  website_url   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 6.2 Projects and Memberships

```sql
CREATE TABLE public.projects (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_code     TEXT UNIQUE NOT NULL,
  title            TEXT NOT NULL,
  description      TEXT,
  owner_id         UUID NOT NULL REFERENCES public.profiles(id),
  client_id        UUID REFERENCES public.profiles(id),
  outfit_type      TEXT,
  deadline         DATE,
  budget_cents     INTEGER,
  currency_code    CHAR(3) NOT NULL DEFAULT 'GBP',
  status           TEXT NOT NULL DEFAULT 'brief'
                   CHECK (status IN (
                     'brief','designing','review','approved',
                     'production','delivered','archived','cancelled')),
  visibility       TEXT NOT NULL DEFAULT 'private'
                   CHECK (visibility IN ('private','shared_link','public')),
  share_token      TEXT UNIQUE,
  internal_notes   TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.project_members (
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('owner','collaborator','viewer','client')),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  PRIMARY KEY (project_id, user_id)
);
```

### 6.3 Designs, Revisions, and Assets

```sql
CREATE TABLE public.designs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  owner_id        UUID NOT NULL REFERENCES public.profiles(id),
  title           TEXT NOT NULL DEFAULT 'Untitled Design',
  garment_type    TEXT NOT NULL,
  description     TEXT,
  is_public       BOOLEAN NOT NULL DEFAULT false,
  thumbnail_url   TEXT,
  status          TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','shared','approved','archived')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.design_revisions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id       UUID NOT NULL REFERENCES public.designs(id) ON DELETE CASCADE,
  revision_number INTEGER NOT NULL,
  label           TEXT,
  state_url       TEXT NOT NULL, -- Supabase Storage path to .clopro.json
  thumbnail_url   TEXT,
  created_by      UUID NOT NULL REFERENCES public.profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (design_id, revision_number)
);

CREATE TABLE public.design_assets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL REFERENCES public.profiles(id),
  design_id   UUID REFERENCES public.designs(id) ON DELETE SET NULL,
  asset_type  TEXT NOT NULL CHECK (asset_type IN ('logo','image','pattern','font')),
  filename    TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type   TEXT NOT NULL,
  size_bytes  INTEGER NOT NULL,
  width_px    INTEGER,
  height_px   INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.design_exports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id   UUID NOT NULL REFERENCES public.designs(id) ON DELETE CASCADE,
  revision_id UUID REFERENCES public.design_revisions(id),
  export_type TEXT NOT NULL CHECK (export_type IN ('png_mockup','png_artwork','svg','pdf','zip','spec_pdf','json')),
  storage_path TEXT NOT NULL,
  size_bytes  INTEGER NOT NULL,
  created_by  UUID NOT NULL REFERENCES public.profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 6.4 Measurements and Patterns

```sql
CREATE TABLE public.measurement_profiles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label               TEXT NOT NULL DEFAULT 'My Measurements',
  unit                TEXT NOT NULL DEFAULT 'cm' CHECK (unit IN ('cm','in')),
  head                INTEGER,
  neck                INTEGER,
  chest               INTEGER,
  bust                INTEGER,
  underbust           INTEGER,
  waist               INTEGER,
  hips                INTEGER,
  seat                INTEGER,
  waist_to_seat       INTEGER,
  waist_to_hip        INTEGER,
  waist_to_floor      INTEGER,
  inseam              INTEGER,
  outseam             INTEGER,
  thigh               INTEGER,
  knee                INTEGER,
  ankle               INTEGER,
  shoulder            INTEGER,
  shoulder_to_elbow   INTEGER,
  shoulder_to_wrist   INTEGER,
  biceps              INTEGER,
  wrist               INTEGER,
  arm_length          INTEGER,
  shared_with_designers TEXT[] DEFAULT '{}'::text[],
  is_verified         BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.patterns (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id          UUID NOT NULL REFERENCES public.profiles(id),
  design_id         UUID REFERENCES public.designs(id) ON DELETE SET NULL,
  measurement_id    UUID REFERENCES public.measurement_profiles(id),
  title             TEXT NOT NULL,
  garment_type      TEXT NOT NULL,
  source            TEXT NOT NULL CHECK (source IN ('freesewing','seamly2d','custom','uploaded')),
  freesewing_design TEXT,
  option_values     JSONB NOT NULL DEFAULT '{}',
  svg_url           TEXT,
  pdf_url           TEXT,
  dxf_url           TEXT,
  is_public         BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 6.5 Production Tasks and Orders

```sql
CREATE TABLE public.production_orders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES public.projects(id),
  owner_id      UUID NOT NULL REFERENCES public.profiles(id),
  order_number  TEXT UNIQUE NOT NULL,
  status        TEXT NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft','confirmed','in_production','ready','delivered')),
  total_items   INTEGER NOT NULL DEFAULT 0,
  notes         TEXT,
  due_date      DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.production_tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID NOT NULL REFERENCES public.production_orders(id) ON DELETE CASCADE,
  assigned_to  UUID REFERENCES public.profiles(id),
  title        TEXT NOT NULL,
  task_type    TEXT CHECK (task_type IN ('cut','sew','press','finish','qa','deliver')),
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','in_progress','done','blocked')),
  due_date     DATE,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 6.6 Messaging and Notifications

```sql
CREATE TABLE public.conversations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID REFERENCES public.projects(id),
  subject      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.conversation_participants (
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.profiles(id),
  last_read_at    TIMESTAMPTZ,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE public.messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES public.profiles(id),
  body            TEXT NOT NULL,
  attachment_url  TEXT,
  attachment_type TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT,
  link_url    TEXT,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 6.7 Representative Row Level Security (RLS) Policies

```sql
-- Profiles: Active profiles readable by all; updates restricted to row owner
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_public_read" ON public.profiles
  FOR SELECT USING (account_status = 'active');
CREATE POLICY "profiles_owner_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Designs: Owner full access; public designs readable by anyone
ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "designs_owner_manage" ON public.designs
  USING (owner_id = auth.uid());
CREATE POLICY "designs_public_read" ON public.designs
  FOR SELECT USING (is_public = true);

-- Revisions: Access inherited via parent design ownership
ALTER TABLE public.design_revisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "revisions_via_design" ON public.design_revisions
  USING (EXISTS (
    SELECT 1 FROM public.designs d
    WHERE d.id = design_id AND d.owner_id = auth.uid()
  ));

-- Measurements: Strict privacy; shared only if designer ID is in shared_with_designers
ALTER TABLE public.measurement_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "measurements_owner_all" ON public.measurement_profiles
  USING (user_id = auth.uid());
CREATE POLICY "measurements_shared_select" ON public.measurement_profiles
  FOR SELECT USING (auth.uid()::text = ANY(shared_with_designers));

-- Messages: Confined strictly to conversation participants
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_participants_only" ON public.messages
  USING (EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = messages.conversation_id
    AND cp.user_id = auth.uid()
  ));
```

### 6.8 Supabase Storage Architecture

| Bucket Name | Privacy Level | Allowed File Types | Max Size | Path Template |
|---|---|---|---|---|
| `design-files` | **Private** | `application/json` | 10 MB | `{user_id}/{design_id}/v{rev}.project.json` |
| `design-exports` | **Private** (Signed URLs) | `image/png`, `image/svg+xml`, `application/pdf`, `application/zip` | 50 MB | `{user_id}/{design_id}/{export_id}.{ext}` |
| `design-assets` | **Private** | `image/png`, `image/jpeg`, `image/webp`, `image/svg+xml` | 15 MB | `{user_id}/assets/{asset_id}/{filename}` |
| `avatars` | **Public** | `image/jpeg`, `image/webp`, `image/png` | 2 MB | `avatars/{user_id}.webp` |
| `pattern-files` | **Private** | `image/svg+xml`, `application/pdf`, `application/dxf` | 20 MB | `{user_id}/patterns/{pattern_id}.svg` |
| `attachments` | **Private** | `image/*`, `application/pdf` | 25 MB | `messages/{conversation_id}/{filename}` |

### 6.9 Realtime & Scalability Planning
- **Supabase Realtime Publications:** Enabled for `messages`, `conversations`, `notifications`, and `projects` tables.
- **Micro-caching SVG Patterns:** Large FreeSewing vector patterns are drafted once on the server and cached in Supabase Storage with ETag headers, avoiding CPU-heavy recalculation on repeat visits.
- **Thumbnail Generation:** Server-side Route Handler utilizes Sharp to generate 400x300 WebP preview thumbnails on design save.
