# Changelog

All notable changes to the **SigiMarga** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-02-25

### Added
- **Supabase Backend**: Full migration from local IndexedDB (Dexie) to cloud PostgreSQL via Supabase.
- **Authentication**: Staff login system powered by Supabase Auth with session persistence.
- **Row Level Security (RLS)**: Database-level access control — public users can only read data; authenticated staff can manage all records.
- **Photo Storage**: Real photo uploads to Supabase Storage (`project-photos` bucket) replacing temporary browser object URLs.
- **Public Explore Page**: Read-only dashboard for stakeholders, accessible without authentication.
- **Protected Routes**: Staff-only pages (Dashboard, Project Form, Project Detail) wrapped with `ProtectedRoute` component.
- **Landing Page**: New public-facing landing page with navigation to Explore and Staff Login.

### Changed
- **Bundle Optimization**: Lazy-loaded all 7 page routes with `React.lazy()` and split vendor libraries into separate cacheable chunks via Vite `manualChunks`, eliminating the 500kB+ bundle warning.
- **ID Generation**: Switched from custom string IDs (`project_123...`) to proper `crypto.randomUUID()` UUIDs for Supabase compatibility.
- **Navigation Flow**: All staff actions (create, edit, delete, cancel) now correctly redirect to `/dashboard` instead of the Landing page, preventing perceived "logout" issues.
- **Navbar**: Staff controls (Dashboard, New Project, Sign Out) are now always visible when authenticated, regardless of current page. Logo link is context-aware: `/dashboard` for staff, `/` for visitors.
- **Data Layer**: `src/lib/db.ts` fully rewritten as a mapping layer translating between the UI's `camelCase` nested structure and Supabase's `snake_case` relational tables.

### Removed
- **Dexie.js**: Removed `dexie` and `dexie-react-hooks` dependencies — all data now comes from Supabase.

### Security
- Published `supabase_schema_secure.sql` with strict RLS policies for all 5 tables and the storage bucket.
- `.env` properly excluded from version control; `.env.example` provided for onboarding.

## [1.2.0] - 2026-02-25

### Added
- **Cascading Location Selects**: Added District (Kecamatan) and Sub-district (Kelurahan) dropdowns to the project form based on Kota Jambi reference data.
- **Enhanced Dashboard Filters**: Added district and sub-district filter dropdowns to the project dashboard.
- **Additional Data Fields**: Added `district` and `subDistrict` fields to the project model.
- **Rich Project Metadata**: Projects now track and display Consultant/Supervisor, Average Width, and Regional Classifications (District/Sub-district).
- **Clear All Filters**: Quick reset button for all dashboard table filters.

### Changed
- **Optimized Dashboard Table**: Added new columns for Consultant, District, and Sub-district. Enhanced search to match consultants.
- **Improved Navigation**: Redirecting to the individual project detail page after a successful edit instead of the main dashboard.
- **Scalable Dashboard Visuals**: Replaced vertical bar charts with a horizontal distribution histogram and a paginated/sortable project table to support 100+ projects.

## [1.1.0] - 2026-02-24

### Added
- **PDF Exporting**: Implementation of professional PDF reports using `jspdf` and `jspdf-autotable`.
- **All-Projects Summary Report**: Generates a portfolio-level PDF summary from the dashboard.
- **Individual Project Detail Report**: Generates a comprehensive technical and financial PDF report for a single project.
- **Weekly Progress Validation**: Added date range and quantity clamping to ensure progress data integrity.

### Changed
- **Refactored Progress Engine**: Shifted from BoQ-based progress input to a more granular Weekly Report-driven system.
- **Improved UI/UX**: Enhanced dark mode compatibility and responsive layouts for construction site use.

## [1.0.0] - 2026-02-20

### Added
- **Initial Release**: Basic project tracking with BoQ, basic Weekly Reports, and S-Curve visualization.
- **Storage**: Offline-first storage using IndexedDB via Dexie.js.
- **Mapping**: Basic Leaflet integration for project geolocation.
