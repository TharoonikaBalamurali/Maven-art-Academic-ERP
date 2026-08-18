# Maven Art Academic ERP — Frontend

Web frontend for the Maven Art Academic ERP: two portals over one backend.

* **Management Portal** (`/management`) — Admin, Accounts, Faculty
* **Student / Parent Portal** (`/portal`) — Student, Parent

Built against *Maven Art Academic ERP — Frontend Architecture & Portal
Specification v1.0*, which is the authoritative requirements document.

## Status

**Day 1 — foundation complete.** Architecture, routing, authentication,
permissions, API layer, mock API, state separation, shared UI, forms, data
states, responsive layout, accessibility, tests and production build are in
place. **No business module is implemented yet**; every module from the
specification has a route, a permission guard and a navigation entry backed by a
placeholder page.

Authentication currently runs against an in-repo mock API. It is not security —
the backend remains the security boundary.

## Quick start

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:5173 and sign in with `admin@mavenart.test` (or any
account listed on the login screen). Password: `password`.

## Commands

```bash
npm run verify
```

Runs typecheck, lint, tests and the production build. See
[docs/frontend/DEVELOPMENT.md](docs/frontend/DEVELOPMENT.md) for the full list.

## Documentation

| Document | Contents |
| --- | --- |
| [ARCHITECTURE.md](docs/frontend/ARCHITECTURE.md) | Technology choices and why, project structure, auth/permission/state/API design |
| [DEVELOPMENT.md](docs/frontend/DEVELOPMENT.md) | Running the project, environment variables, how to add a module, backend integration steps |
| [ARCHITECTURE_REVIEW.md](docs/frontend/ARCHITECTURE_REVIEW.md) | Day 1 quality gate, known technical debt, deferred decisions, backend dependencies |

## Backend integration

Set `VITE_API_MODE=http` and `VITE_API_BASE_URL`, reconcile the
`TBD — BACKEND CONTRACT` markers in the `*.contract.ts` files, then delete
`src/mocks/`. No component, hook or service needs to change.
