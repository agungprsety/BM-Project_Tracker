# Contributing to SigiMarga

Thanks for your interest in contributing! We welcome developers of all skill levels.

## 🛠️ Development Setup

1. **Fork & clone** the repository.
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Set up Supabase** (see [README.md](README.md#2-set-up-supabase) for full instructions):
   - Create a Supabase project.
   - Run `supabase_schema.sql` and `supabase_schema_secure.sql` in the SQL Editor.
   - Create a staff user via Authentication → Add User.
4. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   Fill in your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
5. **Start the dev server:**
   ```bash
   npm run dev
   ```

## 🤝 Contribution Workflow

1. **Find or open an issue** to discuss the change you'd like to make.
2. **Create a branch** off `main` with a descriptive name:
   - `feature/add-new-chart`
   - `fix/login-redirect`
   - `docs/update-readme`
3. **Make your changes** and ensure they pass all checks:
   ```bash
   npm run lint      # ESLint
   npm run build     # TypeScript type-check + production build
   ```
4. **Submit a Pull Request** with:
   - A clear description of the changes.
   - Screenshots/recordings for any UI changes.
   - Reference to related issues (e.g., `Closes #12`).

## 🎨 Code Standards

| Area | Standard |
|---|---|
| **Language** | TypeScript — all new code must be fully typed. Avoid `any`. |
| **Components** | Functional components with React hooks. |
| **Styling** | Tailwind CSS utility classes. |
| **State** | React Query for server state, Zustand for UI state. |
| **Database** | All data access goes through `src/lib/db.ts`. Never call `supabase` directly from components. |
| **IDs** | Use `crypto.randomUUID()` via `generateId()` for all new entity IDs (Supabase requires UUID format). |
| **Naming** | `camelCase` in TypeScript, `snake_case` in SQL/Supabase. The mapping layer in `db.ts` handles translation. |

## 📝 Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Use |
|---|---|
| `feat:` | A new feature |
| `fix:` | A bug fix |
| `docs:` | Documentation only |
| `style:` | Formatting, whitespace (no logic changes) |
| `refactor:` | Code restructuring (no new features or fixes) |
| `perf:` | Performance improvements |
| `test:` | Adding or updating tests |
| `chore:` | Build process, dependencies, tooling |

## 🔒 Security Notes

- **Never** commit `.env` files or real API keys.
- **Never** use the Supabase `service_role` key in frontend code.
- All database access control is enforced by Row Level Security (RLS) policies — ensure new tables have appropriate RLS enabled.

---

Questions? Open a [Discussion](../../discussions) or an issue!
