# SigiMarga

A professional construction project monitoring system designed for Bina Marga (Public Works) departments. Tracing every kilometer of progress with real-time tracking, financial summaries, and technical documentation.

## 🚀 Key Features

- **Dynamic Dashboard**: 
  - Real-time project health distribution (histogram-based status).
  - Searchable, sortable, and paginated project list for large portfolios.
  - Multi-level filtering by progress, region (Kecamatan/Kelurahan), and contractor.
- **Progress Tracking**:
  - Detailed Bill of Quantities (BoQ) management.
  - Weekly reporting system with per-item progress tracking.
  - Automatic S-Curve generation (Planned vs. Actual).
- **Professional Reporting**:
  - Export "All Projects Summary" to PDF with branding and portfolio-wide stats.
  - Export "Individual Project Details" to PDF including financial summaries, BoQ status, and progress history.
- **Geospatial & Visuals**:
  - Integrated Leaflet map for project location tracking.
  - Photo gallery for site documentation with per-report association.

## 🛠️ Tech Stack

- **Core**: React 18, TypeScript, Vite
- **State Management**: React Query (Data Fetching/Caching), Zustand (App UI State)
- **Database**: Dexie.js (IndexedDB for offline-first capabilities)
- **Styling**: Tailwind CSS
- **Charts & Maps**: Recharts, React-Leaflet
- **Reporting**: jsPDF, jsPDF-AutoTable
- **Icons**: Lucide-React

## 📦 Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/sigimarga.git
   cd sigimarga
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## 📂 Project Structure

- `src/components`: UI components (Button, Input, Card) and Features (BoQ, S-Curve, Map).
- `src/lib`: Core logic, database services, PDF export service, and formatting utilities.
- `src/pages`: Main application views (Dashboard, Project Detail, Project Form).
- `src/data`: Static reference data (e.g., Jambi District/Sub-district hierarchy).
- `src/hooks`: Custom React hooks for data fetching and state.
- `src/types`: TypeScript interfaces and enums.

## 📄 License

This project is licensed under the MIT License.
