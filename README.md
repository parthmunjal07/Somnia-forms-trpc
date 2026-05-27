# SOMNIA

> **Forms that feel like cinema.**

Somnia is a full-stack, Inception-themed form builder and analytics engine. Every pixel of the interface is soaked in Christopher Nolan's filmography — the role system, the terminology, the visual themes, even the hidden easter eggs. It is not a skin over a generic form tool; the entire data model, access control layer, and user experience are designed from scratch around the metaphor of shared dreaming.

Built as a **Turborepo monorepo** with a fully decoupled **Express + tRPC** backend and a **Next.js 15 App Router** frontend.

### 🌐 Live Preview
- **Frontend**: [https://somniaforms.parthmunjal.in](https://somniaforms.parthmunjal.in)
- **Backend API**: [https://somnia-forms-trpc-production.up.railway.app/](https://somnia-forms-trpc-production.up.railway.app/)
- **API Docs (Scalar)**: [https://somnia-forms-trpc-production.up.railway.app/docs](https://somnia-forms-trpc-production.up.railway.app/docs)
- **Github Link**: [https://github.com/parthmunjal07](https://github.com/parthmunjal07/somnia-forms-trpc)

---

## Table of Contents

- [The Inception Glossary](#-the-inception-glossary)
- [Architecture Overview](#-architecture-overview)
- [Monorepo Structure](#-monorepo-structure)
- [Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
- [Cinematic Theme System](#-cinematic-theme-system)
- [The Form Builder (Dreamscape Builder)](#-the-form-builder-dreamscape-builder)
- [The Form Runner](#-the-form-runner)
- [Analytics Engine](#-analytics-engine)
- [Authentication & Security](#-authentication--security)
- [The Achievements System (Anomalies)](#-the-achievements-system-anomalies)
- [Easter Eggs](#-easter-eggs)
- [Additional Features](#-additional-features)
- [Local Development Setup](#-local-development-setup)
- [Database Schema](#-database-schema)
- [Seeding](#-seeding)
- [API Documentation](#-api-documentation)
- [Production Deployment](#-production-deployment)
- [Scripts Reference](#-scripts-reference)

---

## 🌀 The Inception Glossary

Every term in the UI maps to an *Inception* concept. This table is the Rosetta Stone for navigating the codebase and the application:

| Somnia Term | Plain Meaning | Inception Origin |
| :--- | :--- | :--- |
| **Dreamscape** | A form | A constructed dream level |
| **Layer** | A page/section within a multi-page form | Deeper dream levels (Hotel → Snow Fortress → Limbo) |
| **Layer Break** | A page break in the form builder | The "kick" that separates one dream level from the next |
| **Projection** | A form submission / response | Subconscious projections that populate the dreamscape |
| **Stabilized Signal** | A completed submission | A projection that has been stabilized (successfully recorded) |
| **Totem** | The spinning loading indicator / brand icon | Cobb's spinning top — the reality check device |
| **Projection Stabilized** | "Form submitted successfully" | The dream has been anchored |
| **Cognitive Dissonance** | An application error | A fracture in the dream logic |
| **Wake Up** | Log out | Returning to reality |
| **Surfacing** | The "Thank You" / post-submission screen | Rising back through dream levels |
| **Destabilizing** | Visual effect when page is idle for 30s | The dream collapsing |
| **Fog** | The animated particle canvas background | The haze of the subconscious |
| **Operative** | A user | A team member in the extraction crew |
| **Limbo** | A hidden `/limbo` route; also used for empty states | The unconstructed dream space — raw subconscious |
| **Extraction** | Data collection / CSV export | Stealing information from the dreamer's mind |
| **Kick** | A redirect after form submission | The synchronized fall that wakes you from the dream |
| **The Extractor Panel** | Admin dashboard | Cobb's mission control |
| **Blueprints** | Form templates page | Architectural plans for dream construction |
| **Sandbox Mode** | Live form preview testing in the builder | A safe dream within a dream |
| **Architecture Shifting** | Rapid field reordering easter egg | Ariadne folding the city |

---

## 🏗️ Architecture Overview

```mermaid
graph TD
    subgraph "Frontend — Vercel"
        Web["Next.js 15 App Router<br/>(apps/web)"]
    end

    subgraph "Backend — Railway / Docker"
        API["Express 5 + tRPC v11<br/>(apps/api)"]
    end

    subgraph "Shared Packages"
        DB["@repo/database<br/>Drizzle ORM + pg"]
        TRPC["@repo/trpc<br/>Routers & Context"]
        Schemas["@repo/schemas<br/>Zod validators"]
        Email["@repo/email<br/>Resend transactional"]
        Logger["@repo/logger"]
        Services["@repo/services"]
    end

    subgraph "Infrastructure"
        PG[(PostgreSQL)]
        Redis[(Upstash Redis)]
        Resend[Resend API]
    end

    Web -->|"tRPC over HTTP<br/>(httpBatchLink)"| API
    API --> DB
    DB --> PG
    API --> Redis
    API --> Resend
    API --> TRPC
    API --> Schemas
    API --> Email
    Web --> TRPC
```

**Key architectural decisions:**

- **Fully decoupled**: The frontend has zero access to `DATABASE_URL` or any server secret. All data flows through `NEXT_PUBLIC_API_URL` via tRPC's `httpBatchLink`.
- **Dual protocol**: The API exposes both **tRPC** (at `/trpc`) and **REST OpenAPI** (at `/api`) endpoints from the same router definition using `trpc-to-openapi`.
- **Graceful shutdown**: On `SIGTERM`/`SIGINT`, the Express server rejects new requests with `503`, drains active connections, closes the PostgreSQL pool, and force-exits after 5 seconds.
- **Auto-generated API docs**: A Scalar UI reference is served at `/docs`, powered by an OpenAPI spec auto-generated from the tRPC router at `/openapi.json`.

---

## 📁 Monorepo Structure

```
Somnia-forms-trpc/
├── apps/
│   ├── api/                    # Express + tRPC backend
│   │   ├── src/
│   │   │   ├── index.ts        # HTTP server bootstrap + graceful shutdown
│   │   │   ├── server.ts       # Express app (CORS, Helmet, CSRF, rate limiting, routes)
│   │   │   ├── env.ts          # Zod-validated environment variables
│   │   │   ├── rbac.ts         # Permission matrix (role → actions)
│   │   │   ├── auth/           # Passport strategies (Google OAuth)
│   │   │   ├── trpc/           # tRPC procedure wrappers
│   │   │   ├── services/       # Business logic services
│   │   │   └── __tests__/      # Integration tests (Vitest + Supertest)
│   │   ├── Dockerfile          # Multi-stage Turborepo Docker build
│   │   └── vitest.integration.config.ts
│   │
│   └── web/                    # Next.js 15 frontend
│       ├── app/
│       │   ├── page.tsx        # Landing page (1177 lines — hero, pricing, roles, testimonials)
│       │   ├── login/          # Authentication page
│       │   ├── register/       # Registration page
│       │   ├── dashboard/      # User workspace (form CRUD)
│       │   │   ├── page.tsx    # "Projected Dreamscapes" grid
│       │   │   ├── error.tsx   # Error boundary ("Cognitive Dissonance")
│       │   │   └── forms/[id]/
│       │   │       ├── build/  # Full drag-and-drop form builder
│       │   │       └── analytics/ # Analytics dashboard (charts, funnels, CSV export)
│       │   ├── f/[slug]/       # Public form submission route
│       │   ├── s/[slug]/       # Shareable public form link (alias)
│       │   ├── explore/        # Public form directory with infinite scroll
│       │   ├── admin/          # Extractor Panel (system admin)
│       │   ├── limbo/          # Hidden easter egg page
│       │   └── templates/      # Blueprints / form template gallery
│       ├── components/
│       │   ├── FormRunner.tsx   # Full interactive form rendering engine
│       │   ├── FieldRenderer.tsx # Individual field type renderers
│       │   ├── Totem.tsx       # Animated totem SVG component
│       │   ├── ProgressBar.tsx # Multi-layer progress indicator
│       │   ├── ThemePicker.tsx # Cinematic theme selector with live previews
│       │   ├── IntroAnimation.tsx # 5.5-second cinematic boot sequence
│       │   ├── PageTransition.tsx # Framer Motion page transitions + Konami code
│       │   ├── AchievementsTracker.tsx # Floating trophy FAB + achievement panel
│       │   ├── AuthGuard.tsx   # Client-side auth wrapper
│       │   └── ui/sonner.tsx   # Custom-themed Sonner toast configuration
│       ├── lib/
│       │   ├── achievements.ts # Achievement definitions and localStorage unlock logic
│       │   ├── themes.ts      # Builder skin style mappings (8 skins)
│       │   ├── templates.ts   # Pre-built form templates (Feedback, Job App, Event Reg)
│       │   ├── store.ts       # Zustand auth store
│       │   └── utils.ts       # cn() class utility
│       ├── styles/
│       │   └── themes.css     # CSS custom properties for 4 cinematic themes
│       ├── trpc/              # Client-side tRPC setup (httpBatchLink)
│       ├── providers/         # QueryClient + tRPC + next-themes providers
│       └── env.js             # @t3-oss/env-nextjs validation
│
├── packages/
│   ├── database/              # Drizzle ORM schema + seed script
│   │   ├── models/
│   │   │   ├── user.ts        # users, email_verifications tables
│   │   │   └── form.ts        # forms, fields, responses, analytics, views, collaborators
│   │   ├── seed.ts            # Demo data seeder (3 themed forms + responses)
│   │   └── drizzle.config.ts
│   ├── trpc/                  # Shared tRPC router definitions
│   │   └── server/
│   │       └── routes/        # auth, forms, fields, responses, analytics, collaborators, admin
│   ├── schemas/               # Shared Zod validation schemas
│   ├── email/                 # Resend email templates
│   ├── logger/                # Structured logging
│   ├── services/              # Shared business logic
│   ├── config/                # Shared ESLint config
│   ├── ui/                    # Shared UI components (shadcn)
│   └── typescript-config/     # Shared tsconfig presets
│
├── docker-compose.yml         # Local PostgreSQL (port 5434)
├── turbo.json                 # Turborepo pipeline config
├── wake_up_to_reality.mp3     # Audio file for idle easter egg
└── setup.sh                   # Quick setup script
```

---

## 🔐 Role-Based Access Control (RBAC)

Every user in the system has a **global role** that determines their baseline permissions. Within individual forms, collaborators are assigned a **per-form role** that further restricts their access.

### Global Roles

| Role | Inception Equivalent | Description |
| :--- | :--- | :--- |
| **THE_EXTRACTOR** | Dom Cobb | **System administrator.** Full platform access. Can view all users, change any role, suspend accounts, delete any form. Accesses the Extractor Panel (`/admin`). |
| **THE_DREAMER** | The Subject | **Default registered user role.** Can create forms, build fields, publish, invite collaborators, view analytics, and export CSV data. Same permissions as Extractor. |
| **THE_ARCHITECT** | Ariadne | **Form owner.** Automatically assigned to the user who creates a form. Full CRUD on their own forms, including publishing, deleting, and inviting collaborators. |

### Per-Form Collaborator Roles

| Role | Inception Equivalent | Description |
| :--- | :--- | :--- |
| **THE_FORGER** | Eames | **Editor collaborator.** Can edit form fields, modify settings, and view submissions. Cannot publish, delete, clone the form, or manage other collaborators. |
| **THE_SHADE** | Mal's Projection | **Read-only observer.** Can view form structure and settings only. Cannot edit anything, view analytics, clone, or delete. Sees an "Observer Mode" banner. |

### Permission Matrix

| Action | EXTRACTOR | DREAMER | ARCHITECT | FORGER | SHADE |
| :--- | :---: | :---: | :---: | :---: | :---: |
| View Form | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Form | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit Form / Fields | ✅ | ✅ | ✅ | ✅ | ❌ |
| Publish Form | ✅ | ✅ | ✅ | ❌ | ❌ |
| Delete Form | ✅ | ✅ | ✅ | ❌ | ❌ |
| View Responses / Analytics | ✅ | ✅ | ✅ | ✅ | ❌ |
| Invite Collaborators | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage Users (Admin) | ✅ | ✅ | ❌ | ❌ | ❌ |

### Subscription Tiers

| Tier | Description |
| :--- | :--- |
| **free** (One Level Deep) | 4 forms, 100 responses/month, 4 cinematic themes, basic analytics |
| **pro** (Full Extraction) | Unlimited forms, 10,000 responses/month, all 8 themes, CSV export, collaborators |
| **team** (Shared Dreamspace) | Everything in pro + unlimited responses, 10 team members, password-protected forms |

---

## 🎬 Cinematic Theme System

Forms can be rendered in **4 cinematic themes**, each inspired by a Christopher Nolan film. Themes are applied via CSS custom properties (defined in `styles/themes.css`) and the `.skin-{name}` class pattern.

### Inception (`skin-inception`)
- **Palette**: Deep navy `#0D1117` background, steel blue `#C8D8E8` text, gold `#C9933A` accents
- **Typography**: Cormorant Garamond headings
- **Background effect**: Subtle 48px grid overlay
- **Feel**: The default theme. Mysterious, layered, methodical.

### Dark Knight (`skin-dark_knight`)
- **Palette**: Pure black `#080808` background, muted grey `#D4D4D4` text, gold `#F5C542` accents
- **Typography**: Monospace headings
- **Background effect**: Vertical scanline overlay (2px repeating gradient)
- **Feel**: Gritty, raw, Gotham at midnight. High contrast, stark.

### Interstellar (`skin-interstellar`)
- **Palette**: Warm dark `#0A0705` background, dusty tan `#C4B49A` text, amber `#D4A847` accents
- **Typography**: Cormorant Garamond headings
- **Background effect**: Faint star field (scattered radial gradients)
- **Feel**: Warm, vast, desolate. Like filling out a form inside a wormhole.

### Tenet (`skin-tenet`)
- **Palette**: Off-white `#F5F4F0` background, dark `#1A1A1A` text, crimson `#C0392B` accents
- **Typography**: Monospace headings
- **Background effect**: Giant `CLASSIFIED` watermark rotated -35° across the viewport
- **Color scheme**: `light` (the only light theme)
- **Special behavior**: The "Thank You" screen renders the custom message text **reversed** (right-to-left, `flex-row-reverse`), mimicking Tenet's temporal inversion
- **Feel**: Clean, clinical, government-document aesthetic.

### Builder Skins (8 total)

In addition to the 4 cinematic themes, the Builder's Settings panel exposes **8 visual skins** for the form preview (defined in `lib/themes.ts`):

| Skin ID | Name | Description |
| :--- | :--- | :--- |
| `classic-dark` | Classic Dark | Dark stone with emerald accents (default) |
| `classic-light` | Classic Light | Light mode with stone tones |
| `neon-cyan` | Neon Cyan | Black background with cyan glow |
| `limbo-fade` | Limbo Fade | Zinc-dark with amber warmth |
| `vintage-amber` | Vintage Amber | Warm amber parchment tones |
| `monochrome` | Monochrome | Pure black and white, no rounded corners |
| `blood-moon` | Blood Moon | Near-black with deep red glow |
| `royal-gold` | Royal Gold | Navy blue with gold accents |

---

## 🔨 The Form Builder (Dreamscape Builder)

The builder is a **three-panel layout** at `/dashboard/forms/[id]/build`:

### Left Panel — Dream Fields
- **Add Fields**: Click to append new field types (Short text, Long text, Email, Number, Single select, Multi select, Checkbox, Date, Rating, Layer break)
- **Drag & Drop**: Powered by `@dnd-kit/core` with vertical axis restriction. Fields are `SortableFieldRow` components with grab handles.
- **Optimistic reorder**: Dragging instantly updates local state; the API mutation fires in the background.
- **Templates ("Blueprints")**: Three inception-themed starter templates:
  - **Feedback Form** — Rating + select + long text + checkbox
  - **Job Application** — Name + email + specialization + experience + date + briefing
  - **Event Registration** — Name + email + multi-select equipment + NDA checkbox
- **Optimistic delete with undo**: Deleting a field instantly removes it from the list and shows a 4-second toast with an "Undo" button. The API call only fires after the toast is dismissed without undo.

### Center Panel — Live Preview
- Renders the actual `<FormRunner>` component in real-time as fields are added/edited
- **Viewport switcher**: Toggle between Desktop and Mobile (375px max-width) previews
- **Sandbox Mode**: Toggle to capture test submissions and inspect the response data in the right panel

### Right Panel — Configuration
Three tabs:
1. **Field**: Edit selected field's label, placeholder, required flag, options (for selects), validation rules, and conditional logic
2. **Settings**: Theme picker, URL slug, response limit, expiration date, password protection, custom thank-you message, redirect URL
3. **Team**: Invite collaborators by email with role selection (THE_FORGER or THE_SHADE), view/remove existing collaborators, upgrade subscription tier

### Debounced Auto-Save
All Settings tab changes are debounced with a 1-second timer. If any value differs from the database state, a `forms.update` mutation fires automatically.

### Responsive Behavior
On screens < 1024px (`lg` breakpoint), the three panels collapse into a **tabbed mobile layout** with Fields / Preview / Settings segments.

### Onboarding Spotlight
First-time builders see a spotlight overlay highlighting the left panel with an animated arrow and "Start by adding your first token" message. It auto-dismisses when the first field is added and sets `somnia_builder_seen` in localStorage.

---

## 🎮 The Form Runner

The `<FormRunner>` component (`components/FormRunner.tsx`) is the interactive form rendering engine used for both public submissions (`/f/[slug]`) and the builder's live preview.

### Multi-Page Navigation
- Fields are split into "layers" by `layer_break` field types
- Layer names follow the movie's depth progression: **Reality (Layer 1)** → **The Hotel (Layer 2)** → **Snow Fortress (Layer 3)** → **Limbo (Layer 4)** → **Limbo Deep (Layer N)**
- Animated transitions between layers via Framer Motion (slide + fade)
- Keyboard navigation: `Enter` advances to the next question / layer
- A `<ProgressBar>` shows progress across all layers

### Conditional Logic
Fields support JSON-based conditional visibility rules:
```json
{
  "rules": [
    { "fieldId": "abc-123", "operator": "equals", "value": "Yes", "action": "show" },
    { "fieldId": "def-456", "operator": "not_equals", "value": "Other", "action": "hide" }
  ]
}
```
Fields are dynamically shown/hidden based on current answers via `isFieldVisible()`.

### Validation
Each layer is validated on navigation using a dynamically-built Zod schema (`buildZodSchemaForFields`). Required fields, email format, and type coercion are enforced before allowing progression.

### The Totem Spinner
When a form is submitted:
1. Totem status → `"spinning"` (fast rotation animation)
2. API mutation fires
3. On success → `"decelerating"` (custom CSS `totem-decelerate` animation: fast 1080° spin → slow stop at 1455°)
4. A white `showFlash` overlay blinks for 800ms (the "kick" effect)
5. Totem status → `"stopped"` (stationary)
6. The "Surfacing" thank-you screen renders

### Password Gate
If a form has `passwordHash` set, the runner shows a password input screen before revealing any questions. Password verification happens via `forms.verifyPasswordGate` tRPC procedure.

### Redirect Countdown
If the form has a `redirectUrl`, after submission a 3-2-1 countdown displays before redirecting. Users can click to skip immediately.

### Accessibility
- `prefers-reduced-motion` is respected: animations are reduced to simple opacity fades
- All field inputs have proper labels and semantic structure
- Keyboard-only navigation is fully supported

---

## 📊 Analytics Engine

The analytics dashboard at `/dashboard/forms/[id]/analytics` provides:

### Summary Cards (5 KPIs)
1. **Total Signals** — Submission count
2. **Dreamers Reached** — View count
3. **Completion Rate** — Submissions ÷ Views (%)
4. **Avg Stabilize Time** — Mean seconds to complete
5. **Drop-off Rate** — Inverse of completion rate

### Chronological Wave Chart
A Recharts `<LineChart>` plotting daily views vs. submissions over time. Renders client-side only (`isMounted` guard) to avoid SSR hydration mismatches.

### Completion Funnel
Per-field drop-off analysis showing how many respondents filled each field out of total submissions, with gradient progress bars.

### Parameter Distribution
For select and rating fields, horizontal bar charts showing answer distribution with counts and percentages.

### Expandable Response Table
- Paginated list of individual submissions (10 per page)
- Click to expand any row and see all field-level answers
- For select/rating fields, inline distribution charts appear within expanded rows, with the user's specific answer highlighted in gold
- **Stability badge**: Completed submissions show "Stable" (green), incomplete show "Unstable" (amber, pulsing)

### Filters
- Date range (start/end)
- Completed-only toggle
- All filters reset pagination on change

### CSV Export
One-click CSV download of all filtered responses via `responses.exportCSV` tRPC query.

---

## 🔒 Authentication & Security

### Authentication Flow
- **Email/Password**: Register → email verification (via Resend) → login → JWT + refresh token pair stored as httpOnly cookies
- **Google OAuth**: Passport.js `passport-google-oauth20` strategy → auto-create user → set cookies → redirect to `/dashboard`
- **Token Refresh**: Automatic via `auth.me` tRPC procedure
- **Logout**: Clears httpOnly cookies server-side + Zustand store client-side

### Security Layers

| Layer | Implementation |
| :--- | :--- |
| **Helmet** | Security headers with strict CSP (`defaultSrc: 'none'`, whitelisted `connectSrc`) |
| **CORS** | Origin whitelist from `ALLOWED_ORIGINS` env var, `credentials: true` |
| **CSRF** | Double-submit cookie pattern. `GET /api/csrf` issues a token cookie; mutating tRPC calls must include matching `X-CSRF-Token` header. Public endpoints (submit, register, login) are exempt. |
| **Rate Limiting** | Per-endpoint `express-rate-limit`: 3 registrations/hr, 10 logins/hr, 30 refreshes/hr, 30 submissions/min |
| **Upstash Redis** | Optional distributed rate limiting via `@upstash/ratelimit` |
| **Body Size** | JSON and URL-encoded bodies capped at 50kb |
| **Password Hashing** | bcryptjs with 12 rounds |
| **Environment Guards** | Zod validation at startup — missing `DATABASE_URL`, `JWT_SECRET`, `REFRESH_SECRET`, `RESEND_API_KEY`, or `CSRF_SECRET` immediately crashes the process with descriptive errors |

---

## 🏆 The Achievements System (Anomalies)

A gamification layer hidden throughout the app. Achievements are tracked in `localStorage` under `somnia_achievements` and displayed via a floating trophy FAB button (bottom-right corner) that expands into a panel.

### All 7 Achievements

| Achievement | Name | How to Unlock |
| :--- | :--- | :--- |
| `four_layers` | **The Architect's Signature** | Have exactly 4 forms on your dashboard |
| `inception_typed` | **Deep Dive** | Type the word "inception" anywhere on the landing page |
| `architecture_shifting` | **Architecture Shifting** | Drag-reorder fields 5 times within 10 seconds in the builder |
| `midnight_submission` | **Hour of Limbo** | Submit a form between 00:00 and 00:59 |
| `limbo_found` | **Lost in Limbo** | Navigate to the hidden `/limbo` route |
| `totem_test` | **Reality Check** | Click the spinning totem in the navbar 5 times within 2 seconds |
| `konami_code` | **Temporal Anomaly** | Enter the Konami Code (↑↑↓↓←→←→BA) anywhere on the site |

When all 7 are unlocked, the trophy button turns gold and pulses. Each locked achievement has a "Decrypt Hint" button that reveals a cryptic clue.

---

## 🥚 Easter Eggs

### 1. Inception Mode (Landing Page)
**Trigger**: Type "inception" on the landing page (not in an input field).
**Effect**: The entire page rotates 180° (upside down) for 3 seconds. A gold toast appears: *"You've gone too deep."* Unlocks the **Deep Dive** achievement.

### 2. Totem Reality Check (Landing Page)
**Trigger**: Click the spinning totem SVG in the navbar 5 times within 2 seconds.
**Effect**: The totem pauses for 3 seconds. A styled toast appears: *"Still dreaming."* Unlocks the **Reality Check** achievement.

### 3. Idle Background + Audio (Landing Page)
**Trigger**: Remain inactive (no mouse, keyboard, scroll, or touch) for 30 seconds on the landing page.
**Effect**:
- Background color smoothly transitions from `#0A0A0F` (near-black) to `#0A361A` (deep green)
- The fog particle canvas turns red and accelerates 6×
- A floating message appears at the bottom: *"Wake up to reality."*
- The audio file `wake_up_to_reality.mp3` plays once
- All effects reset immediately when the user interacts

The audio is unlocked via a silent play/pause on the first user interaction (click/key/touch) to comply with browser autoplay policies.

### 4. Architecture Shifting (Builder)
**Trigger**: Drag-and-drop reorder fields 5 times within 10 seconds.
**Effect**:
- All drag handles turn gold with a glowing drop-shadow and scale up
- A gold toast appears: *"The architecture is shifting."*
- A synthesized G4 sine wave tone (392 Hz) plays via the Web Audio API, fading over 4 seconds
- Visual effect lasts 3 seconds
- Unlocks the **Architecture Shifting** achievement

### 5. Konami Code (Global)
**Trigger**: Enter ↑↑↓↓←→←→BA on any page.
**Effect**: The entire page applies a CSS `filter: invert(1) hue-rotate(180deg) sepia(0.5)` for 3 seconds. A red toast appears: *"Temporal anomaly detected."* Unlocks the **Temporal Anomaly** achievement.

### 6. Lost in Limbo (Hidden Route)
**Trigger**: Navigate to `/limbo`.
**Effect**: A minimalist black screen with a slowly spinning totem, a GPS coordinate (48°52'5"N 2°19'59"E — Paris, where Inception was filmed), and the text: *"You weren't supposed to find this."* Links to the API docs. Unlocks the **Lost in Limbo** achievement.

### 7. Hour of Limbo (Submission)
**Trigger**: Submit any form between 00:00 and 00:59 (midnight hour).
**Effect**: On the Surfacing screen, the heading text slowly pulses between opacity 0.3 and 1.0: *"You submitted at the hour of limbo."* Unlocks the **Hour of Limbo** achievement.

### 8. Four Layers (Dashboard)
**Trigger**: Have exactly 4 forms on your dashboard.
**Effect**: A gold sparkle icon appears next to the form count with a tooltip: *"Four layers deep. Cobb would be proud."* Unlocks **The Architect's Signature** achievement.

### 9. Tenet Reverse Text (Tenet Theme)
**Trigger**: Submit a form using the Tenet theme.
**Effect**: The custom "Thank You" message on the Surfacing screen renders with reversed word order (right-to-left via `flex-row-reverse`), mirroring Tenet's temporal inversion concept.

---

## ✨ Additional Features

### Cinematic Intro Sequence
On the very first visit, a 5.5-second boot animation plays:
1. Gold spinning totem fades in at center (300ms)
2. A gold ripple ring expands outward (1200ms)
3. "SOMNIA" text types in letter by letter with staggered delays (2000ms)
4. Tagline fades in: *"Forms that feel like cinema."* (2600ms)
5. A gold progress bar fills from left to right (3200ms)
6. Everything fades out, totem flies to the navbar position (4200ms → 5500ms)

The animation is skipped on subsequent visits (`somnia_intro_seen` localStorage flag) and respects `prefers-reduced-motion`.

### Page Transitions
All route changes animate via Framer Motion's `<AnimatePresence>` — new pages slide up and fade in; exiting pages slide up and fade out. Respects reduced motion preferences.

### Fog Canvas
Every major page features a `<FogAnimation>` — a full-screen `<canvas>` element rendering 180 radial gradient particles drifting slowly across the viewport. ~15% of particles are gold-tinted; the rest are blue-grey. On the landing page, the fog responds to the idle/destabilizing state by turning red and accelerating.

### Smart Navigation Bar
The landing page navbar transforms as you scroll:
- **At top**: Full-width, transparent with subtle bottom border
- **On scroll**: Shrinks to centered pill shape with rounded corners, blur background, and elevated shadow

### Explore Page (Public Directory)
At `/explore`, an infinite-scroll gallery of all publicly published forms, with theme badges and relative timestamps. Uses `trpc.forms.listPublic.useInfiniteQuery`.

### Form Cloning
Dashboard cards include a clone button that duplicates a form with all its fields. Not available to THE_FORGER role.

### Custom Toast System
The Sonner toaster is globally themed:
- **Success toasts**: Gold border, gold tinted background, gold check icon (`#C9933A`)
- **Error toasts**: Dark red border, red tinted background, red octagon icon
- **Action buttons**: Gold background with dark text (for Undo, etc.)
- All toasts use monospace font to match the application aesthetic

### Error Boundaries
The dashboard route segment has a dedicated `error.tsx` boundary. On unhandled errors, instead of a white screen, users see a themed "Cognitive Dissonance" screen with:
- The error message in a red monospace box
- An "Attempt Re-projection (Try Again)" button
- A "Wake Up to Reality (Home)" navigation button

### Top Loading Bar
`nextjs-toploader` renders a thin gold (`#C9933A`) progress bar at the very top of the viewport during route transitions.

---

## 🚀 Local Development Setup

### 1. Prerequisites
- **Node.js** >= 20
- **pnpm** (via Corepack: `corepack enable`)
- **PostgreSQL** (local or Docker)
- **Upstash Redis** account (optional, for distributed rate limiting)
- **Google OAuth** credentials (optional, for social login)
- **Resend API Key** (for transactional emails)

### 2. Start PostgreSQL with Docker

```bash
docker compose up -d
```

This starts a PostgreSQL 15 instance on **port 5434** with:
- User: `somnia`
- Password: `somnia`
- Database: `form`

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Environment Variables

Create a `.env` file at the **project root**:

```env
DATABASE_URL=postgresql://somnia:somnia@localhost:5434/form
JWT_SECRET=your-32-char-secret-key-here-abcdefgh
REFRESH_SECRET=your-32-char-refresh-secret-here-xyz
CSRF_SECRET=your-csrf-secret-here
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM_EMAIL=onboarding@resend.dev
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000
UPSTASH_REDIS_REST_URL=https://your-upstash-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-token
GOOGLE_OAUTH_CLIENT_ID=your-google-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-google-client-secret
```

Create `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
SKIP_ENV_VALIDATION=true
```

> **Note**: Set `SKIP_ENV_VALIDATION=true` during initial setup to bypass strict env checks until all variables are configured.

#### Complete Environment Variable Reference

| Variable | Required | App | Description |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | ✅ | API | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | API | Min 32 chars. Signs access tokens |
| `REFRESH_SECRET` | ✅ | API | Min 32 chars. Signs refresh tokens |
| `CSRF_SECRET` | ✅ | API | Signs CSRF tokens |
| `RESEND_API_KEY` | ✅ | API | Resend.com API key for emails |
| `RESEND_FROM_EMAIL` | ❌ | API | Optional custom sender email (defaults to `Somnia <system@somnia.app>`. Use `onboarding@resend.dev` for unverified Resend domains) |
| `FRONTEND_URL` | ❌ | API | Default `https://somniaforms.parthmunjal.in`. Used for OAuth redirects and email links |
| `ALLOWED_ORIGINS` | ❌ | API | Comma-separated CORS origins. Default `https://somniaforms.parthmunjal.in` |
| `BASE_URL` | ❌ | API | Default `https://somnia-forms-trpc-production.up.railway.app`. Used for OpenAPI base URL |
| `PORT` | ❌ | API | Default `8000` |
| `NODE_ENV` | ❌ | API | `development` / `production` / `test` |
| `UPSTASH_REDIS_REST_URL` | ❌ | API | Upstash Redis URL for distributed rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | ❌ | API | Upstash Redis token |
| `GOOGLE_OAUTH_CLIENT_ID` | ❌ | API | Google OAuth client ID |
| `GOOGLE_OAUTH_CLIENT_SECRET` | ❌ | API | Google OAuth client secret |
| `NEXT_PUBLIC_API_URL` | ✅ | Web | Public URL of the Express API |
| `NEXT_PUBLIC_APP_URL` | ✅ | Web | Public URL of the Next.js app |

### 5. Push Database Schema

```bash
pnpm db:generate
pnpm db:migrate
```

### 6. Seed Demo Data (Optional)

```bash
cd packages/database
pnpm tsx seed.ts
```

This creates:
- **Demo User** (`demo@somnia.io` / `Demo@2025`) — THE_ARCHITECT
- **Admin User** (`admin@somnia.io` / `Demo@2025`) — THE_EXTRACTOR
- 3 themed dreamscapes with fields and sample responses

### 7. Start Development

```bash
pnpm dev
```

| Service | URL |
| :--- | :--- |
| Next.js Frontend | `https://somniaforms.parthmunjal.in` |
| Express API | `https://somnia-forms-trpc-production.up.railway.app` |
| API Health Check | `https://somnia-forms-trpc-production.up.railway.app/health` |
| OpenAPI JSON | `https://somnia-forms-trpc-production.up.railway.app/openapi.json` |
| Scalar API Docs | `https://somnia-forms-trpc-production.up.railway.app/docs` |

---

## 🗄️ Database Schema

7 tables managed by Drizzle ORM:

```mermaid
erDiagram
    users ||--o{ forms : creates
    users ||--o{ email_verifications : verifies
    users ||--o{ form_collaborators : collaborates
    forms ||--o{ fields : contains
    forms ||--o{ responses : receives
    forms ||--o{ form_views : tracks
    forms ||--o{ analytics : aggregates
    forms ||--o{ form_collaborators : shares

    users {
        uuid id PK
        varchar full_name
        varchar email UK
        timestamp email_verified_at
        varchar password_hash
        text google_id UK
        enum role
        enum subscription_tier
        boolean is_suspended
        text profile_image_url
    }

    forms {
        uuid id PK
        uuid user_id FK
        varchar title
        varchar slug
        enum status
        enum visibility
        enum theme
        integer response_limit
        timestamp expires_at
        varchar password_hash
        text thank_you_message
        text redirect_url
    }

    fields {
        uuid id PK
        uuid form_id FK
        text label
        enum type
        boolean required
        text placeholder
        jsonb options
        jsonb validation_rules
        integer page_index
        jsonb conditional_logic
        integer order
    }

    responses {
        uuid id PK
        uuid form_id FK
        jsonb response_values
        timestamp submitted_at
        integer time_to_complete
        boolean is_complete
    }

    form_views {
        uuid id PK
        uuid form_id FK
        timestamp viewed_at
    }

    analytics {
        uuid id PK
        uuid form_id FK
        integer views_count
        integer submissions_count
    }

    form_collaborators {
        uuid form_id PK_FK
        uuid user_id PK_FK
        enum role
        timestamp invited_at
        timestamp accepted_at
    }
```

### Field Types

| Type | Description | Options field |
| :--- | :--- | :--- |
| `short_text` | Single-line text input | — |
| `long_text` | Multi-line textarea | — |
| `email` | Email input with format validation | — |
| `number` | Numeric input | — |
| `single_select` | Radio/dropdown (pick one) | `string[]` |
| `multi_select` | Checkbox group (pick many) | `string[]` |
| `checkbox` | Single yes/no toggle | — |
| `date` | Date picker | — |
| `rating` | 1-5 star/scale rating | — |
| `layer_break` | Page break (not a data field) | — |

---

## 🧪 Seeding

The seed script at `packages/database/seed.ts` populates:

### Users
| Email | Password | Role |
| :--- | :--- | :--- |
| `demo@somnia.io` | `Demo@2025` | THE_ARCHITECT |
| `admin@somnia.io` | `Demo@2025` | THE_EXTRACTOR |

### Forms (Dreamscapes)
1. **The Limbo Survey** (public, published) — 5 fields: deepest regret, levels, totem usage, totem type, reality stability rating. 150 views, 15 responses.
2. **Inception Feasibility Study** (unlisted, published) — 6 fields: target name, objective, team role, depth, kick song, date. 75 views, 10 responses.
3. **Subconscious Defense Assessment** (public, published) — 5 fields: threat level, hostility, types, email, notes. 40 views, 5 responses.

---

## 📚 API Documentation

### tRPC Routers

| Router | Procedures | Description |
| :--- | :--- | :--- |
| `auth` | `register`, `login`, `logout`, `me`, `sendVerification`, `verifyEmail`, `upgradeTier` | Authentication and user management |
| `forms` | `create`, `list`, `getById`, `getBySlug`, `listPublic`, `update`, `delete`, `clone`, `verifyPasswordGate` | Form CRUD and public access |
| `fields` | `create`, `list`, `update`, `delete`, `reorder` | Field CRUD with drag-drop reorder |
| `responses` | `submit`, `list`, `exportCSV` | Public submission + paginated listing + CSV export |
| `analytics` | `getSummary`, `getFieldDropoffs`, `getDailyStats`, `getFieldDistributions`, `incrementViews` | Read-only analytics queries |
| `collaborators` | `invite`, `list`, `remove` | Team collaboration management |
| `admin` | `listUsers`, `listAllForms`, `changeRole`, `toggleSuspend`, `deleteForm` | System administration (Extractor only) |
| `health` | `check` | API health endpoint |

### REST (OpenAPI)

All tRPC procedures marked with `meta.openapi` are also accessible via REST at `/api/...`. The full OpenAPI spec is at `/openapi.json` and the interactive Scalar UI docs are at `/docs`.

---

## 🚢 Production Deployment

### API (Docker → Railway / Render / Fly.io)

A multi-stage `Dockerfile` is provided at `apps/api/Dockerfile`:

```bash
# Build
docker build -t somnia-api -f apps/api/Dockerfile .

# Run
docker run -p 8000:8000 \
  -e DATABASE_URL=... \
  -e JWT_SECRET=... \
  -e REFRESH_SECRET=... \
  -e CSRF_SECRET=... \
  -e RESEND_API_KEY=... \
  -e ALLOWED_ORIGINS=https://your-frontend.vercel.app \
  -e FRONTEND_URL=https://your-frontend.vercel.app \
  somnia-api
```

The Docker build uses `turbo prune @repo/api --docker` to create a minimal dependency tree, then builds all workspace packages in topological order.

### Frontend (Vercel)

1. Import the repository into Vercel
2. Set the **Root Directory** to `apps/web`
3. Set environment variables:
   - `NEXT_PUBLIC_API_URL` = your deployed API URL
   - `NEXT_PUBLIC_APP_URL` = your Vercel URL

---

## 📋 Scripts Reference

### Root (Turborepo)

| Script | Description |
| :--- | :--- |
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all apps and packages |
| `pnpm lint` | Run ESLint across all packages |
| `pnpm format` | Run Prettier across all files |
| `pnpm check-types` | TypeScript type checking |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:migrate` | Run Drizzle migrations |

### API (`apps/api`)

| Script | Description |
| :--- | :--- |
| `pnpm dev` | Start with `tsx watch` (hot reload) |
| `pnpm build` | Build with `tsup` |
| `pnpm start` | Run production build (`node dist/index.js`) |
| `pnpm test` | Run unit tests (Vitest) |
| `pnpm test:integration` | Run integration tests (Vitest + Supertest) |

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Monorepo** | Turborepo + pnpm workspaces |
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript 6 |
| **Styling** | Tailwind CSS 4, CSS custom properties |
| **Animations** | Framer Motion, Canvas API, Web Audio API |
| **State** | Zustand (auth), TanStack React Query (server state) |
| **Forms** | tRPC React Query hooks, Zod validation |
| **Drag & Drop** | @dnd-kit/core + @dnd-kit/sortable |
| **Charts** | Recharts |
| **Toasts** | Sonner |
| **Backend** | Express 5, tRPC v11, trpc-to-openapi |
| **Database** | PostgreSQL 15, Drizzle ORM |
| **Auth** | JWT (httpOnly cookies), Passport.js (Google OAuth), bcryptjs |
| **Email** | Resend |
| **Rate Limiting** | express-rate-limit + @upstash/ratelimit |
| **Security** | Helmet, CSRF (double-submit cookie), CORS |
| **API Docs** | Scalar (OpenAPI) |
| **Testing** | Vitest, Supertest |
| **Containerization** | Docker (multi-stage Turborepo build) |

---

> *"An idea is like a virus. Resilient. Highly contagious. And even the smallest seed of an idea can grow. It can grow to define or destroy you."*
>
> — Dom Cobb
