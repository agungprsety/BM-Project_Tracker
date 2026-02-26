# SigiMarga

<div align="center">

<img src="sigi_margafull_transparent.png" alt="SigiMarga Logo" width="400" />

**Digital Intelligence for Road Projects Management**

The professional monitoring ecosystem for Bina Marga Kota Jambi.
Trace every kilometer of progress with real-time geospatial tracking, automated S-Curves, and audit-ready documentation.

</div>

---

## 🚀 Key Features

### Automated Engineering Analytics
Stop fighting with Excel formulas. Upload your Bill of Quantities (BoQ) and let SigiMarga generate real-time S-Curves and financial absorption charts automatically.

### Geospatial Command Center
Visualize your city's growth. Our integrated Leaflet GIS allows you to pin projects, monitor regional distribution, and verify site conditions with GPS-tagged photo evidence.

### One-Click Audit Reports
Go from data to document in seconds. Export professional, branded PDF summaries for portfolio reviews or detailed individual project reports—formatted and ready for stakeholders.

### Dual-Engine Transparency

| Layer | Description |
|---|---|
| **Public Explore** | A read-only dashboard allowing anyone to track road improvements, view site photos, and see where their tax Rupiahs are at work. No login, no friction. |
| **Staff Portal** | A high-performance workspace for authorized personnel. Manage contractors, update weekly work logs, and oversee the entire project lifecycle with real-time data syncing. |

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS, Inter Font |
| **State** | TanStack React Query (server state), Zustand (UI state) |
| **Backend** | Supabase (PostgreSQL + Auth + Storage + Row Level Security) |
| **Charts & Maps** | Recharts, React-Leaflet |
| **Reporting** | jsPDF, jsPDF-AutoTable |
| **Icons** | Lucide React |

## 🔒 Security Model

| Role | Permissions |
|---|---|
| **Public (anon)** | `SELECT` only — can view the Explore dashboard and project details. |
| **Authenticated (staff)** | Full `SELECT`, `INSERT`, `UPDATE`, `DELETE` on all tables and storage. |

Row Level Security (RLS) on PostgreSQL enforces all access control at the database level. The Anon Key is safe to expose; the **Service Role Key** must never be used in the frontend.

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
├── lib/              # DB service, Supabase client, PDF export, utilities
├── pages/            # Landing, Login, Dashboard, ProjectForm, ProjectDetail,
│                     # ProjectView, PublicDashboard
├── store/            # Zustand store (dark mode, UI preferences)
└── types/            # TypeScript interfaces & enums
```

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

Made with ❤️ for Bina Marga Kota Jambi

</div>
