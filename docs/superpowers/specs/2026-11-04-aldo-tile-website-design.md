# Aldo Tile website: design

Date: 2026-11-04

## Intent

Aldo Tile is a tile installation business in Mississauga, Ontario. It needs more visibility and more clients, so the site's job is to be found on Google, show real work, and turn visitors into calls and form messages.

This first build is a **foundation, not the final look**. It starts with sample content and a solid initial design. Afterwards, the owner's wife, who is not technical, will redesign it by talking to **Codex** (OpenAI's coding agent). The repo must let her do that safely, without silently breaking search visibility or the contact form.

## People

- **Aldo:** the tile installer and the client. Not expected to touch the project.
- **The owner:** the technical person running the project (Halil). Owns the GitHub and Netlify setup, and merges changes.
- **The wife:** the owner's wife. Non-technical, directs design and content through Codex.

The domain and Google Business Profile should belong to Aldo, since they're his business's identity.

## Goals

1. A fast, phone-first static site that is structured for excellent local SEO from day one.
2. A contact form that really delivers messages, plus tap-to-call everywhere.
3. A complete initial design using the Aldo Tile brand.
4. Files that let a non-technical person direct redesigns through Codex: clear agent instructions, a plain-language guide, and automatic checks.
5. An obvious, enforced path from sample content to real launch.

## Non-goals

No CMS, admin login or database. No blog, booking, payments or quote calculator. No multi-language site. No city or area pages yet. No photo upload on the form. No analytics beyond Google Search Console. Connecting the real domain and setting up the Google listing are launch tasks, not part of this build; the build only documents them.

## Anti-goals (failure even if it technically works)

- Sample phone numbers, reviews or claims reach Google or real visitors as if true.
- A redesign quietly removes page titles, structured data or the form's delivery setup.
- The wife gets stuck on jargon, or can't undo a change.
- The site goes offline because Netlify credits ran out through careless publishing.
- Near-identical pages that Google could treat as spam.
- Visual choices so tangled into the code that a redesign means rewriting content.

## Decisions made by the owner

- Public GitHub repo.
- Domain will be bought later; the site starts on a free temporary address.
- Sample (fake) data is fine at first.
- Excellent SEO is the priority.
- A contact form is required.
- The wife will rework the design later using Codex, so instructions must suit a non-technical person.
- Audience: both homeowners and commercial clients.
- Agreed direction: small multi-page site, built with Astro, plain CSS, Netlify hosting and Netlify Forms, GitHub for code, Google Search Console for search tracking. The owner commits and pushes their own work; Claude does not commit or push unless told to in that moment.

## Pages

| Page | URL | Purpose |
|---|---|---|
| Home | `/` | Who, where, proof, services, call to action |
| Bathrooms and showers | `/services/bathroom-shower-tile-installation/` | Target that search |
| Floors | `/services/floor-tile-installation/` | Target that search |
| Backsplashes | `/services/kitchen-backsplash-installation/` | Target that search |
| Commercial | `/services/commercial-tile-installation/` | Target contractors and businesses |
| Projects | `/projects/` | Gallery, filter by type |
| Single project | `/projects/<slug>/` | Photos, tile type, city, short story |
| About | `/about/` | Trust: experience, way of working, areas served |
| Contact | `/contact/` | Form, phone, email, areas served |
| Thank you | `/thank-you/` | Shown after the form is sent; not indexed |
| Privacy | `/privacy/` | Short plain notice about what the form collects |
| Not found | `/404` | Helpful links plus phone number |

Each service page needs its own written content and its own photos, never the same text with a word swapped. Project locations are city-level only; client addresses never appear.

## SEO requirements

- Every page: one `h1`, unique title and description, canonical URL, social sharing tags.
- Structured data (labels that tell Google what the page is): a local business type with service area on the business, `Service` on service pages, `BreadcrumbList` on inner pages.
- Show no street address unless the owner later says Aldo serves clients at one. Structured data uses city and province only.
- No `aggregateRating` or `Review` structured data on this site, sample or real.
- Sitemap and `robots.txt` generated at build time.
- Photos: descriptive filenames and alt text, explicit dimensions, modern formats, several sizes, lazy-loaded below the fold.
- Pages link to each other naturally: services to related projects, projects back to their service, every page to contact.
- Speed: the site must work with JavaScript off. Add only small scripts where they truly help. Targets on mobile: Largest Contentful Paint under 2.5s and Lighthouse scores of Performance 90+, Accessibility 95+, SEO 100.

## Contact

- Sticky tap-to-call button on phones; phone number in header and footer.
- Form fields: name, phone, email, city, project type (home or commercial), service, message. Phone and name required, plus message.
- Plain HTML form using Netlify Forms, working without JavaScript. Includes a honeypot (hidden field that traps spam bots), then redirects to `/thank-you/`.
- The address that receives messages is set in the Netlify dashboard, never in the public repo.

## Sample data and launch safety

All business facts live in one data file. Every piece of sample content (business fact, project, review) carries a machine-readable sample flag.

Samples to use: phone `(647) 555-0100` (a reserved fictional number), email at `example.com`, site address `https://aldotile.example`, invented years of experience and reviews.

One switch, `launchReady`, defaults to `false`. While false:

- every page has `noindex` (tells Google not to list it);
- a thin banner on every page says "Preview: sample content";
- sample reviews are visibly labelled as samples.

`npm run launch:check` must pass before going live. It fails, in plain English, listing each problem, if any sample flag, sample phone, sample email or `.example` address remains. Sample reviews must be replaced with real ones or removed, because fake reviews are illegal to present as genuine. The switch cannot be turned on while this check fails: the production build runs the check whenever `launchReady` is `true`.

## Photos

- 4 real Aldo photos exist: a stone-look shower, a marble-look shower and bathroom, a green vertical-tile commercial-style washroom, and a geometric floor. **They stay out of the repo and the temporary site until permission to publish is confirmed** (owner's decision), because the site is publicly visible and git history keeps deleted files. They wait in the ignored `_old-drafts/` folder. The first build uses placeholders only.
- Fill all photo slots with generated tile-pattern placeholder images, correctly sized and visibly marked "Sample photo", flagged so they can't launch (my call: the old drafts only hold 5 small AI images, too low-resolution to use, and no one can mistake a placeholder for real work). Don't use Unsplash links or AI images from older drafts.
- Do not retouch real photos. Light cropping to remove clutter is fine. Replacing the in-progress ones is on the launch checklist.
- Client or contractor permission to publish is on the launch checklist.
- Adding a project means adding one folder or file with photos, title, city, service, tile type and short text. The gallery, project page and related links then update automatically.

## Initial look

Follow the brand already established:

- Logo colours and draft palette: deep navy `#091e2b`, gold `#b6812a`, darker gold for text `#9c6719`, warm off-white `#f8f7f5`, line `#d8d3ca`, muted text `#4d5760`.
  - Note from the build: the gold text became `#9a6618`, because `#9c6719` measured 4.49:1 on the off-white, just under the 4.5:1 contrast rule.
- Reference: the mockup `Aldo Tile_ Form & Space Homepage.png` and the newest draft `Aldo_Tile_Website_Preview.html`. Keep the premium, calm, serif-headline feel and tile-inspired details, such as grout-like gaps.
- Design so that real photos will lead once they're added: layouts must look right with real, slightly imperfect job photos, not only polished images. Don't use the old AI images, including as the hero.
- `frontend-design` makes the final visual calls; `ui-ux-pro-max` checks usability and its pre-delivery checklist must be run. Save the chosen design in its `MASTER.md`.
- Redraw the logo as a clean SVG (scalable vector image); both PNG files are flawed. Provide a version that works on dark backgrounds.

## Built for redesign

Separation is the key requirement:

- **Look:** colours, fonts, spacing and shape values in one tokens file. Components use these rather than hard-coded values.
- **Words:** in content and data files, not inside layout components.
- **SEO and form logic:** in dedicated components that a page layout uses, so restyling a page doesn't touch them.

## Files for Codex and the wife

Codex automatically reads `AGENTS.md` from the project root, so the rules go there.

**`AGENTS.md`** (rules for Codex):

- Who it's helping: a non-technical person. Use plain words, reply in the language she writes in, recommend one option rather than listing many, and describe changes in visual terms.
- Project map: which file controls what.
- Free to change: all visual design, layout, section order, fonts, colours, animation, wording she asks for.
- Protected, must stay working: SEO component, structured data, form delivery attributes, sample flags, URLs, checks.
- Never invent facts about the business, such as reviews, years, insurance, licences or prices. Ask instead.
- Clear a sample flag only when the person gives the real value or real photo in the conversation. Never clear one just to make a check pass (my call).
- After every change, run `npm run check`, fix what it finds, then tell her how to see the result.
- Follow the mobile, contrast and tap-size rules, and update `MASTER.md` when the design changes.
- Git: never touch `main` directly and never force-push. Work on a branch. Only commit, push and open a pull request when she asks to save or share her work.
- Before a large redesign, describe the plan in a few plain sentences and wait for her OK.
- Ignore the `_old-drafts` folder.

**`START-HERE.md`** (the wife's guide, in plain English). She uses the **Codex desktop app on Windows** (owner's decision):

- What this project is, and what she can safely do.
- Opening the project in the Codex app and seeing the site on her computer. Separately, click-by-click steps for the owner to set up her computer once: Node, Git, GitHub sign-in, Codex, and getting the project. Codex runs natively on Windows without WSL (a Linux layer for Windows), so the project sits in a normal Windows folder. Check the current Codex app name and install steps against OpenAI's docs when writing this, because they've been changing.
- How to ask for changes, with ready-to-paste examples: change colours, try a new homepage top section, try two versions and compare, match this screenshot, undo the last change.
- How to swap sample details for real ones and add a new project from a folder of photos, since either she or the owner may do this (my call).
- How to save and get a shareable preview link, and how that becomes live.
- What to do when something looks wrong or a check fails: paste a set sentence into Codex.
- Plain glossary of the few words she may see.

**`docs/launch-checklist.md`** (owner): real details and photos, permission to publish, buy the domain in Aldo's name, connect it, set the form email, turn on `launchReady`, Search Console and sitemap, Google Business Profile, HomeStars, asking for reviews.

**`README.md`**: short technical overview and commands. No licence file; state "All rights reserved".

## Safety checks

`npm run check` is what Codex runs locally, and GitHub runs it on every pull request:

- Project builds.
- An audit of the built pages: required SEO tags, one `h1`, unique titles, valid structured data, image alt text and dimensions, working internal links, form delivery attributes and honeypot, tap-to-call link, sitemap.
- Automated accessibility scan, including colour contrast, at phone and desktop widths.

Failure messages should say what's wrong in plain language, so Codex and the wife can act on them. Lighthouse budgets run on pull requests.

## Publishing and Netlify credits

Netlify's free plan has 300 credits a month. A production deploy costs 15. Previews and branch deploys don't use deploy credits, though traffic to them does count. If credits run out, the site goes offline until the next cycle or an upgrade.

So:

- Normal changes happen on branches and pull requests, and get a free preview link.
- Only merging to `main` publishes.
- `main` is protected: changes arrive through a pull request with passing checks.
- Merge several changes together when possible.

Default publishing flow (my call): the wife asks Codex to save and share, then Codex opens a pull request and gives her the preview link. The owner merges it.

## Repo setup

- Move all old drafts, mockups and logo PNGs to `_old-drafts/`, ignored by git and not deleted. Nothing from it goes public.
- Repo name `aldotile`, under the owner's GitHub account. No licence file.
- Node version pinned; dependencies locked.
- Everything must work on both Windows (the wife) and Linux (the owner and GitHub): npm scripts can't depend on bash, and `.gitattributes` keeps line endings consistent.
- Claude runs `git init` only, and gives the owner exact steps to commit, create the repo, push, protect `main`, connect Netlify and invite the wife.

## Left to the builder

Exact visual design within the brand, component structure, audit tooling, image handling details, data file format, written sample copy, and how the gallery filter works, as long as the requirements above hold.

## Done means

- Every page above is built with sample content and looks complete on phone and desktop.
- `npm run check` passes, and it demonstrably fails if the form attributes, a title or structured data are removed.
- `npm run launch:check` fails on the sample content and lists what to replace.
- Built pages all have `noindex` while `launchReady` is false.
- The form's built HTML meets Netlify's requirements. Real delivery can only be confirmed after the owner connects Netlify, so this goes in the handoff steps.
- `AGENTS.md`, `START-HERE.md`, the launch checklist and `README.md` exist and match how the project actually works.
- A test design change made by following `AGENTS.md` alone, such as changing the main colour and fonts, needs only the tokens file and passes the checks.
