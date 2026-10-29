# 04 - Open-Source Licensing & Security Review

**Platform Project:** FASHION-LAB  
**Date:** October 2026  
**Auditor:** Principal Software Architect & Senior Full-Stack Engineer  
**Workspace Root:** `c:\fashion-lab`  
**Execution Context:** Engineering Licensing Compliance & Security Hardening Audit

---

## 1. Open-Source License Compliance Matrix

> **Caveat & Disclaimer:** This analysis represents a technical engineering evaluation of source code files, repository license headers, submodules, and package manifests. It does not constitute formal legal counsel.

| Repository | Declared License | Commercial Use | Modifications Redistributable | Source Disclosure Obligation | Attribution Required | Fashion-Lab Compatibility |
|---|---|---|---|---|---|---|
| `cloPRO` | **MIT License** | YES | YES | NO source disclosure | YES (Copyright Notice) | **100% Permissive** (Ideal for studio core) |
| `freesewing-v4` | **MIT License** | YES | YES | NO source disclosure | YES (Copyright Notice) | **100% Permissive** (NPM library packages) |
| `opensew-2` | **GNU GPL-3.0** | YES | YES | **YES - Complete Source Disclosure** | YES (GPL notices) | **Copyleft Risk** (Must stay external desktop) |
| `seamly2d` | **GNU GPL-3.0** | YES | YES | **YES - Complete Source Disclosure** | YES (GPL notices) | **Copyleft Risk** (Must stay external desktop) |
| `feysefit` | **Proprietary / Internal** | YES (Ownership) | YES | No external obligation | NO | **100% Compatible** (Assumed owner-developed) |
| `LetDesign` | **Unlicensed Capstone** | Unclear | Unclear | Unclear | Notices | **Reference Only** (Do not copy code/assets) |
| `medo` | **Dual MIT License** | YES | YES | NO source disclosure | YES (Medusa & Jaal Yantra) | **100% Permissive** (Domain model reference) |

---

## 2. Granular Licensing & Third-Party Asset Analysis

### 2.1 `cloPRO` (MIT License)
- **Core Software:** Copyright (c) 2026 Chezburgar. Permits restriction-free commercial use, modification, sublicensing, and closed-source integration subject only to retaining the original copyright notice in the source documentation.
- **Bundled Assets & Fonts:**
  * **Typefaces (26 athletic fonts):** Loaded from Google Fonts CDN under the **SIL Open Font License 1.1 (OFL-1.1)** (Anton, Archivo Black, Bebas Neue, Oswald, Teko, Russo One, etc.). OFL permits commercial use, web distribution, and base64-embedding inside exported SVG print files.
  * **Graphics & Emblems (82 vector assets):** Authored procedural generators and sport emblems covered by the root MIT license.
- **Verdict:** **Fully Safe** for direct source adaptation into the Fashion-Lab studio module.

### 2.2 `freesewing-v4` (MIT License)
- **Core Software:** Copyright (c) 2022 Joost De Cock & Contributors. Entire monorepo, including `@freesewing/core`, `@freesewing/react`, core plugins, and all 60+ pattern designs, is distributed under the MIT License.
- **Dependencies:** Uses modular Lodash packages (`lodash.get`, `lodash.set`), `bezier-js` (MIT), and `hooks` (MIT).
- **Verdict:** **Fully Safe** for use as an imported NPM dependency in Fashion-Lab.

### 2.3 `opensew-2` & `seamly2d` (GNU GPL-3.0 Copyleft Warning)
- **Copyleft Obligations:** GPL-3.0 mandates that any software modifying, incorporating, or statically/dynamically linking to GPL-3.0 code must itself be released in its entirety under GPL-3.0 with complete source code made available to all users.
- **Critical Risk for Fashion-Lab:**
  * **NEVER** copy Python code from `opensew-2` or C++ code from `seamly2d` into the Fashion-Lab Next.js server or client codebase. Doing so would trigger GPL-3.0 copyleft obligations across your entire proprietary SaaS platform.
  * Integration must be strictly limited to **File Format Interoperability** (parsing `.sm2d` XML or standard DXF files exported by these desktop tools) or **External Desktop Execution** (users running Blender or Seamly2D locally on their workstations).
- **Verdict:** Keep completely separate. Zero source code embedding.

### 2.4 `feysefit` (Internal / Proprietary)
- No `LICENSE` file is present in the repository root.
- **Action Item:** If you are the original author of `feysefit`, explicitly adopt an MIT License or commercial enterprise proprietary license for Fashion-Lab. If cloned from an unlicensed third party, clarify upstream authorship before commercial publication.

### 2.5 `LetDesign` (Asset & Capstone Considerations)
- Unlicensed university capstone codebase.
- **Bundled 3D Asset:** `public/t_shirt_mod.glb` (5.4 MB) lacks license provenance and creator attribution.
- **Action Item:** Do NOT ship `t_shirt_mod.glb` to production. Commission or purchase CC0/MIT 3D apparel meshes (T-shirt, hoodie, dress, jacket, trousers) from verified 3D creators.

---

## 3. Deep Security Audit

### 3.1 Authentication & Session Security
- **cloPRO:** Zero server authentication. State lives solely in `localStorage`. Zero server credentials at risk, but zero multi-user isolation.
- **LetDesign:** Relies on an unavailable Laravel Sanctum backend. Tokens stored in client-side React context face XSS interception risks without HttpOnly cookies.
- **feysefit (Gold Standard):**
  * Uses `@supabase/ssr` with encrypted, server-managed `HttpOnly`, `SameSite=Lax`, `Secure` cookies. Zero JWT storage in browser `localStorage`.
  * **Session Binding:** Implements active session binding (`src/lib/security/session-binding.ts`) binding sessions to user-agent and IP fingerprints to thwart session hijacking.
  * **Multi-Factor Authentication (MFA):** Enforces Supabase AAL2 (Authenticator Assurance Level 2 / TOTP) on admin dashboard routes and sensitive profile mutations.

### 3.2 Abuse Prevention & Rate Limiting
- **Token-Bucket Rate Limiter:** `feysefit` contains custom token-bucket rate limiting (`src/lib/security/rate-limit-core.ts`) implementing per-IP and per-user buckets.
- **Auth Abuse Detection:** Dedicated endpoints (`auth-abuse.ts`) defend against credential stuffing, password reset spam, and invite code enumeration.
- **Cloudflare Turnstile CAPTCHA:** Integrated cryptographic bot validation (`turnstile.ts`, `captcha-policy.ts`) protects public registration, designer discovery enquiries, and invite redemption.

### 3.3 Row Level Security (RLS) & Anti-Poaching
- **Universal RLS:** `feysefit` enables Row Level Security across all PostgreSQL tables (`patch-enable-rls-all-tables.sql`, `patch-security-audit-followup.sql`). All queries execute in the context of `auth.uid()`.
- **Anti-Poaching Isolation:** In `feysefit/patch-rls-anti-poaching.sql`, database policies prevent designers from browsing or scraping each other's private client contact details, phone numbers, or unlinked project briefs. A designer can only view a customer if an active, mutual record exists in `designer_customer_relationships`.
- **Private Data Partitioning:** Designer banking information, private residential addresses, and phone numbers are partitioned in `designer_private_details` with strict owner-only read policies.

### 3.4 Upload Validation & Media Sanitization
- **Magic Number Inspection:** `src/lib/security/upload-bytes.ts` verifies magic byte signatures on all uploaded files, rejecting disguised polyglot executables.
- **Image Sanitization via Sharp:** `src/lib/security/image-process.ts` passes all raster uploads through **Sharp** on the server to strip EXIF GPS location tags, sanitize image headers, and transcode to WebP before writing to storage.
- **Quarantine Workflow:** Files are initially staged in a private quarantine bucket before security verification promotes them to public or project-level storage.

### 3.5 SSRF-Safe Outbound Fetchers
- `src/lib/security/safe-outbound-fetch.ts` validates all outbound URLs (e.g., designer portfolio links, reference images), blocking Server-Side Request Forgery (SSRF) against `localhost`, `127.0.0.1`, `0.0.0.0`, and internal cloud metadata addresses (`169.254.169.254`).

### 3.6 Secrets & Server-Only Enforcement
- `feysefit` enforces `src/lib/security/server-only-guard.ts` alongside Next.js's native `server-only` package.
- This guarantees that `SUPABASE_SERVICE_ROLE_KEY`, `HMAC_SECRET`, `RESEND_API_KEY`, and `TURNSTILE_SECRET_KEY` cannot be imported into client-bundled components.

---

## 4. Legal & Security Action Plan for Fashion-Lab

1. **Adopt Explicit Platform Licensing:** Establish an explicit MIT or Commercial Proprietary license in the root of the new Fashion-Lab application repository.
2. **Preserve MIT Notices:** Maintain original copyright headers for extracted `cloPRO` modules (Chezburgar) and `@freesewing` packages (Joost De Cock).
3. **Strictly Quarantine GPL-3.0 Code:** Keep `opensew-2` and `seamly2d` as external desktop tools. Exchange data exclusively through `.sm2d` XML and standard DXF files.
4. **Source Licensed 3D Garment Models:** Replace `LetDesign`'s unverified `t_shirt_mod.glb` with CC0 or commercially licensed GLB/GLTF apparel meshes.
5. **Carry Forward feysefit's Security Suite:** Integrate `feysefit`'s proven security layer (rate limiting, Turnstile, SSRF guards, upload sanitization, session binding, and RLS policies) as the platform's defensive baseline.
