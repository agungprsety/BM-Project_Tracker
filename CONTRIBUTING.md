# Contributing to SigiMarga

Thanks for your interest in contributing to SigiMarga! We welcome developers of all skill levels. To ensure a smooth process, please follow these guidelines.

## 🛠️ Development Setup

1. Fork and clone the repository.
2. Install dependencies: `npm install`.
3. Start the dev server: `npm run dev`.
4. Ensure you have the `React Developer Tools` and `TanStack Query Devtools` (if applicable) for a better debugging experience.

## 🤝 Contribution Workflow

1. **Find an Issue**: Look for open issues or open a new one to discuss an enhancement.
2. **Branching Strategy**: 
   - Use descriptive branch names: `feature/add-new-chart`, `fix/login-bug`, `docs/update-readme`.
   - Branch off from the `main` branch.
3. **Commit Messages**: 
   - Follow standard conventions (e.g., `feat: add PDF export`, `fix: correct progress calculation`).
   - Keep messages concise and descriptive.
4. **Pull Requests (PRs)**:
   - Provide a clear description of the changes.
   - Include screenshots or recordings for UI changes.
   - Ensure all tests and type-checks pass: `npm run build`.

## 🎨 Code Style & Standards

- **TypeScript**: All new code must be fully typed. Avoid using `any`.
- **Components**: Use functional components with hooks.
- **Styling**: Use utility-first Tailwind CSS.
- **Linting**: Run `npm run lint` before committing to ensure adherence to ESLint rules.

## 📄 Commit Standards (Summary)

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc.)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools and libraries

---

If you have any questions, please feel free to open a discussion issue!
