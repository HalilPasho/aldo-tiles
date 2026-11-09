# Aldo Tile website

The website of Aldo Tile, a tile installer in Mississauga, Ontario. A small static site built with Astro and plain CSS, hosted on Cloudflare Pages, with a FormSubmit contact form. It works with JavaScript off.

It starts with sample content. While `launchReady` in `src/data/business.json` is `false`, every page is `noindex`. The owner-controlled preview banner is currently hidden. The design is meant to be reworked through Codex, OpenAI's coding agent.

- [START-HERE.md](START-HERE.md): plain-language guide for changing the site through Codex.
- [AGENTS.md](AGENTS.md): the rules Codex follows.
- [docs/owner-setup.md](docs/owner-setup.md): GitHub, Netlify and Windows setup.
- [docs/launch-checklist.md](docs/launch-checklist.md): from samples to the live site.
- [design-system/aldo-tile/MASTER.md](design-system/aldo-tile/MASTER.md): the design record.

See [Cloudflare setup and form activation](docs/cloudflare.md) for the current hosting workflow. Older Netlify instructions remain for legacy compatibility.

## Where things are

- `src/styles/tokens.css`: every colour, font, size and spacing value.
- `src/data/business.json`: business facts, each with a `sample` flag, plus `launchReady`.
- `src/data/copy.json`: page wording.
- `src/content/`: services, projects (one folder each, with photos) and reviews.
- `src/components/seo/Seo.astro` and `src/lib/seo.ts`: titles, robots, canonical and structured data.
- `src/components/ContactForm.astro`: the shared form; delivery and preview visibility are configured in `src/data/site-settings.json`.
- `scripts/`: the check, audit, launch check, launch guard and launch rehearsal.

## Commands

Node 24 (see `.nvmrc`). Everything runs on Windows and Linux.

| Command | What it does |
|---|---|
| `npm ci` | Install the locked dependencies |
| `npx playwright install chromium` | Install the browser the browser tests use (once) |
| `npm run dev` | Local site at http://localhost:4321/ |
| `npm run build` | Build to `dist/`. Refuses to build if `launchReady` is on while samples remain |
| `npm run preview` | Serve the built site |
| `npm test` | Unit tests only |
| `npm run audit` | Audit the built pages in `dist/` (SEO tags, structured data, images, links, form) |
| `npm run check` | Everything: code check, unit tests, build, audit, browser tests with accessibility scans |
| `npm run launch:check` | Lists every sample left. Fails until the site is ready to launch |
| `npm run launch:rehearsal` | Builds a temporary launched copy and runs every check on it, about a minute and a half. The project isn't touched |

GitHub runs `npm run check` and `npm run launch:rehearsal` on Linux and Windows for every pull request and push to `main`, plus Lighthouse with the budgets in `lighthouserc.json`. Netlify publishes `main` and builds a preview for each pull request.

A build with no reviews prints `[WARN] [content] The collection "reviews" does not exist or is empty. Please check your content config file for errors.` That's expected.

`npm audit` reports findings only in a development-only tool (`@lhci/cli`, which runs Lighthouse); the published site has none (`npm audit --omit=dev` finds 0).

## Rights

No licence is granted. © Aldo Tile. All rights reserved.
