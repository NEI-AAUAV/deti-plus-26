# DETI+ 2026

Landing site for **DETI+ 2026**, the company fair organized by DETI's student
associations — NEEETA, NEI and NEECT — at the Universidade de Aveiro
(September 29–October 1, 2026).

Built with Next.js (static export) and Tailwind CSS, published to GitHub Pages at
<https://nei-aauav.github.io/deti-plus-26>.

## Requirements

- Node.js 20.9+ (`.nvmrc` pins 22.13.0)
- pnpm 10 — `corepack enable` picks the version from `packageManager`

## Getting started

```bash
corepack enable
pnpm install
pnpm dev
```

The dev server runs at <http://localhost:3000/deti-plus-26>. The `basePath` is
part of the URL in every environment, so local and production paths match.

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Build the static export into `out/` |
| `pnpm lint` | Run ESLint |
| `pnpm test:e2e` | Run Playwright end-to-end + accessibility tests against `out/` |
| `pnpm test:e2e:update` | Refresh Playwright snapshots |
| `pnpm serve:export` | Serve `out/` locally on the production URL shape |
| `pnpm gen:brand-images` | Regenerate the favicon and Open Graph image |

## Testing

`pnpm build` must run first — the suite tests the real static export.

```bash
pnpm build
pnpm test:e2e            # smoke + a11y across Chromium, Firefox, WebKit, mobile
VISUAL=1 pnpm test:e2e   # additionally compare hero screenshots
```

Screenshot comparison is opt-in because baselines are rendered by the local OS
and would not match another platform's font rasterization. Regenerate them with
`VISUAL=1 pnpm test:e2e:update` and commit the result when a visual change is
intentional.

Accessibility is enforced with `@axe-core/playwright`: any serious or critical
WCAG 2.1 AA violation fails the build.

## Brand images

`app/icon.png`, `app/apple-icon.png` and `app/opengraph-image.png` are committed
files, not runtime routes — under `output: "export"` the dynamic `next/og`
variants emit extensionless files that GitHub Pages serves with the wrong
`Content-Type`. Re-run `pnpm gen:brand-images` after changing the brand and
commit the PNGs.

## CI/CD

- `.github/workflows/ci.yml` — lint, type check, build, Playwright, Lighthouse
  (performance/a11y/SEO budgets in `.github/lighthouse/`). Runs on every PR and
  on `main`.
- `.github/workflows/deploy.yml` — publishes `out/` to GitHub Pages, and only
  runs after CI succeeds on `main`. Can also be triggered manually.

## Docker

Serves the static export through Nginx on the same `/deti-plus-26` path used in
production:

```bash
docker compose up --build   # http://localhost:3000
```

## Tech stack

- Next.js 16 (static export, Turbopack)
- React 19
- Tailwind CSS 3
- Radix UI accordion (via shadcn/ui)
- TypeScript
- Playwright + axe-core
