# Rules for Codex

This is the website of Aldo Tile, a tile installer in Mississauga, Ontario: a static Astro site with plain CSS, hosted on Cloudflare Pages, with a FormSubmit contact form (Netlify remains a supported legacy delivery option). It must work on Windows (her computer) and Linux (the owner's and GitHub's). Rules come first. The tips at the end say how to carry them out.

## 1. Who you're helping

- Usually the owner's wife. She isn't technical and directs the design. Sometimes it's the owner, Halil, who is.
- Use plain words. If a technical word can't be avoided, explain it in one short line.
- Reply in the language she writes in.
- Recommend one option and give the reason in a sentence. Don't list many options.
- Describe changes in visual terms: "the buttons are now a warmer gold", not "changed --color-accent".

## 2. Project map

| She wants to change | Edit |
|---|---|
| Colours, fonts, text sizes, spacing, corners, tile gaps | `src/styles/tokens.css` (values only live here) |
| Shared page styles and classes | `src/styles/global.css` |
| How one section looks | its file in `src/components/`, such as `src/components/Hero.astro` for the top of the home page |
| Which sections a page has, and their order | the page in `src/pages/`, such as `src/pages/index.astro` for home |
| Header, footer, phone call bar | `src/components/Header.astro`, `src/components/Footer.astro`, `src/components/MobileCallBar.astro` |
| Wording on home, about, contact, projects, privacy, thank-you and not-found pages, menus, buttons | `src/data/copy.json` |
| Phone, email, web address, areas served, years, credentials | `src/data/business.json` |
| A service page's text, highlights or questions | `src/content/services/<service>.md` |
| Add or change a project | `src/content/projects/<city>-<short-name>/index.md`, with its photos in the same folder |
| Reviews | one file per review in `src/content/reviews/` |
| Home top photo | the photo import in `src/components/Hero.astro` and in `src/layouts/BaseLayout.astro` (sharing image), plus `home.hero.imageAlt` in `src/data/copy.json` |
| Logo | `src/assets/logo.svg`, `src/assets/logo-on-dark.svg`, `src/components/Logo.astro` |
| Browser-tab icon | `public/favicon.svg` |
| The written design record | `design-system/aldo-tile/MASTER.md` (read it before any design work) |

## 3. Free to change

- All visual design: layout, section order, fonts, colours, spacing, shapes, animation, the look of any component.
- Section order is free and needs no test change. On home, `tests/browser/pages.spec.ts` only checks that the hero is first, the call-to-action band is last, and each expected section appears exactly once. Added sections and restyled headings, such as headings set in capitals, need no test change either.
- Colours and fonts are shared by every page. If she asks for one page, say it changes every page and recommend that. If she still wants one page only, add a new token in `src/styles/tokens.css` and use it on that page.
- Any wording she asks for, in the content and data files above.
- Keep the separation that makes this easy: colour and font values only in `src/styles/tokens.css` (`tests/unit/tokens.test.ts` enforces it), words in content and data files, never inside components. Business facts always come from `src/data/business.json`, never typed into a component.
- A new font: `npm install @fontsource/<font-name>`, then change the imports at the top of `src/styles/tokens.css`. Use a Fontsource font, not a system font: system fonts differ between Windows and Linux, so the checks could pass on one and fail on the other.
- A wider body font can fail the call bar or header tests in `tests/browser/layout.spec.ts`. Those layouts switch at fixed widths measured for Hanken Grotesk: `16.59rem` in `src/components/MobileCallBar.astro` (the call bar stops sticking), `19.9rem` and `24rem` in `src/components/Header.astro` (the phone number takes its own row), and `77.5rem` (the full menu shows; the same number in `src/components/Header.astro`, `src/styles/global.css` and `src/pages/services/[slug]/index.astro`). Raise the number behind the failing test in 0.25rem steps until it passes, and raise all three `77.5rem` values together. Change no test: the tests read the call bar and full menu numbers from those CSS files and move their cases with them, and the header test tries every text size. Then update the matching numbers in the Screen widths section of `design-system/aldo-tile/MASTER.md`. If a test fails at normal text, such as the header not fitting one row at 320px or 390px, the font is too wide: suggest a narrower one.

## 4. Protected: must keep working

- **SEO:** `src/lib/seo.ts` and `src/components/seo/Seo.astro` make the titles, descriptions, canonical links, robots tag, sharing tags and structured data. Every page uses `src/layouts/BaseLayout.astro`, which uses them. Restyle around them; don't edit or bypass them. Each page keeps one `h1` and its own title and description.
- **Structured data:** no `aggregateRating` or `Review` data, ever. No street address anywhere; the business is Mississauga, ON, CA only.
- **Form delivery:** in `src/components/ContactForm.astro`, keep `name="contact"`, `method="POST"`, every existing field name and the hidden `bot-field` trap. Delivery is selected by `formProvider` in `src/data/site-settings.json`. FormSubmit uses the email in `src/data/business.json`, `_subject` matching `subject`, `_next` pointing to the real `/thank-you/` URL, and the `_honey` trap outside keyboard navigation. Never disable its spam challenge. Netlify attributes remain for legacy compatibility; Netlify delivery uses `/thank-you/` directly. Restyle freely without breaking the selected provider.
- **Sample flags:** every `"sample": true` and `sample: true`. See rule 6.
- **URLs:** `/`, `/services/bathroom-shower-tile-installation/`, `/services/floor-tile-installation/`, `/services/kitchen-backsplash-installation/`, `/services/commercial-tile-installation/`, `/projects/`, `/projects/<folder-name>/`, `/about/`, `/contact/`, `/thank-you/`, `/privacy/`. Never rename or remove a page. A project's address is its folder name, so don't rename a project folder.
- **Checks:** `npm run check`, `npm run launch:check`, `npm run launch:rehearsal`, and everything in `scripts/`, `tests/`, `.github/workflows/check.yml` and `lighthouserc.json`. Never edit, weaken, skip or delete a check to get past it; if one blocks her request, follow rule 7.
- **`launchReady`** in `src/data/business.json`: while false, every page must remain `noindex`, even if the owner hides the preview banner. Banner visibility is controlled by `showPreviewBanner` in `src/data/site-settings.json`; Halil explicitly approved false for the Cloudflare site in November 2026. Keep `src/components/PreviewBanner.astro`, its wording and the `<PreviewBanner />` line in `src/layouts/BaseLayout.astro` for future previews. Do not clear sample flags or change `launchReady` just to hide the banner. When true, build runs the launch check and refuses remaining samples. Only Halil turns it on at launch; never change it yourself.
- Leave `astro.config.mjs`, `netlify.toml` and the `scripts` in `package.json` alone too.
- Only Halil may ask for changes to anything in this rule, and they must still pass `npm run check`.

## 5. Never invent business facts

Never make up reviews, years of experience, insurance, licences, WSIB, warranties, prices, areas served, timelines, client names or project details. If wording needs a fact, ask her. If nobody knows, leave it out.

## 6. Sample flags

- Clear a sample flag only when the person gives you the real value or the real photo in this conversation. Never clear one just to make a check pass.
- `src/data/copy.json` has one flag for all its wording, and each service file has its own. Each means "Aldo hasn't confirmed this wording yet". Clear one only when she tells you Aldo has confirmed that wording.
- A real photo: give it a descriptive file name that doesn't start with "sample" (the launch check flags any image named that way), and a real description in `alt`. The launch check also fails on any description that still says "Sample placeholder".
- Sample reviews are replaced only by real reviews the person gives you, or deleted. Never write a review.

## 7. After every change

Run `npm run check` and fix your change until it ends with "All checks passed." Then tell her in one line how to see the result (see Tips). It builds the site and runs browser tests, so it takes a few minutes.

- If a protected check fails because of what she asked for, don't touch the check. Tell her in one plain line what it protects, leave the change unsaved, and say Halil must decide.
- If it fails for a reason that has nothing to do with her change, say so plainly and suggest she asks Halil.

## 8. Design rules

- Phone first. Look at 320px, 390px and 1280px wide after any layout change.
- Text contrast at least 4.5:1, large text and field borders 3:1. When a background colour changes, recheck `--color-accent-text` and `--color-muted` against it first; their ratios are in `design-system/aldo-tile/MASTER.md`. Tap targets at least 44px, buttons 48px. Visible focus rings. Honour reduced motion.
- The site works with JavaScript off. No React or other framework; small scripts only where they truly help.
- Text over a photo only on a solid backing panel that passes the contrast rule above, never straight on the photo. Layouts must look right with real, slightly imperfect job photos.
- `PHOTO_MAX_HEIGHT` in `src/components/PhotoGallery.astro` is `--gallery-photo-max-height` in pixels, so change it whenever that token changes.
- Update `design-system/aldo-tile/MASTER.md` whenever the design changes.
- Colours outside `src/styles/tokens.css`: `public/favicon.svg` can't read tokens, so when the main colours change, change its colours by hand. The fills in the logo SVGs are overridden by `src/components/Logo.astro`, so leave them. `scripts/generate-placeholders.mjs` is protected; leave it.

## 9. Git

- Never commit to `main` directly. Never force-push, and never rewrite history that has been pushed.
- Start new work on a fresh branch: `git switch main`, `git pull`, then `git switch -c <short-name>`, with no slash in the name (git can't hold both colours and colours/v2 as branches, so slashes can clash). If her current branch has an open pull request, keep working on it instead. If `git pull` fails because there's no remote or no network, carry on from the local `main` and mention it.
- Commit, push and open a pull request only when she asks to save or share her work.
- Never merge. Halil reviews and merges. Each merge publishes the live site and costs Netlify credits, so suggest saving several changes together.
- The repository is public. Never add `_old-drafts/`, `.env` files, or real Aldo photos unless she confirms Halil has written permission to publish them.

## 10. Before a large redesign

A large redesign is anything that changes the shared colours or fonts, more than one section, or more than one page. Describe the plan in a few plain sentences and wait for her OK.

## 11. Ignore `_old-drafts/`

Don't read it, copy from it or link to it.

## Tips

- **See the site:** `npm run dev`, then give her the address Astro prints, usually http://localhost:4321/ (it picks another port if that one is busy). On Windows (her computer) it runs in the foreground and holds the command, so start it as a long-running process and carry on. On Linux, Astro starts it in the background and returns at once. Either way `npx astro dev status` says if it's running. To restart, stop it (`npx astro dev stop`, or end that process) and start it again. Stop it when she's done looking.
- **First review added** (or the reviews folder created again): stop and restart `npm run dev`, or the review won't show.
- **Expected build warning** when there are no reviews: `[WARN] [content] The collection "reviews" does not exist or is empty. Please check your content config file for errors.` It's harmless.
- **Two ideas to compare, unsaved:** start only when `git status` shows no changes; if there's unsaved work, ask her to save or undo it first. Make idea A, show her, then `git stash push -u -m idea-a`. Make idea B and show her. To switch, stash the one showing under its own name (`git stash push -u -m idea-b`, or `idea-a`), then run `git stash list`, find the line whose message ends in the other idea's name, and `git stash pop 'stash@{N}'` with that line's number (keep the quotes: PowerShell breaks on bare braces). Always look the number up by its message first, because the numbers shift with every stash. When she chooses, make sure her choice is the one showing, then `git stash drop 'stash@{N}'` for the line whose message names the other idea. `git stash list` should then hold no idea entries.
- **Match a screenshot:** match the look through tokens and components. Keep the logo, the wording, the facts and everything in rule 4.
- **Undo my last change:** undo only the most recent change. Not saved yet: `git restore` those files, or reverse that edit. Already saved: `git revert` that commit on her branch. If it's tangled with earlier unsaved work, say so and ask.
- **Save and share:** commit with a plain message, `git push -u origin <branch>`, then `gh pr create` with a plain title and a short visual summary. In a few minutes Netlify adds a preview link to the pull request: find it with `gh pr checks` (the deploy-preview line) and give it to her. Tell her Halil merges it to make it live.
- **Saving again:** if her branch already has an open pull request, commit and push to it, so the preview updates. Open a new one only if she asks. Fewer merges mean fewer Netlify credits.
- **Add a project:** copy a folder in `src/content/projects/` and change every field. `service` is a file name from `src/content/services/` without its ending; `projectType` is `home` or `commercial`; `city` is a city only, never an address; lower `order` shows first. The title plus " | Aldo Tile" must be 10 to 65 characters, `metaDescription` 50 to 165, and both unique. Use the photos she gives as they are; light cropping only. Set `sample: false` only for a real job with real photos and written permission. Delete sample projects as real ones replace them.
- **Photos:** a new home top photo goes in `src/assets/` and should be at least 2000px wide. On a project page, a very wide panorama can leave a gap beside the photo before it; reorder the photos to fix it.
- **A check failed on GitHub:** `gh pr checks` shows which; `gh run view <run-id> --log-failed` shows why. Fix your change on the same branch and push, following rule 7.
- **What's still sample:** `npm run launch:check` lists every sample left. It's meant to fail until launch.
- **Quick tests while working:** `npm test` runs only the fast unit tests. `npm run check` is still required at the end.
- **Missing browser:** if browser tests say Chromium is missing, run `npx playwright install chromium`.
- **PowerShell blocks npm** ("running scripts is disabled"): tell her to ask Halil. Don't change system settings.
