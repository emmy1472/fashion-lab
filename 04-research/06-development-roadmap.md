# 06 - Development Roadmap & Phased Implementation Plan

**Platform Project:** FASHION-LAB  
**Date:** October 2026  
**Auditor:** Principal Software Architect & Senior Full-Stack Engineer  
**Workspace Root:** `c:\fashion-lab`  
**Execution Context:** Strategic Phased Engineering Roadmap (Milestones 1 to 9)

---

## 1. Roadmap Overview & Execution Philosophy

The development strategy for Fashion-Lab is strictly phased, modular, and risk-managed. It maximizes component reuse from verified workspace projects (`feysefit`, `cloPRO`, `freesewing-v4`) while isolating copyleft desktop applications (`opensew-2`, `seamly2d`) and discarding unmaintainable or unverified code (`LetDesign` backend).

> **Architectural Golden Rule:** No master application coding or modification begins until the stakeholder explicitly reviews and approves the findings in `04-research/`.

---

## 2. Granular Milestone Breakdown

### Milestone 1: Repository Audit (COMPLETE)
* **Goal:** Full forensic inspection of all workspace repositories, licenses, security boundaries, and reusable components.
* **Status:** **COMPLETE**
* **Deliverables:**
  * `04-research/01-workspace-inventory.md` (Repository catalog, tech stacks, entry points)
  * `04-research/02-technical-audit.md` (Deep dive into all 7 codebases)
  * `04-research/03-feature-comparison.md` (Feature matrix, reusability grades A through C-)
  * `04-research/04-license-and-security-review.md` (Licensing compliance, copyleft isolation, security audit)
  * `04-research/05-master-architecture.md` (Unified Next.js + Supabase architecture & normalized SQL schema)
  * `04-research/06-development-roadmap.md` (This strategic implementation plan)
* **Acceptance Criteria:** All 6 deliverables generated, verified against source code, and saved to `04-research/`.

---

### Milestone 2: Local Verification
* **Goal:** Verify selected primary source projects run locally to inspect behavior and UX directly.
* **Scope:** Test only the two primary candidates: `cloPRO` and `feysefit`.
* **Execution Steps:**
  1. **cloPRO Local Run:**
     ```bash
     cd c:\fashion-lab\01-web-apps\cloPRO
     npx serve .
     # Open browser at http://localhost:3000
     # Test garment selection (31 styles), zone coloring, procedural fills, Forge editor, and PNG/SVG/PDF exports
     ```
  2. **feysefit Local Run:**
     ```bash
     cd c:\fashion-lab\03-production-platform\feysefit
     npm install
     cp .env.example .env
     npm run db:push
     npm run db:seed
     npm run dev
     # Open browser at http://localhost:3000
     # Verify designer onboarding, customer onboarding, marketplace browse, appointments, and project creation
     ```
* **Do NOT Attempt:** Do not attempt running `LetDesign` (missing Laravel backend) or `medo` (complex Medusa daemon).
* **Dependencies:** Milestone 1.
* **Risks:** Node version mismatch (requires Node 20+); local SQLite dev schema sync.
* **Acceptance Criteria:**
  * `cloPRO` runs in browser; garment modifications and exports execute without errors.
  * `feysefit` boots in development mode; seed accounts log in successfully.

---

### Milestone 3: Architecture Approval & Setup
* **Goal:** Formal stakeholder alignment on technical roadmap, licensing resolution, and cloud project provisioning.
* **Deliverables:**
  * Formal sign-off on target stack: Next.js 16 + React 19 + TypeScript + Tailwind v4 + shadcn/ui + Supabase.
  * Formal license adoption for Fashion-Lab repository.
  * Supabase project creation (development & staging environments).
  * Vercel / hosting project provisioning with CI pipeline hooks.
* **Dependencies:** Milestone 2.
* **Risks:** Delay in license clarification or cloud credentials setup.
* **Acceptance Criteria:**
  * Stakeholder explicit written approval to begin implementation.
  * Clean Supabase development project accessible via API URL and Anon Key.

---

### Milestone 4: Application Foundation & Authentication
* **Goal:** Scaffold the unified Next.js 16 application with Tailwind v4, shadcn/ui, Supabase Auth SSR, and the core security suite.
* **Deliverables:**
  1. Next.js 16 App Router scaffold (`apps/web` or root project) with TypeScript strict mode.
  2. Tailwind CSS v4 and `shadcn/ui` base component library (buttons, dialogs, dropdowns, tabs, forms, toasts).
  3. Supabase Auth SSR integration: Login, role-based registration, email verification, password reset.
  4. Multi-role onboarding flows for Designers, Tailors, Patternmakers, Brands, Stylists, Models, and Clients.
  5. Ported Security Suite from `feysefit`:
     * `src/lib/security/session-binding.ts` (Edge Middleware session binding)
     * `src/lib/security/rate-limit-core.ts` (Token-bucket rate limiter)
     * `src/lib/security/turnstile.ts` (Cloudflare Turnstile CAPTCHA)
     * `src/lib/security/server-only-guard.ts` (Zero secret leakage guard)
  6. Base database migrations: `profiles`, `user_preferences`, `designer_profiles`, `brand_profiles` with full RLS.
* **Dependencies:** Milestone 3.
* **Estimated Duration:** 1 to 2 weeks.
* **Acceptance Criteria:**
  * User can register selecting any platform role.
  * Edge Middleware redirects unauthenticated requests.
  * Cloudflare Turnstile validates human registration.
  * Rate limiter blocks rapid automated requests with HTTP 429.

---

### Milestone 5: First Working Fashion Studio
* **Goal:** An interactive, browser-based 2D fashion studio where users can design garments, customize colors and patterns, upload artwork, auto-save to cloud storage, and export print-ready assets.
* **Deliverables:**
  1. `GarmentCanvas.tsx`: React 19 Client Component wrapping `cloPRO`'s pure functional SVG renderer.
  2. Left Catalog Rail: 31 garment models, 24 procedural fill styles, 82 vector emblems, and custom image uploader.
  3. Central Viewport: High-DPI canvas with Front/Back toggling, physical inch coordinate scaling, drag/rotate artwork gizmos.
  4. Right Properties Rail: Zone colorway pickers, pattern density controls, artwork layer manager.
  5. `ForgeEditor.tsx`: Layered raster badge editor with 16 blend modes.
  6. `useDesignState`: React 19 `useReducer` with 50-level undo/redo (Ctrl+Z / Ctrl+Shift+Z).
  7. Cloud Autosave: Debounced hook writing `.project.json` to Supabase Storage `design-files` bucket.
  8. Export Suite: Client-side export for 300 DPI transparent PNG, standalone SVG, PDF spec sheet, and ZIP package.
* **Dependencies:** Milestone 4.
* **Estimated Duration:** 3 to 4 weeks.
* **Acceptance Criteria:**
  * Designer can select a garment, change zone colors, position logos, and see instant SVG updates at 60 fps.
  * Undo and redo reliably restore past states.
  * Design auto-saves every 30 seconds; reopening restored the exact canvas state.
  * Exported ZIP opens cleanly, containing valid 300 DPI PNG, embedded font SVG, and PDF spec sheet.

---

### Milestone 6: Project Management, Collections & Portfolios
* **Goal:** Enable designers to organize designs into collections, link garments to customer projects, manage revision histories, and share designs via client approval links.
* **Deliverables:**
  1. Project Management CRUD: Ported from `feysefit` (`projects`, `project_items`, `project_members`).
  2. Design Revision Engine: `design_revisions` storing timestamped versions on manual "Save Version" action.
  3. Client Shareable Review Links: Secure token-based review URLs (`/review/[token]`) allowing clients to approve or request changes without creating an account.
  4. Collections Manager: Group designs into branded lines and lookbooks.
  5. Public Designer Portfolios: High-performance React Server Component pages (`/designers/[username]`) showcasing public designs and verified credentials.
* **Dependencies:** Milestone 5.
* **Estimated Duration:** 2 to 3 weeks.
* **Acceptance Criteria:**
  * Designer can create a project and assign multiple garment designs to it.
  * Designer generates a shareable review link; client opens without login and clicks "Approve".
  * Public portfolio renders in < 1 second with responsive thumbnail grids.

---

### Milestone 7: Technical Fashion Features (Patterns & 3D)
* **Goal:** Made-to-measure parametric pattern drafting via FreeSewing, anthropometric profile management, and interactive 3D garment visualization.
* **Deliverables:**
  1. Anthropometric Profile Form: Interactive body measurement recorder (neck, chest, waist, hips, inseam, etc.) with visual measurement diagrams.
  2. FreeSewing Route Handlers (`/api/patterns/draft`): Server-side execution of `@freesewing/core` and design packages (e.g., `breanna`, `carlton`, `huey`).
  3. Interactive Pattern Viewer: SVG pan/zoom viewer rendering seam allowances, notches, grainlines, and cutting labels.
  4. Pattern Export: Tiled PDF export for standard home printers (A4/US Letter) and standard vector SVG.
  5. 3D Garment Viewport: React Three Fiber (Three.js) canvas rendering licensed CC0 3D apparel meshes (T-shirt, hoodie) with real-time UV texture projection from the active 2D design.
* **Dependencies:** Milestone 6.
* **Estimated Duration:** 3 to 4 weeks.
* **Acceptance Criteria:**
  * User inputs body measurements; generates a mathematically tailored FreeSewing pattern.
  * Tiled PDF downloads and prints accurately to scale.
  * 3D viewer renders garment mesh in real-time, matching 2D studio colors and logo placements.

---

### Milestone 8: Collaboration, Marketplace & Production
* **Goal:** Full-featured marketplace discovery, appointment scheduling, threaded realtime messaging, and production task tracking.
* **Deliverables:**
  1. Designer Marketplace: Search by city, specialty, price range, with verified rating badges.
  2. Threaded Real-Time Messaging: Supabase Realtime WebSocket chat with image and PDF attachments.
  3. Appointment Booking: Designer calendar availability slots, client booking requests, and confirmation emails via Resend.
  4. Production Orders: Order management tracking fabric consumption, colorways, quantities, and due dates.
  5. Production Task Pipeline: Manufacturing task board (Cut -> Sew -> Press -> Finish -> QA -> Ship) adapted from `medo`'s workflow concepts.
  6. Technical Spec Sheets: Auto-generated factory production sheets containing bill-of-materials, measurements, color codes, and print graphics.
* **Dependencies:** Milestone 7.
* **Estimated Duration:** 3 to 4 weeks.
* **Acceptance Criteria:**
  * Customer discovers designer on marketplace, books appointment, and sends enquiry.
  * Chat messages update instantaneously without page reloads.
  * Production order generates a factory-ready technical specification sheet.

---

### Milestone 9: Quality Assurance, Security Verification & Production Deployment
* **Goal:** Automated regression testing, security policy verification, performance optimization, and production deployment.
* **Deliverables:**
  1. Automated Security Test Suite:
     * Direct tests verifying RLS prevents cross-tenant data access.
     * Tests proving designer anti-poaching policies block scraping of unlinked clients.
     * Rate limiting tests asserting HTTP 429 under flood conditions.
     * File upload validation tests verifying polyglot malware rejection.
  2. End-to-End Playwright Suites: Full user journey from registration -> studio design -> project creation -> client approval -> export.
  3. Performance Hardening: Lighthouse Desktop Score >= 95, Core Web Vitals all green.
  4. Production Infrastructure: Supabase Production environment configured with database point-in-time recovery (PITR) and automatic backups; Vercel edge deployment with custom domain and SSL.
* **Dependencies:** Milestone 8.
* **Estimated Duration:** 2 to 3 weeks.
* **Acceptance Criteria:**
  * 100% test pass rate across unit, integration, and security test suites.
  * Zero security vulnerabilities reported by audit tools.
  * Production environment fully live, verified, and operational.

---

## 3. Total Timeline & Resource Estimate

| Milestone | Scope Summary | Duration | Cumulative Timeline |
|---|---|---|---|
| **M1: Repository Audit** | Full workspace forensic research (6 documents) | Complete | Week 0 |
| **M2: Local Verification** | Verify cloPRO & feysefit local executions | 0.5 Weeks | Week 0.5 |
| **M3: Architecture Approval** | Stakeholder sign-off & cloud setup | 0.5 Weeks | Week 1.0 |
| **M4: Foundation & Auth** | Next.js 16 + Supabase SSR + Security Suite | 2 Weeks | Week 3.0 |
| **M5: 2D Fashion Studio** | SVG canvas + palette/fills + Forge + export | 3.5 Weeks | Week 6.5 |
| **M6: Projects & Portfolios** | Project management + versioning + share review | 2.5 Weeks | Week 9.0 |
| **M7: Technical CAD & 3D** | FreeSewing patterns + measurements + R3F 3D | 3.5 Weeks | Week 12.5 |
| **M8: Production & Chat** | Realtime messaging + marketplace + orders | 3.5 Weeks | Week 16.0 |
| **M9: QA & Production Deploy**| Security RLS tests + Playwright E2E + live launch | 2.5 Weeks | Week 18.5 |

**Total Estimated Timeline:** ~18.5 weeks (approx. 4.5 months) to a fully featured, commercial-ready production release.

---

## 4. Comprehensive Risk Register

| Risk Event | Severity | Likelihood | Impact Mitigation Strategy |
|---|---|---|---|
| **cloPRO DOM Manipulation vs React 19** | High | Low | Encapsulate SVG rendering inside `useRef` + `useEffect` to prevent React virtual DOM re-render conflicts. |
| **GPL-3.0 Copyleft Contamination** | Critical | Low | Strictly enforce process isolation. Never copy code from `opensew-2` or `seamly2d`. Use file formats only. |
| **Unlicensed 3D Mesh in LetDesign** | Medium | High | Completely discard `t_shirt_mod.glb`. Commission or purchase CC0/MIT licensed 3D garment assets. |
| **FreeSewing Measurement Discrepancies** | Medium | Medium | Implement an explicit TypeScript adapter mapping customer profile measurements to FreeSewing's YAML schema. |
| **Supabase Storage Quotas at Scale** | Medium | Low | Store design states as compact `.project.json` (10-30 KB). Cache generated pattern SVGs with CDN headers. |
| **Client EXIF Geolocation Privacy Leak** | High | Low | Enforce server-side Sharp processing on all user uploads to strip EXIF GPS coordinates before storage. |

---

## 5. Milestone Definition of Done (DoD)

Each milestone is considered complete only when:
1. All specified deliverables are implemented and verified in the codebase.
2. TypeScript compiles cleanly with zero errors under `strict: true`.
3. ESLint passes with zero warnings on strict settings.
4. Automated unit tests exist and pass for new business logic.
5. Code is committed with atomic, descriptive Git commit messages.
6. Research and architectural documentation in `04-research/` is updated if technical realities require adjustments.
