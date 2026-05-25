# Somnia Forms - Cinematic Form Builder

Somnia is an open-source, cinematic form builder designed with dark mode, beautiful micro-interactions, and premium aesthetics. The system features a "multi-field layered" layout (similar to Google Forms) with an advanced set of validation features and analytics.

## Table of Contents

- [Features](#features)
- [Monorepo Architecture](#monorepo-architecture)
- [Requirements Checklist](#requirements-checklist)
- [Local Development & Setup](#local-development--setup)
- [Demo Credentials](#demo-credentials)
- [API Documentation](#api-documentation)

---

## Features

- **Cinematic Aesthetic**: Dark mode by default, highly stylized "Nolan-esque" themes.
- **Layered Forms**: Break forms into layers (pages) dynamically to handle complex data gathering.
- **Role-Based Access Control**: Assign roles to collaborators (Architect, Extractor, Forger, Shade).
- **Comprehensive Analytics**: View aggregated form stats, track individual submissions, export CSVs.
- **Response Caps & Deadlines**: Form architects can set expiration dates and submission limits.
- **Dynamic Field Types**: Built-in support for short text, long text, email, number, select, multi-select, checkbox, dates, and ratings.
- **Public & Unlisted Modes**: Built-in explore directory for public forms. Keep sensitive forms unlisted.

---

## Monorepo Architecture

This repository is built using [Turborepo](https://turborepo.org) and runs as a full-stack monorepo featuring separated apps for the frontend and backend.

### Apps

- **`apps/web`**: Next.js 15 (App Router) React Frontend.
- **`apps/api`**: Express Server Backend, handling the `tRPC` procedures and REST OpenAPI endpoints.

### Shared Packages

- **`@repo/schemas`**: Zod schemas used for validation across the client and server.
- **`@repo/database`**: Drizzle ORM schema, definitions, and migrations (using PostgreSQL).
- **`@repo/trpc`**: Type-safe shared tRPC routers and configuration.
- **`@repo/email`**: Resend-based email system (verification, alerts, warnings).
- **`@repo/ui`**: Shared UI component library.

---

## Requirements Checklist

This project was built to satisfy strict evaluation criteria:

- [x] **Frontend and Backend Separation**: `apps/web` and `apps/api` are fully decoupled but share code via monorepo packages.
- [x] **Shared Packages**: `schemas`, `database`, `types`, and `trpc` client are all properly abstracted.
- [x] **Creator Authentication**: Users can register, log in, verify emails, and manage sessions securely (JWT).
- [x] **Form Management**: Complete CRUD operations for forms and fields.
- [x] **Dynamic Validations**: Fields dynamically validated using Zod, handling minimum/maximum requirements.
- [x] **Field Types**: Support for short text, long text, email, number, single select, multi select, checkbox, rating, date, and layer break (pagination).
- [x] **Public Form Submissions**: Users can submit without logging in.
- [x] **Public / Unlisted Visibility**: Public forms appear in the "Explore" directory. Unlisted forms are hidden but accessible via direct link.
- [x] **Unpublished Handling**: Gracefully handles unpublished or expired forms, preventing submission.
- [x] **Analytics**: Form builders can review analytics and export CSV responses.
- [x] **Sample Forms Seed**: Database includes an automated seed script `pnpm db:seed` with 3 themed forms and responses.
- [x] **Landing / Pricing Pages**: Implemented natively in Next.js (`/` and `/#pricing`).
- [x] **Thank You Confirmation**: Successful form submissions trigger a beautiful confirmation view natively in the Form Runner.
- [x] **Rate Limiting**: Public submission APIs (`/api/responses/submit` and `/trpc/responses.submit`) are rate limited (30 req / min).
- [x] **Scalar API Docs**: Express backend serves the Scalar API Explorer at `/docs`.

---

## Local Development & Setup

### Prerequisites
- Node.js 20+
- pnpm 8+
- PostgreSQL instance running

### Steps

1. **Install dependencies**:
   ```sh
   pnpm install
   ```

2. **Environment Variables**:
   Configure `.env` files in both `/apps/web` and `/apps/api` based on `.env.example`.
   Crucially, you need a PostgreSQL connection URL (`DATABASE_URL`).

3. **Database Migration & Seed**:
   Run Drizzle migrations and seed the required initial forms and users.
   ```sh
   cd packages/database
   pnpm db:push
   pnpm db:seed
   cd ../..
   ```

4. **Start the Development Server**:
   ```sh
   pnpm dev
   ```
   - **Frontend**: Runs on `http://localhost:3000`
   - **API Server**: Runs on `http://localhost:8000`

---

## Demo Credentials

The database seed command (`pnpm db:seed`) creates two pre-configured demo users that you can use to log into the dashboard without registering.

### Architect (Primary Form Owner)
- **Email**: `demo@somnia.io`
- **Password**: `Demo@2025`

### Extractor (Admin / Collaborator)
- **Email**: `admin@somnia.io`
- **Password**: `Demo@2025`

---

## API Documentation

The backend API automatically generates an OpenAPI specification using `tRPC-OpenAPI` and hosts an interactive `Scalar` API documentation viewer.

- **Frontend Redirect**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **Direct Backend Link**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **OpenAPI Spec**: [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)

> **Note**: For local development, if you hit `/api/docs` on the Next.js app, it will transparently redirect you to the backend's `/docs` scalar interface.
