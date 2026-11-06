# Aldo Tile Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 12-route static tile-installer website with sample content, strong local SEO, a working Netlify form, and guardrails that let a non-technical person redesign it through Codex.

**Architecture:** Astro builds plain HTML with no client framework. Looks live in one tokens file, words live in content and data files, and SEO and form logic live in protected components. Two Node tools guard the project: a site audit that inspects the built HTML, and a launch guard that blocks production builds while sample content remains.

**Tech Stack:** Node 24, Astro 7.4.5, `@astrojs/sitemap` 3.7.x, `@astrojs/check` 0.9.x, TypeScript 6 (`@astrojs/check` doesn't accept 7), sharp, Vitest 5, Playwright 1.64 with `@axe-core/playwright`, cheerio, `@lhci/cli`, Fontsource fonts, Netlify Forms.

**Spec:** `docs/superpowers/specs/2026-11-04-aldo-tile-website-design.md`. Read it before starting.

**Verified in a scratch build on 2026-11-04:** this toolset installs and works together. `<Image>` with `widths` and `sizes` produces WebP with `srcset`, width and height (`formats` is not an `<Image>` prop). `build.format: 'directory'` gives `/thank-you/index.html`. The sitemap filter works. `data-netlify` survives into built HTML. Axe runs through Playwright. On Fedora, Playwright prints an "OS not officially supported" warning but works.

## Global Constraints

- **No commits or pushes.** Claude runs `git init` only and leaves all changes uncommitted. This overrides any commit step in the executing skills. The owner commits.
- The site must work with JavaScript off. No React or other client framework.
- `_old-drafts/` never reaches the repo. Real Aldo photos, old AI images and Unsplash links are not used in this build.
- Business facts are never hard-coded in components. They come from `src/data/business.json`.
- No `aggregateRating` or `Review` structured data anywhere.
- No street address anywhere. Structured data uses Mississauga, ON, CA only.
- Sample values: phone `(647) 555-0100` / `+16475550100`, email `hello@example.com`, site `https://aldotile.example`.
- Brand: navy `#091e2b`, gold `#b6812a`, gold text `#9a6618` (spec's `#9c6719` adjusted by a recorded ruling, because it measured 4.49:1 on off-white), off-white `#f8f7f5`, line `#d8d3ca`, muted text `#4d5760`.
- Mobile targets: LCP under 2.5s; Lighthouse Performance 90+, Accessibility 95+, SEO 100.
- Everything runs on Windows and Linux: Node scripts only for tooling, `node:path` for paths, no bash in npm scripts.
- Very few code comments, only for non-obvious reasons.
- Error messages from tools are plain language and say what to do.
- UI work: `frontend-design` decides the look; `ui-ux-pro-max` checks usability. Don't copy its palettes or fonts blindly.

## Review Focus

- **Real phone photos with awkward shapes** (tall 1200x1600 shots): cards keep a steady shape and crop predictably. Pinned in Task 9.
- **A 320px phone with the sticky call bar**: no sideways scrolling, and the bar never hides the form's submit button or footer links. Pinned in Task 10.
- **Going live with samples removed and no reviews yet**: no empty sections, no banner, no `noindex`. Pinned in Task 11's launch rehearsal.
- **Someone filling the form badly or by keyboard**: browser validation blocks missing required fields, a blank optional email is accepted, and the honeypot is unreachable by keyboard. Pinned in Task 7.
- **Windows line endings and folder names with spaces**: sample detection handles CRLF files, and the checks run on Windows. Pinned in Task 2 and in Task 10's CI matrix.

---

## File Structure

```text
AGENTS.md  START-HERE.md  README.md
docs/launch-checklist.md  docs/owner-setup.md
design-system/aldo-tile/MASTER.md
astro.config.mjs  tsconfig.json  vitest.config.ts  playwright.config.ts
lighthouserc.json  netlify.toml  package.json  .nvmrc  .gitignore  .gitattributes
.github/workflows/check.yml
public/favicon.svg
scripts/check.mjs                  runs every check in order
scripts/audit-site.mjs             CLI around lib/audit-rules
scripts/launch-check.mjs           CLI around lib/launch-rules
scripts/launch-guard.mjs           blocks a build when launchReady is true and samples remain
scripts/launch-rehearsal.mjs       builds a temp copy as if launched, then audits it
scripts/generate-placeholders.mjs  writes sample images (run once, output kept in repo)
scripts/lib/audit-rules.mjs
scripts/lib/launch-rules.mjs
src/content.config.ts
src/data/business.json             business facts and launchReady
src/data/copy.json                 page words not in collections
src/content/services/<slug>.md
src/content/projects/<slug>/index.md plus photos
src/content/reviews/<slug>.json
src/assets/logo.svg  logo-on-dark.svg  sample-hero.jpg
src/styles/tokens.css  global.css
src/lib/seo.ts                     PROTECTED: pure SEO helpers
src/components/seo/Seo.astro       PROTECTED
src/components/ContactForm.astro   PROTECTED: delivery attributes
src/components/...                 visual components, free to change
src/layouts/BaseLayout.astro
src/pages/...                      routes
tests/unit/*.test.ts  tests/browser/*.spec.ts
```

## Task 1: Project shell

**Files:** Create everything in the config row above except `lighthouserc.json`, `playwright.config.ts` and the workflow; `src/data/business.json`; `src/content.config.ts`; `src/pages/index.astro` (temporary); `tests/unit/business.test.ts`. Move all loose drafts.

**Interfaces — Produces:** `business.json` and the collection schemas below, used by every later task.

- [ ] **Step 1: Move old files safely.** Move every `.html`, `.jpeg` and `.png` from the project root into `_old-drafts/`, keeping `docs/`. Run `ls _old-drafts | wc -l`. Expected: `15`. Nothing is deleted.

- [ ] **Step 2: Create repo files.** Run `git init -b main`. `.gitignore` must contain `_old-drafts/`, `node_modules/`, `dist/`, `.astro/`, `.lighthouseci/`, `test-results/`, `playwright-report/`, `.env*`, `.netlify/`. `.gitattributes`: `* text=auto eol=lf`, plus binary rules for images and fonts. `.nvmrc`: `24`. Run `git check-ignore _old-drafts/aldo-tile.html`. Expected: prints the path.

- [ ] **Step 3: Install.** Use the Tech Stack packages with `"engines": {"node": ">=24"}` and `"private": true`. Keep `package-lock.json`. Scripts:

```json
{"dev":"astro dev","build":"node scripts/launch-guard.mjs && astro build","preview":"astro preview",
 "check":"node scripts/check.mjs","audit":"node scripts/audit-site.mjs",
 "launch:check":"node scripts/launch-check.mjs","launch:rehearsal":"node scripts/launch-rehearsal.mjs",
 "test":"vitest run"}
```

- [ ] **Step 4: Write `src/data/business.json`.**

```json
{
  "launchReady": false,
  "name": "Aldo Tile",
  "baseCity": "Mississauga", "province": "ON", "country": "CA",
  "siteUrl": { "value": "https://aldotile.example", "sample": true },
  "phone": { "display": "(647) 555-0100", "e164": "+16475550100", "sample": true },
  "email": { "value": "hello@example.com", "sample": true },
  "areasServed": { "value": ["Mississauga", "Brampton", "Oakville", "Etobicoke"], "sample": true },
  "yearsExperience": { "value": 15, "sample": true },
  "credentials": { "value": ["Fully insured", "WSIB coverage"], "sample": true }
}
```

- [ ] **Step 5: Configure Astro.** `astro.config.mjs` imports `business.json` with `{type:'json'}` and sets `site: business.siteUrl.value`, `trailingSlash: 'always'`, `build.format: 'directory'`, and the sitemap integration with a filter excluding `/thank-you/`. `tsconfig.json` extends `astro/tsconfigs/strict` and excludes `dist` and `_old-drafts`. `netlify.toml`: build `npm run build`, publish `dist`, long immutable cache for `/_astro/*`, and `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` headers.

- [ ] **Step 6: Define collections in `src/content.config.ts`.** Use `glob` loaders; `z` comes from `astro/zod`.

```ts
services: glob '*.md' in src/content/services
  { title, metaTitle, metaDescription, h1, summary, order: number, sample: boolean,
    highlights: string[], faqs: {q: string, a: string}[] }
projects: glob '*/index.md' in src/content/projects, id = folder name
  { title, city, service: reference('services'), projectType: 'home'|'commercial', tileType, summary,
    metaDescription, order: number, sample: boolean, photos: {src: image(), alt: string}[] (min 1) }
reviews: glob '*.json' in src/content/reviews
  { author, city, text, sample: boolean }
```

Service IDs and filenames: `bathroom-shower-tile-installation`, `floor-tile-installation`, `kitchen-backsplash-installation`, `commercial-tile-installation`.

- [ ] **Step 7: Write `tests/unit/business.test.ts`.** Tests: `samples imply launchReady false`; `phone sample uses the fictional number` (when `phone.sample` is true, `e164 === '+16475550100'`); `every changeable fact has a sample flag` (`siteUrl`, `phone`, `email`, `areasServed`, `yearsExperience`, `credentials`).

- [ ] **Step 8: Verify.** Run `npm test`, then `npx astro check`, then `npx astro build` with a temporary one-line homepage. Expected: all pass, `dist/index.html` exists. The temporary guard file can be an empty script until Task 2.

## Task 2: Launch safety

**Files:** Create `scripts/lib/launch-rules.mjs`, `scripts/launch-check.mjs`, `scripts/launch-guard.mjs`, `tests/unit/launch-rules.test.ts`.

**Interfaces — Produces:** `findLaunchProblems(rootDir: string): Promise<{file: string, message: string}[]>`; `isLaunchReady(rootDir: string): Promise<boolean>`.

- [ ] **Step 1: Write failing tests** using temp fixture folders:
  - `finds sample true in markdown frontmatter`, including a CRLF-ending file and a folder path containing a space.
  - `finds sample true in JSON` and nested `"sample": true` in `src/data/*.json`.
  - `finds sample phone, email and .example address` anywhere under `src/`, including `555-0100`, `5550100`, `example.com`, `.example`.
  - `finds sample-prefixed image files`.
  - `reports each problem with file and plain message` such as `Phone number is still a sample. Replace it in src/data/business.json.`
  - `returns no problems for clean content`.

- [ ] **Step 2: Run** `npx vitest run tests/unit/launch-rules.test.ts`. Expected: FAIL, module not found.

- [ ] **Step 3: Implement the rules.** Scan `src/` only. Don't use a YAML parser for detection: match `/^sample:\s*true\s*$/m` in `.md`, and walk parsed JSON for `sample === true`.

- [ ] **Step 4: Implement the CLIs.** `launch-check` prints a numbered list and exits 1 if problems exist, otherwise prints `Ready to launch.`. `launch-guard` exits 0 silently when `launchReady` is false. When true, it runs the rules and on any problem prints `launchReady is on, but sample content remains:` plus the list, and exits 1.

- [ ] **Step 5: Verify.** Run `npm test`. Run `npm run launch:check`: expected exit 1 listing the business samples. Temporarily set `launchReady` to true and run `npm run build`: expected FAIL before Astro starts. Restore to false.

## Task 3: SEO foundation

**Files:** Create `src/lib/seo.ts`, `src/components/seo/Seo.astro`, `src/pages/robots.txt.ts`, `src/layouts/BaseLayout.astro` (structure only; styling arrives in Task 6), `tests/unit/seo.test.ts`.

**Interfaces — Produces:**

```ts
robotsContent(launchReady: boolean, pageNoindex: boolean): 'index,follow' | 'noindex,follow'
canonicalUrl(siteUrl: string, path: string): string
localBusinessSchema(business): object   // @type HomeAndConstructionBusiness, @id `${siteUrl}/#business`
serviceSchema(business, {name, description, path}): object
breadcrumbSchema(siteUrl, items: {name: string, path: string}[]): object
```

`BaseLayout` props: `{title: string, description: string, path: string, schema?: object[], noindex?: boolean, ogImage?: ImageMetadata}`. In this task it renders `<html lang="en">`, Seo, a skip link and `<main id="main">`. Task 6 adds PreviewBanner, Header, Footer and MobileCallBar. `ogImage` defaults to `src/assets/sample-hero.jpg` once Task 5 adds it.

- [ ] **Step 1: Write failing tests.**
  - `robots is noindex until launch`, and `noindex page stays noindex after launch`.
  - `canonical always has a trailing slash`.
  - `local business has no street address`: `address` has locality `Mississauga`, region `ON`, country `CA`, and no `streetAddress`.
  - `local business lists areas served as cities`.
  - `schemas never include ratings or reviews`: serialized output contains neither `aggregateRating` nor `"Review"`.
  - `service links to the business by @id`.
  - `breadcrumb positions start at 1 and use absolute URLs`.

- [ ] **Step 2: Run** the tests. Expected: FAIL.

- [ ] **Step 3: Implement `seo.ts`, `Seo.astro` and `BaseLayout`.** Seo outputs title, description, canonical, robots, viewport, `og:title`, `og:description`, `og:url`, `og:type`, `og:image`, `twitter:card`, favicon and JSON-LD. Serialize JSON-LD with `<` escaped as `<`. `robots.txt.ts` allows crawling (so Google can see `noindex`) and points to `${siteUrl}/sitemap-index.xml`.

- [ ] **Step 4: Verify.** Run `npm test` and `npx astro build`. Inspect `dist/index.html`: expected `noindex,follow`, canonical `https://aldotile.example/`.

## Task 4: Site audit and `npm run check`

**Files:** Create `scripts/lib/audit-rules.mjs`, `scripts/audit-site.mjs`, `scripts/check.mjs`, `tests/unit/audit-rules.test.ts`, `vitest.config.ts` (unit tests only).

**Interfaces — Produces:**

```ts
type Problem = { where: string, message: string }
auditPage(html: string, route: string, opts: {launchReady: boolean, siteUrl: string, phoneE164: string}): Problem[]
auditForm(html: string): Problem[]
auditSite(distDir: string, businessPath: string): Promise<Problem[]>
REQUIRED_ROUTES: string[]  // the 10 fixed routes; at least one /projects/<slug>/ and /404.html are checked separately
```

- [ ] **Step 1: Write failing tests** with one good HTML fixture, then remove one thing at a time and assert the matching problem:
  - **Page basics:** `lang`; viewport; exactly one `h1`; title 10–65 characters; description 50–165 characters; canonical matching the route on `siteUrl`; the four `og:` tags.
  - **Robots:** noindex when `launchReady` is false; `/thank-you/` and `/404.html` always noindex; others indexable when launched.
  - **Structured data:** every JSON-LD block parses; home has `HomeAndConstructionBusiness`; `/services/*` has `Service`; every inner page has `BreadcrumbList`; `aggregateRating` or `Review` anywhere is a problem.
  - **Images:** every `img` has `alt`, `width` and `height`.
  - **Contact:** every page has a `tel:` link matching `phoneE164`.
  - **Form on `/contact/`:** `name="contact"`, `method="POST"`, `data-netlify="true"`, `netlify-honeypot="bot-field"`, `action="/thank-you/"`, and fields `bot-field`, `name`, `phone`, `email`, `city`, `projectType`, `service`, `message`.
  - **Site-wide:** unique titles and descriptions; internal links resolve to built files; every required route exists; `sitemap-index.xml` and `robots.txt` exist; the sitemap excludes `/thank-you/`; **service pages differ**, meaning word-trigram overlap between any two service pages' `<main>` text is under 50%.
  - **Message style test:** `form problem message tells you what to restore`, for example `The contact form on /contact/ lost data-netlify="true". Without it, messages won't be delivered. Put it back in src/components/ContactForm.astro.`

- [ ] **Step 2: Run** the tests. Expected: FAIL.

- [ ] **Step 3: Implement with cheerio.** `audit-site.mjs` takes an optional dist path (default `dist`), prints problems as a numbered list, exits 1 if any exist, otherwise prints `Site audit passed: N pages.`

- [ ] **Step 4: Implement `check.mjs`.** Run steps in order with `spawnSync` (`shell: true` for Windows): `astro check`, `vitest run`, `astro build` via `npm run build`, `audit`, then Playwright if `playwright.config.ts` exists. Stop at the first failure and print `Step failed: <plain name>. Read the messages above, fix the cause, and run npm run check again.` On success print `All checks passed.`

- [ ] **Step 5: Verify.** Run `npm test`, expected PASS. Run `npm run check`, expected FAIL at the audit with a list of missing pages. Pages are added in Tasks 7–9.

## Task 5: Sample content

**Files:** Create `scripts/generate-placeholders.mjs`, `src/data/copy.json`, 4 services, 8 projects with images, 3 reviews, `src/assets/sample-hero.jpg`, `tests/unit/content.test.ts`.

**Interfaces — Produces:** `copy.json` top-level keys `sample`, `home`, `about`, `contact`, `thankYou`, `notFound`, `privacy`. Each page key holds `metaTitle`, `metaDescription`, `h1`, plus that page's own sections.

- [ ] **Step 1: Write failing tests.**
  - `every content item has a boolean sample flag` for services, projects and reviews, plus `copy.json`. These tests must stay true after launch: never assert that everything is a sample.
  - `each service has at least 2 projects`.
  - `service bodies are at least 200 words`.
  - `project cities are city names only` (no digit in `city`).
  - `sample photos have sample- filenames and non-empty alt text`.
  - `at least 2 photos are portrait`, because real phone photos often are.

- [ ] **Step 2: Run** the tests. Expected: FAIL.

- [ ] **Step 3: Generate images.** The script uses sharp to rasterize SVG tile patterns (varied by service and using brand-compatible greys) with a clear "Sample photo" label, as JPEG at 1600x1200, 1200x1600 (portrait) and a 2000x1200 hero. Files must be named `sample-*.jpg`. Run it once and keep the output.

- [ ] **Step 4: Write copy.** Titles include the service and Mississauga, such as `Bathroom & Shower Tile Installation in Mississauga | Aldo Tile`. Each service page is written from scratch for its audience; the commercial page speaks to contractors and businesses and covers scheduling, coordination and larger areas. Projects use city-level locations only. Reviews read as samples, and the UI labels them. Privacy copy states what the form collects (the seven visible fields), that it's emailed to Aldo Tile and stored by Netlify, that it's used only to reply about the job, and that people can ask for deletion through the site's email.

- [ ] **Step 5: Verify.** Run `npm test` and `npx astro check`. Expected: PASS.

## Task 6: Visual foundation

**Files:** Create `src/styles/tokens.css`, `src/styles/global.css`, `src/assets/logo.svg`, `src/assets/logo-on-dark.svg`, `public/favicon.svg`, `design-system/aldo-tile/MASTER.md`, and components `Header`, `Footer`, `MobileCallBar`, `PreviewBanner`, `Logo`, `CallLink`, `Breadcrumbs`, `CtaBand`, `Button`; `tests/unit/tokens.test.ts`.

**Interfaces — Produces:** CSS variables used everywhere: `--color-ink`, `--color-accent`, `--color-accent-text`, `--color-surface`, `--color-line`, `--color-muted`, `--font-display`, `--font-body`, `--space-*`, `--radius-*`, `--grout`. Component props: `CallLink {variant?: 'plain'|'button'}`, `Breadcrumbs {items: {name, path}[]}`, `CtaBand {heading, text}`.

- [ ] **Step 1: Invoke `frontend-design`**, then decide type, layout personality and tile-inspired details within the brand. Reference `_old-drafts/Aldo Tile_ Form & Space Homepage.png` and `_old-drafts/Aldo_Tile_Website_Preview.html`. Layouts must suit real, slightly imperfect job photos.

- [ ] **Step 2: Invoke `ui-ux-pro-max`, then persist the design.** Run from the project root: `python3 ~/.claude/skills/ui-ux-pro-max/scripts/search.py "tile installation contractor local service premium" --design-system -p "Aldo Tile" --persist --output-dir .`. Rewrite `MASTER.md` so it records the actual brand tokens and fonts chosen, not the tool's suggested palette.

- [ ] **Step 3: Write the failing test** `tests/unit/tokens.test.ts`: `components use tokens, not hard-coded colours or fonts`. It scans `src/components`, `src/layouts`, `src/pages` and `src/styles/global.css`, failing on hex or `rgb(` colours or `font-family:` with a named font. It also has `changing main colour needs only tokens.css`, asserting `--color-accent` is defined only in `tokens.css`.

- [ ] **Step 4: Run** the test, then build tokens and global CSS. Self-host fonts through Fontsource. Default interactive targets are at least 44px and focus states are visible. Honour `prefers-reduced-motion`.

- [ ] **Step 5: Redraw the logo as SVG.** Trace the A, tile grid and gold arc from `_old-drafts/Aldo Tile Installation Logo.png`, with lettering converted to outlines so it needs no font. Do any conversion in the scratchpad; add no project dependency. The dark version uses a light A and light lettering. The favicon uses the mark only. Compare side by side with the PNG.

- [ ] **Step 6: Build the shared components and wire them into `BaseLayout`.** Header and Footer both show the phone through `CallLink`. `MobileCallBar` shows only under 760px; `main` and footer get enough bottom padding so it never hides content. `PreviewBanner` renders only when `launchReady` is false, with the text `Preview: sample content`.

- [ ] **Step 7: Verify.** Run `npm test`, and view the temporary page at 390px and 1280px widths. Expected: PASS; the header, banner, footer and call bar look right.

## Task 7: Contact and small pages

**Files:** Create `src/components/ContactForm.astro`, routes `src/pages/contact/index.astro`, `thank-you/index.astro`, `privacy/index.astro`, `about/index.astro`, `404.astro`; `tests/browser/form.spec.ts`; `playwright.config.ts` (projects `phone` at 390x844 and `desktop` at 1280x800, `webServer` running `npm run preview`, Chromium).

**Interfaces:**
- Consumes: `BaseLayout`, `Breadcrumbs`, `business.json`, `copy.json`, `breadcrumbSchema`, `localBusinessSchema`.
- Produces: `ContactForm` with props `{services: {id: string, title: string}[]}`. It is the only form on the site.

- [ ] **Step 1: Write failing browser tests.**
  - `empty form is blocked by the browser`: submit stays on `/contact/` and `name` matches `:invalid`.
  - `blank optional email is accepted`: with name, phone and message filled, all fields report valid.
  - `invalid email shows as invalid`.
  - `honeypot is unreachable`: `bot-field` is not visible and has `tabindex="-1"`.
  - `form works with JavaScript off`: in a no-JS context, the form's fields are all visible and the action is `/thank-you/`.
  - `every field has a label and tab order follows the visual order`.

- [ ] **Step 2: Run** `npx playwright test tests/browser/form.spec.ts`. Expected: FAIL.

- [ ] **Step 3: Implement `ContactForm`.** The form tag is exactly:

```html
<form name="contact" method="POST" action="/thank-you/" data-netlify="true" netlify-honeypot="bot-field">
```

Field order: `name` (required), `phone` (required, `type="tel"`), `email` (optional, `type="email"`, needed for Netlify's reply-to), `city`, `projectType` (select: Home, Commercial), `service` (select: all services plus "Something else"), `message` (required). Add a hidden `subject` input, `New tile enquiry from the website`. The honeypot is wrapped in a CSS-hidden paragraph with a label, plus `tabindex="-1"` and `autocomplete="off"`. Include a small privacy link. Add `autocomplete` values. No client script is needed.

- [ ] **Step 4: Build the pages.** `/thank-you/` and `404` pass `noindex`. `404` includes helpful links and the phone. Contact shows form, phone, email and areas served. About uses experience and credentials from `business.json` and shows `localBusinessSchema`. Inner pages include breadcrumbs.

- [ ] **Step 5: Verify.** Run `npx playwright test tests/browser/form.spec.ts`. Expected: PASS.

## Task 8: Home and service pages

**Files:** Create `src/pages/index.astro` (replace temporary), `src/pages/services/[slug]/index.astro`, components `Hero`, `ServiceCard`, `ReviewCard`, `ReviewsSection`, `ProjectCard`, `Faq`; `tests/browser/pages.spec.ts`.

**Interfaces:**
- Consumes: collections, `copy.json`, `serviceSchema`, `breadcrumbSchema`, `localBusinessSchema`.
- Produces: `ProjectCard {project}` and `ReviewsSection {reviews}`, reused by Task 9. `ReviewsSection` renders nothing when `reviews` is empty.

- [ ] **Step 1: Write failing tests.**
  - `home names the service and city in the h1 or lead`.
  - `home links to all 4 service pages and contact`.
  - `service page shows only its own projects' photos and links back to contact`.
  - `sample reviews are visibly labelled`: every review card contains `Sample review` while `sample` is true.

- [ ] **Step 2: Run** the tests. Expected: FAIL.

- [ ] **Step 3: Build home.** Order: hero (`h1`, city, call button, form link), proof strip (facts from `business.json`), services, recent projects, reviews, areas served, CTA. The hero image is the LCP element: `loading="eager"`, `fetchpriority="high"`.

- [ ] **Step 4: Build the service template** using `getStaticPaths` over the services collection: `h1`, summary, Markdown body, highlights, related project cards, FAQs (visible only; no FAQ schema), CTA, plus `Service` and breadcrumb schema. Any script stays small; none is expected here.

- [ ] **Step 5: Verify.** Run `npx playwright test tests/browser/pages.spec.ts`, then look at home and one service at phone and desktop widths. Expected: PASS and complete-looking pages.

## Task 9: Projects

**Files:** Create `src/pages/projects/index.astro`, `src/pages/projects/[slug]/index.astro`, components `ProjectFilter`, `PhotoGallery`; `tests/browser/projects.spec.ts`.

**Interfaces — Consumes:** `ProjectCard`, projects collection, `breadcrumbSchema`.

- [ ] **Step 1: Write failing tests.**
  - `filter shows only the chosen service`: choosing Floors hides every non-floor card.
  - `filter works without JavaScript`, repeating that in a no-JS context.
  - `all projects are visible by default`.
  - `project page links to its service and to contact`.
  - `portrait and landscape photos produce same-height cards`: in the grid, cards in a row share a height, with no overflow.
  - `adding a project needs one folder only`: in a unit test, assert no project folder name appears in any file under `src/pages` or `src/components`.

- [ ] **Step 2: Run** the tests. Expected: FAIL.

- [ ] **Step 3: Implement.** The filter uses real radio inputs with `:has()` CSS and no script. Card images use a fixed `aspect-ratio` and `object-fit: cover`. Project pages show all photos, tile type, city, story, and links to the service and contact.

- [ ] **Step 4: Verify.** Run the spec, then `npm run check` up to and including the audit. Expected: audit reports `Site audit passed`.

## Task 10: Browser checks, CI and usability pass

**Files:** Create `tests/browser/a11y.spec.ts`, `tests/browser/layout.spec.ts`, `lighthouserc.json`, `.github/workflows/check.yml`. Modify anything these checks expose.

- [ ] **Step 1: Write failing tests.**
  - `a11y.spec.ts`: on every route, at both widths, `new AxeBuilder({page}).analyze()` returns no violations.
  - `layout.spec.ts`: `no sideways scrolling at 320px` on every route (`scrollWidth <= clientWidth`); `call bar is visible on phones and hidden on desktop`; `call bar never covers the form submit button when scrolled to it` (bounding boxes don't overlap) at 320px; `tap targets in header and call bar are at least 44px tall`; `site works without JavaScript`, with nav links and content present.

- [ ] **Step 2: Run** them and fix each finding in the page or component, keeping tokens as the place for colour fixes.

- [ ] **Step 3: Configure Lighthouse.** Use `staticDistDir: dist`, mobile preset, URLs for home, one service, projects and contact. Assert performance 0.9, accessibility 0.95, seo 1. Set `settings.skipAudits: ["is-crawlable"]`, since preview pages are intentionally `noindex` and would otherwise always fail the SEO score.

- [ ] **Step 4: Write the workflow.** Trigger on pull requests and pushes to `main`. Job `check` runs on a matrix of `ubuntu-latest` and `windows-latest`: checkout, setup-node from `.nvmrc`, `npm ci`, `npx playwright install --with-deps chromium`, `npm run check`. Job `lighthouse` on ubuntu: `npm run build`, `npx lhci autorun`. Look up current action major versions with `gh api repos/actions/checkout/releases/latest` and the same for `actions/setup-node`.

- [ ] **Step 5: Run the `ui-ux-pro-max` pre-delivery checklist** and fix what it finds.

- [ ] **Step 6: Verify.** Run `npm run check` and `npx lhci autorun`. Expected: all checks pass, Lighthouse meets its budgets.

## Task 11: Launch rehearsal

**Files:** Create `scripts/launch-rehearsal.mjs`. Add it to CI's `check` job after `npm run check`.

- [ ] **Step 1: Implement.** It copies the project to a temp folder, excluding `node_modules`, `dist`, `.git` and `_old-drafts`, then links the existing `node_modules` with `fs.symlink(target, path, 'junction')` so it also works on Windows. In the copy it swaps the sample values for `https://aldotile-rehearsal.ca`, a non-sample phone and email; sets every `sample` flag to false; deletes all reviews; renames `sample-` images and updates references; and sets `launchReady` true. Then it runs `vitest run`, the build and the audit in the copy.

- [ ] **Step 2: Assert in the script.** Build and audit pass. No page has the preview banner. Every normal page is `index,follow`; `/thank-you/` and `/404.html` stay `noindex`. Home has no empty reviews heading. Exit 1 on any failure.

- [ ] **Step 3: Verify the guard both ways.** Run `npm run launch:rehearsal`. Expected: PASS. Confirm the real project still has samples and `launchReady: false`.

## Task 12: Codex and owner documents

**Files:** Create `AGENTS.md`, `START-HERE.md`, `README.md`, `docs/launch-checklist.md`, `docs/owner-setup.md`; `tests/unit/docs.test.ts`.

- [ ] **Step 1: Check current facts first.** Read [Codex's Windows page](https://developers.openai.com/codex/app/windows) and [AGENTS.md guide](https://developers.openai.com/codex/guides/agents-md) so app names and install steps are accurate.

- [ ] **Step 2: Write the failing test** `tests/unit/docs.test.ts`:
  - `every file and script named in AGENTS.md exists`.
  - `AGENTS.md names every protected file`: `src/lib/seo.ts`, `src/components/seo/Seo.astro`, `src/components/ContactForm.astro`.
  - `START-HERE has no unexplained jargon`: words such as `repository`, `commit`, `branch`, `pull request` must appear only in its glossary or with a plain explanation beside them.

- [ ] **Step 3: Write `AGENTS.md`** covering every bullet in the spec's `AGENTS.md` section, in the same order. Include a table of "she wants to change X → edit file Y". Keep it short enough for Codex to hold in mind, under 150 lines.

- [ ] **Step 4: Write `START-HERE.md`** for a non-technical person on Windows, with everything in the spec's list. Include paste-ready prompts:
  - `Change the main colours to warmer gold and cream.`
  - `Show me two different ideas for the top of the homepage. Don't save either until I choose.`
  - `Make the site look like this screenshot, but keep Aldo's logo.`
  - `Undo my last change.`
  - `Add this new job: [photos], [city], [type of tile], [short description].`
  - `Replace the sample phone number with [number].`
  - `Save my work and give me a preview link.`
  - `A check failed. Explain it simply, fix it, and tell me what changed.`

- [ ] **Step 5: Write `docs/owner-setup.md`** with exact steps for Halil:
  1. Review, commit, then `gh repo create aldotile --public --source=. --push`.
  2. Protect `main`: require a pull request and the `check` job.
  3. Netlify: import from Git, then **enable form detection** under Forms and redeploy. Disable branch deploys except pull request previews.
  4. Set the Forms notification email in the Netlify dashboard. Test with a real address and full sentences, because Akismet (Netlify's spam filter) flags obvious test messages; check the spam list if one goes missing.
  5. Invite the wife as a GitHub collaborator.
  6. Her Windows setup: Node 24, Git, GitHub sign-in, Codex app, clone to a normal Windows folder (not WSL), `npm ci`, `npx playwright install chromium`, `npm run check`, `npm run dev`.
  7. Netlify credits: 300 per month, 15 per publish; merge changes in batches.

- [ ] **Step 6: Write `docs/launch-checklist.md`** per the spec: real details and photos, written permission for job photos, copy review with Aldo, buying the domain in Aldo's name, connecting it, updating `siteUrl`, form email, `npm run launch:check`, turning on `launchReady`, Search Console and sitemap, Google Business Profile with service area and hidden address, HomeStars with matching details, and a review request routine. Write `README.md` with overview, commands and `All rights reserved`.

- [ ] **Step 7: Verify.** Run `npm test`. Expected: PASS.

## Task 13: Acceptance

**Files:** No new product files. Keep backups of anything changed in the scratchpad and restore them.

- [ ] **Step 1: Prove the guardrails bite.** Copy `dist/` to the scratchpad and, one at a time, remove `data-netlify`, a `<title>` and a JSON-LD block from the copies. Run `node scripts/audit-site.mjs <copied-dist>` each time. Expected: each fails with a plain message. (`audit-site.mjs` accepts an optional dist path.)

- [ ] **Step 2: Confirm the launch state.** Run `npm run launch:check`, expected exit 1 with a list. Run `grep -L 'noindex,follow' $(find dist -name '*.html')`, expected no files.

- [ ] **Step 3: Test the redesign promise.** Back up `tokens.css`, change the accent colour and both fonts only in that file, and run `npm run check`. Colours with too little contrast should fail with a clear message; pick passing values. Confirm visually that the whole site changed. Restore the file.

- [ ] **Step 4: Test the instructions on a fresh reader.** Dispatch a fresh subagent with this brief: "You're Codex. Read only `AGENTS.md`. The user, who is not technical, says: make the homepage feel warmer and move reviews above projects. Work in a copy of the project in the scratchpad, follow the rules, and report where the instructions were unclear." Fix any confusion in `AGENTS.md`.

- [ ] **Step 5: Final run.** Run `npm run check`, `npx lhci autorun`, and `npm run launch:rehearsal`. Expected: all pass. Confirm with `git status` that no real photo, `_old-drafts` file or real contact detail is staged-ready, and that `git log` has no commits from Claude.

- [ ] **Step 6: Hand off.** Give the owner a phone and desktop preview of the result and point to `docs/owner-setup.md`. State plainly that real form delivery is unconfirmed until Netlify is connected.
