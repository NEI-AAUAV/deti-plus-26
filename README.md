# DETI+ 2026

Landing site for DETI+ 2026, the dynamic company fair organized by DETI's student associations (NEI-AAUAV).

Built with Next.js (static export) and Tailwind CSS, deployed to GitHub Pages.

## Requirements

- Node.js 20+
- pnpm 9+

## Getting started

```bash
pnpm install
pnpm dev
```

App runs at `http://localhost:3000`.

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Build the static export (`out/`) |
| `pnpm start` | Serve the production build locally |
| `pnpm lint` | Run ESLint |

## Deployment

Pushes to `main` trigger `.github/workflows/deploy.yml`, which lints, type-checks, builds the static export, and publishes it to GitHub Pages.

A `Dockerfile` and `docker-compose.yml` are also provided to serve the static export via Nginx for local/alternative hosting.

## Tech stack

- Next.js 16 (static export)
- React 19
- Tailwind CSS
- Radix UI + shadcn/ui components
- TypeScript
