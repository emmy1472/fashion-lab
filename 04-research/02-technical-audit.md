# Technical Audit

> **Status:** Phase Two complete — based on direct source file inspection.
> **Date:** 2026-10-16
> **Legend:** ✅ Verified in source | 📄 Documented claim | ⚠️ Unverified assumption

---

## A. cloPRO — Technical Deep Dive

### Architecture
cloPRO is a single-page application built entirely in **vanilla JavaScript ES modules** with no framework, no build step, and no external runtime dependencies. The architecture is clean and well-separated:

| Module | Role | Size |
|---|---|---|
| `state.js` | Project schema, undo/redo stack (localStorage), gallery | 12 KB |
| `render.js` | Pure function: project state → SVG DOM | 14 KB |
| `export.js` | PNG/SVG rasterisation, ZIP writer, PDF writer | 26 KB |
| `data/garments.js` | 31 parametric garment definitions, print areas | 37 KB |
| `data/patterns.js` | 24 fill styles as SVG pattern generators | 22 KB |
| `data/graphics.js` | 82 artwork pieces (procedural + authored) | 34 KB |
| `data/library.js` | Palettes, typefaces, size charts | 16 KB |
| `ui/studio.js` | Canvas interaction, colour picker, artwork placement | 36 KB |
| `ui/forge.js` | Layered raster editor (Canvas 2D API) | 39 KB |

### Garment rendering approach
✅ All garments are rendered as **SVG paths** generated from parametric definitions in `garments.js`. Each garment has named "zones" (body, sleeves, collar, etc.) that map to fill areas. "Print areas" are SVG rectangles anchored to physical inches (1 in = 21.5 canvas units). This means the coordinate system is meaningful for print production.

### Design state schema (verified in `state.js`)
The project state is a plain JavaScript object serialised to JSON:
- `garment`: garment ID, view (front/back), colour map per zone, fill styles per zone
- `artwork`: array of layers, each with position, scale, rotation, content type, z-index
- `team`: roster array (name, number, size, quantity)
- `meta`: project name, palette, timestamps
- Undo/redo: array of state snapshots (full history)

### Export capabilities ✅
- **PNG mockup** (1800×2100) via `OffscreenCanvas` or `canvas.toBlob()`
- **Transparent 300 DPI PNG** artwork per print area
- **SVG** with Google Fonts base64-embedded as `@font-face`
- **Spec sheet PDF** (client-side, dependency-free PDF writer)
- **Roster CSV**
- **`.clopro.json`** — editable project file
- **ZIP** — all of the above in one archive (dependency-free ZIP writer)
- Decoration method colour count validation

### What would need to change for Next.js integration
1. **State persistence**: Replace localStorage with server-side API calls (Supabase storage for `.clopro.json`, PostgreSQL for project metadata). The state schema is clean JSON — straightforward.
2. **Module system**: Convert from ES modules with bare `import` statements to npm package. No framework-specific code exists; the conversion is mechanical.
3. **Font loading**: Currently loads Google Fonts via a `<link>` tag. In Next.js, switch to `next/font` or embed fonts differently.
4. **Canvas rendering**: The SVG renderer uses the DOM directly. Wrapping in a React component requires a `useEffect` + `useRef` pattern to mount the SVG into a container div. The render function itself does not need to change.
5. **User accounts and cloud persistence**: Add an API layer. The state schema (`.clopro.json`) is the serialisation format — store it in Supabase Storage; store project metadata in PostgreSQL.
6. **Multiple projects**: Already handled by the localStorage gallery. Replace with a database-backed project list.

**Assessment**: cloPRO is the highest-value reuse target. Its garment engine, fill system, artwork placement, Forge editor, and export pipeline are all production-quality. The migration path to React/Next.js is clear and relatively low risk.

---

## B. FreeSewing — Technical Deep Dive

### Architecture
FreeSewing v4 is a large **npm workspaces monorepo** managed by Lerna + Nx. The core library (`@freesewing/core`) is a pure JavaScript/TypeScript **parametric pattern generator** that runs in both Node.js and the browser.

### Pattern generation API (verified in `packages/core/src/`)
The core API is object-oriented:
- **`Design`** — defines a garment pattern with parts and options
- **`Pattern`** — instances a Design with specific measurements and option values; calls `draft()` to generate geometry
- **`Part`** — individual pattern piece with its own coordinate space
- **`Point`** — 2D point with named attributes
- **`Path`** — Bezier-based path (move, line, curve, close)
- **`Snippet`** — reusable mark/annotation
- **`Store`** — shared data store across parts
- **`Svg`** — SVG renderer for the drafted pattern

### Body measurements (verified in `packages/models/`)
Standard measurement set defined in `measurements.yaml`. Includes: head, neck, chest, waist, seat, hips, inseam, outseam, shoulder, sleeve, etc. All measurements are taken on the body (not garment ease) and passed as millimetres.

### Pattern customisation
Each Design exposes typed **options** (numerical ranges, booleans, enums) that allow non-technical customisation of pattern features (ease, neckline style, sleeve length, etc.). Options are defined per design in each design package.

### Export formats ✅
- **SVG** — primary output; clean, semantic SVG with seam allowances, grain lines, notches
- **PDF** — via browser print or server-side rendering
- Tiled PDF for home printing
- **DXF** — via community plugins (📄 documented but not verified in this clone)

### React integration (verified in `packages/react/`)
The `@freesewing/react` package provides:
- React components for pattern rendering (`Pattern` component)
- Hooks: `useDesign`, `useAccount`, `useBackend`, `useControl`, `useFilter`, `useStateObject`
- Editor component (the interactive studio)
- Full UI component library: Account, Admin, Collection, Control, DiffViewer, Editor, Icon, Input, Layout, Markdown, Modal, Pattern, Profile, SignIn, SignUp, Tab, Table, etc.

### Next.js compatibility ✅
`@freesewing/core` is a pure ESM package with no DOM dependencies. It can be imported in Next.js Server Components or Client Components. The `@freesewing/react` package is client-side only (needs `'use client'`). The full monorepo site runs on Next.js (confirmed in `sites/org/`).

### Licensing
**MIT** — commercial use permitted, no source disclosure required, attribution in copyright notice.

### Key integration considerations
- The library is published to npm; you can install individual packages (`@freesewing/core`, `@freesewing/breanna`, etc.) without cloning the monorepo
- Body measurements must be collected from the user and validated before pattern generation
- Generated SVGs are print-ready but not 3D-rendered
- Pattern generation is CPU-light (milliseconds); can run client-side in the browser

---

## C. OpenSew-2 and Seamly2D — Technical Deep Dive

### opensew-2 (Python / Blender)

**Integration constraints:**
- Requires **Blender 5.2** installed on the user's machine — cannot run in a browser
- All code is Python scripts using Blender's `bpy` module — not importable in Node.js
- The cloth simulation runs Blender's physics engine — cannot be replicated in WebAssembly without porting the entire physics solver
- Output: Blender `.blend` files and rendered images

**What can be extracted:**
- The **measurement algorithm** (`avatar.py`) — the logic for reading body landmarks from a mesh (narrowest cross-section = waist, fullest over seat = hip, etc.) is well-documented and could be re-implemented in WebGL or as a standalone service if a 3D avatar is available in the browser
- The **drafting formulas** (`build.py`) — the parametric block geometry (neckline solved to neck girth, armhole to biceps, sleeve cap bisection) is pure geometry that could be ported to TypeScript
- The **garment type definitions** (`library.py`) — the nine garment blocks and outfit presets are data that could inform a pattern library API

**Practical integration path:**
Do not attempt to embed opensew-2 in the web application. The practical options are:
1. **File exchange**: Users export `.sm2d` or FreeSewing SVG from a desktop tool and upload to the platform
2. **Blender subprocess** (server-side, advanced): Run Blender headlessly on a server to generate draped garment renders for specific measurement inputs — expensive but possible
3. **Algorithm extraction**: Port the drafting math to TypeScript for browser-side pattern generation (significant effort, ~3-6 weeks)

**License**: GPL v3 — any derivative or combined work distributed to users must be open-source under GPL v3. This is a significant constraint for a commercial platform that reuses this code directly.

### seamly2d (C++ / Qt)

**Integration constraints:**
- C++ desktop application requiring Qt SDK compilation
- No API, no CLI mode, no headless operation
- Cannot run in a browser; cannot be called from Node.js without a subprocess wrapper
- The pattern file format (`.sm2d`, XML) is well-structured and could be parsed

**What can be extracted:**
- **File format**: `.sm2d` XML pattern files could be parsed server-side (Node.js XML parser) to import patterns into the platform
- **Measurement format**: `.smm` files are simple XML measurement profiles that could be imported
- **DXF export**: Seamly2D exports DXF files suitable for CNC cutting machines — the platform could accept DXF uploads

**Practical integration path:**
Seamly2D should remain a standalone desktop tool. Integrate through:
1. **File import**: Accept `.sm2d` / `.smm` / DXF file uploads in the platform
2. **Export link**: Provide a download of a user's pattern as a format compatible with Seamly2D

**License**: GPL v3 — same constraint as opensew-2. Do not embed C++ code in a commercial platform.

---

## D. FeyseFit, LetDesign, and Medo — Technical Deep Dive

### feysefit

#### Authentication ✅
- Supabase Auth with SSR (`@supabase/ssr`) — cookies managed server-side
- MFA support (`mfaService.ts`, `admin-mfa.ts`)
- Email verification flow (`verify-email/`, `forgot-password/`)
- Auth callbacks handled in `/auth/callback/`
- Rate limiting on auth endpoints (`auth-abuse.ts`)
- Cloudflare Turnstile CAPTCHA
- Admin-level authentication assertion level (AAL) enforcement

#### Designer workflow ✅
- Onboarding: `/onboarding/designer` — multi-step profile creation
- Dashboard: `/dashboard/designer` — project overview, client management
- Marketplace listing: marketplace_live flag, admin approval required
- Client relationships: `designer_customer_relationships` table, invite codes
- Appointments: full booking system (`appointmentService.ts`, availability windows)
- Portfolio: testimonials, cover images, design gallery (`project_storage.ts`)

#### Customer workflow ✅
- Onboarding: `/onboarding/customer` — guided setup
- Dashboard: `/dashboard/customer`
- Measurements: `/measurements` — body measurement submission (`measurementService.ts`)
- Project creation with reference images, fabric selection, budget, deadline
- Marketplace enquiry flow: browse → request → discuss → accept → project
- Delivery confirmation: `deliveryService.ts`, `project-delivery.ts`

#### Marketplace ✅
- Live designer discovery with filters (`marketplace-filters.ts`, `marketplaceService.ts`)
- Enquiry system with conversation threading (`marketplace_enquiry_messages` table)
- Admin approval workflow for marketplace profiles (`marketplace-approvals.ts`)
- Anti-poaching RLS policies (`patch-rls-anti-poaching.sql`)

#### Project management ✅
- Full CRUD: create, read, update, status transitions
- Project items (garment line items): `project_items` table, `projectItemService.ts`
- Project timeline and updates: `project-timeline.ts`, `project-updates.ts`
- Group projects: `groupProjectService.ts`
- Project gallery: `project_storage.ts`, reference images (Supabase Storage)
- Colour palette per project: `project-palettes.ts`
- Outfit type categorisation: `project-outfit-types.ts`

#### Messaging ✅
- Conversation threading: `conversations` table, `messageService.ts`
- File attachments in messages: `patch-storage-message-files.sql`
- Supabase Realtime enabled for messaging: `patch-messaging-realtime.sql`
- Unlink (end relationship) request flow with message archiving

#### Admin panel ✅
- `/dashboard/admin` — full admin dashboard
- User management: account activity, moderation, suspension
- Designer approval for marketplace listing
- Relationship management (approve/disable designer-customer links)
- Testimonial management
- Security events log
- Studio client management (local customers outside platform)
- Team management
- Reports and CSV export

#### Database maturity ✅
- 60+ SQL patch files indicating iterative, production-grade schema evolution
- Row Level Security on all tables (verified: `patch-enable-rls-all-tables.sql`)
- Anti-poaching RLS policies protecting designer-client relationships
- Storage security policies (private buckets, signed URLs)
- Function execute lockdown (preventing privilege escalation)
- Security audit followup patches (4 rounds)

#### Supabase adaptation assessment
feysefit is **already built on Supabase** with:
- Supabase Auth (SSR)
- Supabase PostgreSQL (full schema)
- Supabase Storage (project images, message attachments, profile images)
- Supabase Realtime (messaging, projects)

The Prisma + SQLite configuration is for **local development only** (allows running without a Supabase project). The production path is Supabase throughout.

#### What is NOT present in feysefit
- No garment design canvas (no Fabric.js, no SVG editor)
- No 3D viewer
- No pattern generation
- No design file storage beyond reference images
- No FreeSewing integration
- No portfolio/public gallery (profiles are marketplace-visible but no public portfolio feature)

---

### LetDesign

#### Design Canvas ✅
- **Fabric.js v5.3.0** canvas for front and back garment faces
- `fabricUtils.ts` (16 KB) provides comprehensive Fabric.js helper functions
- `useFabricCanvasInit.ts` hook initialises canvas with shirt template PNG background
- `useTextPropertyChange.ts` hook for real-time text manipulation
- `Editor.tsx` (20 KB) and `UpdateEditor.tsx` (20 KB) — full design editor pages
- `FrontCanvas.tsx` and `BackCanvas.tsx` — separate canvases for each garment face
- `Property.tsx` (8.4 KB) — right-panel property editor for selected element

#### 3D Viewer ✅
- Three.js via `@react-three/fiber` and `@react-three/drei`
- `t_shirt_mod.glb` (5.4 MB) bundled T-shirt 3D model
- `CanvasViewer.tsx` — React Three Fiber viewer component
- Designs applied to the 3D model via texture projection (📄 from code structure; exact UV mapping not verified)

#### Commission system ✅
- Multi-step commission creation: `CreateCommission.tsx` (16 KB), `FirstStep.tsx`, `SecondStep.tsx`
- `TailorDialog.tsx` — tailor selection dialog
- `commission.types.ts` — TypeScript types for commission data

#### Customisation options ✅
- `Colors.tsx` (12 KB), `Materials.tsx` (11 KB), `Sizes.tsx` (10 KB)
- `ColorTable.tsx`, `MaterialTable.tsx`, `SizeTable.tsx` — tabular editors
- `design.types.ts` — TypeScript types for design elements

#### Store management ✅
- Store creation, viewing, updating: `Create.tsx`, `Show.tsx`, `Update.tsx`
- Tailor/designer stores visible to customers

#### Backend dependency gap ⚠️
- All data persistence via Axios calls to a Laravel + MySQL backend
- The Laravel backend is in a separate repository (`CapstoneII-Backend`) not in this workspace
- Auth: Laravel Sanctum (session cookies)
- Realtime: Laravel Echo + Pusher WebSocket server required
- **The frontend cannot function without the Laravel backend running**

#### Supabase adaptation effort
Migrating LetDesign from Laravel to Supabase would require:
- Replacing all Axios API calls with Supabase client calls or Next.js Route Handlers
- Replacing Laravel Auth with Supabase Auth
- Replacing MySQL schema with PostgreSQL schema
- Replacing Pusher with Supabase Realtime
- Rewriting the backend business logic in TypeScript
- Estimated effort: **medium-high** (3-5 weeks for the data layer alone)

The Fabric.js canvas and Three.js viewer are framework-agnostic and can be reused as-is.

---

### medo

#### Backend (MedusaJS v2) ✅
- Full commerce engine: products, variants, inventory, cart, checkout, orders, customers, payments, shipping
- Custom modules: `designs`, `tasks`, `inventory_orders`, `partner`, `analytics`, `socials`, `website`
- Partner multi-tenancy: partners can have their own workspaces, receive task assignments
- Plugin system: DTDC shipping, Etsy sync, Faire marketplace sync

#### Storefront (Next.js) ✅
- Next.js storefront consuming MedusaJS API
- Mobile storefront (React Native / Expo)

#### Design module ✅ (from README)
- Design concepts and mood boards stored server-side
- Pre-production asset management
- Partner assignment for design execution

#### Partner portal ✅
- React web app for production partners
- iOS and Android native apps
- Task acceptance, execution reporting, real-time updates

#### Database
- PostgreSQL in production (MedusaJS ORM)
- SQLite option for local development
- MedusaJS manages schema via its own migration system

#### Supabase adaptation assessment
Medo is **not compatible** with Supabase as a drop-in replacement:
- MedusaJS uses its own data layer and ORM
- Replacing MedusaJS with Supabase would mean discarding the entire backend and replacing with custom code
- The production/supply-chain domain model (tasks, inventory orders, partner workflows) would need to be rebuilt from scratch in PostgreSQL + Supabase

The most practical use is as a **reference implementation** for production management features, not direct code reuse.
