# SigiMarga

<div align="center">

**A professional construction project monitoring system for Bina Marga (Public Works) departments.**

Tracing every kilometer of progress with real-time tracking, financial summaries, and technical documentation.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/agungprsety/sigimarga)

</div>

---

## 🚀 Key Features

| Feature | Description |
|---|---|
| **Staff Dashboard** | Real-time project health, searchable/sortable/paginated project list, multi-level filtering by progress, region, and contractor. |
| **Public Explore** | Read-only public view for stakeholders — no login required. |
| **Progress Tracking** | Detailed Bill of Quantities (BoQ) management, weekly reporting with per-item progress, and automatic S-Curve generation. |
| **PDF Reporting** | Export portfolio-level summaries or individual project detail reports to branded PDF documents. |
| **Geospatial & Visuals** | Leaflet-based map for project location tracking, photo gallery with Supabase Storage for site documentation. |
| **Authentication** | Supabase Auth with Row Level Security — public users can only read; staff can manage data. |

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS |
| **State** | TanStack React Query (server state), Zustand (UI state) |
| **Backend** | Supabase (PostgreSQL + Auth + Storage) |
| **Charts & Maps** | Recharts, React-Leaflet |
| **Reporting** | jsPDF, jsPDF-AutoTable |
| **Icons** | Lucide React |
| **Deployment** | Vercel |

## 📦 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- A [Supabase](https://supabase.com/) account (free tier works)

### 1. Clone & Install

```bash
git clone https://github.com/agungprsety/sigimarga.git
cd sigimarga
npm install
```

### 2. Set Up Supabase

1. Create a new project at [app.supabase.com](https://app.supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Run the schema script:
   ```
   supabase_schema.sql        → Creates tables, indexes, and triggers
   supabase_schema_secure.sql → Applies Row Level Security & Storage policies
   ```
4. Go to **Authentication** → **Add User** → create a staff account (check "Auto Confirm").

### 3. Configure Environment

Copy the example environment file and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

> **Where to find these:** Supabase Dashboard → Settings → API → `Project URL` and `anon public` key.

### 4. Run Development Server

```bash
npm run dev
```

### 5. Build for Production

```bash
npm run build
npm run preview  # Preview the production build locally
```

## 🌐 Deployment (Vercel)

1. Push your code to GitHub.
2. Import the repository into [vercel.com/new](https://vercel.com/new).
3. Add **Environment Variables** in Vercel's project settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy.

> **Note:** `vercel.json` is already configured with the correct output directory (`dist`) and SPA rewrites.

## 🔒 Security Model

| Role | Permissions |
|---|---|
| **Public (anon)** | `SELECT` only — can view the Explore dashboard and project details. |
| **Authenticated (staff)** | Full `SELECT`, `INSERT`, `UPDATE`, `DELETE` on all tables and storage. |

- The **Anon Key** is safe to expose in the frontend. Row Level Security (RLS) on PostgreSQL enforces all access control at the database level.
- The **Service Role Key** must **never** be used in the frontend.
- Photo uploads are stored in a Supabase Storage bucket (`project-photos`) with matching RLS policies.

## 📂 Project Structure

```
src/
├── components/
│   ├── features/     # BoQ, S-Curve, PhotoGallery, Weekly, Map, MapPicker
│   ├── layout/       # AppLayout, Navbar, ProtectedRoute
│   └── ui/           # Button, Card, Input, Select (design system)
├── contexts/         # AuthContext (Supabase Auth provider)
├── data/             # Static reference data (Jambi districts)
├── hooks/            # useProjects (React Query hooks)
├── lib/
│   ├── db.ts         # Supabase data service (CRUD + mapping layer)
│   ├── supabase.ts   # Supabase client initialization
│   ├── exportPdf.ts  # PDF generation logic
│   └── utils.ts      # Formatting, calculations, ID generation
├── pages/            # Landing, Login, Dashboard, ProjectForm, ProjectDetail,
│                     # ProjectView, PublicDashboard
├── store/            # Zustand store (dark mode, UI preferences)
└── types/            # TypeScript interfaces & enums
```

## 🧪 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint across the codebase |

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

Made with ❤️ for Bina Marga Kota Jambi

</div>
