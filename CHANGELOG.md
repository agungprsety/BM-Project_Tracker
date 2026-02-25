# Changelog

All notable changes to the **SigiMarga** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
