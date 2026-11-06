# Launch checklist

For Halil. Work top to bottom. Everything before "Go live" can happen on branches and pull requests, in batches, while the site stays a hidden preview. Setup comes first: [owner-setup.md](owner-setup.md).

## 1. Permission and real content

- [ ] **Written permission for every job photo.** Get it from the client (and the general contractor, on a contractor's job) before a photo goes into the repository. The repository is public and git history keeps deleted files, so a photo can't be taken back once pushed. Keep the permissions somewhere outside the repository.
- [ ] **Real business details** from Aldo in `src/data/business.json`: phone, email, areas served, years of experience, credentials. Set each `sample` to `false` only with the real value. If Aldo can't confirm a fact, such as a credential, leave it out rather than guess: an empty list, or `0` years, with `sample` set to `false`. The home and About pages then leave that fact out.
- [ ] **Real projects.** Preferably at least one real project per service. Fewer is allowed: a service with none simply shows no related projects, and the projects filter leaves it out. Delete the sample projects as real ones replace them.
- [ ] **Real photos.** File names that describe the photo and don't start with `sample`. A real description in each `alt`: `npm run launch:check` fails on any description that still says "Sample placeholder". No retouching; light cropping only.
- [ ] **Home top photo** at least 2000px wide. It's imported in `src/components/Hero.astro` and, as the image shown when the site is shared, in `src/layouts/BaseLayout.astro`. Its description is `home.hero.imageAlt` in `src/data/copy.json`.
- [ ] **Service pages with a real wide photo.** A service page's lead photo is a spare photo from one of its projects. Try a real 16:9 landscape photo there and check each service page still looks right on a phone and a desktop.
- [ ] **Project pages.** If a very wide panorama leaves an empty gap beside the photo before it, reorder that project's photos.
- [ ] **Reviews.** Every sample review deleted or replaced by a real one, in the client's own words, with their permission. Fake reviews are illegal to present as genuine. Launching with no reviews is fine: the section disappears. The build then prints `[WARN] [content] The collection "reviews" does not exist or is empty. Please check your content config file for errors.`, which is expected and harmless. After adding the first review back, restart `npm run dev` to see it.

## 2. Copy review with Aldo

The sample wording was written as a starting point. Aldo reads every page and confirms or corrects these claims before launch:

**History and experience**

- [ ] The About page's beliefs, and the claim that he works for both homeowners and contractors or property managers (`about.story` in `src/data/copy.json`).
- [ ] All the project stories and reviews are invented samples. Each must be replaced or removed.

**Services offered**

- [ ] Heated floor mats (floors page, highlights and questions).
- [ ] Natural stone (bathrooms and showers page, highlights).
- [ ] Condo work (bathrooms and showers page, closing section).
- [ ] Commercial: after-hours and phased work, working to TTMAC details, moisture testing, and quarry tile with epoxy grout.
- [ ] That plumbing and electrical work is left to other trades.

**Promises about how a job runs**

- [ ] Written quotes (home, about and contact pages; the commercial page says itemised).
- [ ] A site visit before quoting (floors page: "Subfloor checked for bounce and flatness before we quote").
- [ ] Flood testing shower bases.
- [ ] Time estimates: "about a week" for a shower, "two to three visits" for a backsplash.
- [ ] No mailing list, and no selling or marketing use of people's details (privacy page).

When Aldo has confirmed the wording, clear the `sample` flag in `src/data/copy.json` and in each service file in `src/content/services/`.

## 3. Domain and form

- [ ] **Buy the domain in Aldo's name,** with an account he controls, since it's his business's identity. You can be added to manage it.
- [ ] **Connect it in Netlify:** open the project's domain management, add the domain, and follow Netlify's DNS steps. Wait for the HTTPS certificate. Make one address the primary (for example with `www`) and let the other redirect to it.
- [ ] **Update `siteUrl`** in `src/data/business.json` to the primary address exactly, in the form `https://www.<your-domain>` or `https://<your-domain>` with no slash at the end, and set its `sample` to `false`. Canonical links, the sitemap and `/robots.txt` all come from it.
- [ ] **Form email:** in Netlify, **Forms**, **Submission notifications**, send the `contact` form to the address Aldo will read. Netlify only accepts an active member of your Netlify team, so invite that address to the team first. It's unconfirmed whether the free plan allows that second member; if it doesn't, keep the notification on your address and forward those emails to Aldo (see [owner-setup.md](owner-setup.md), Step 4). Then send a real-looking test in full sentences (the spam filter flags obvious tests), confirm the email arrives, and check **Spam submissions** if it doesn't.

## 4. Go live

- [ ] `npm run launch:check` says `Ready to launch.` It lists, in plain words, every sample that's left.
- [ ] Optional but worth it: `npm run launch:rehearsal` (about a minute and a half) proves a launched copy passes every check, without touching the project.
- [ ] Set `launchReady` to `true` in `src/data/business.json` in a pull request. This removes the preview banner and the `noindex` tag, so Google may list the pages. The build refuses to run while any sample remains, so a mistake can't go live.
- [ ] `npm run check` passes, both `check` jobs pass on the pull request, and the preview looks right. Merge.
- [ ] On the live site, view a page's source: the robots tag says `index,follow`, and there's no preview banner.

## 5. After launch

- [ ] **Google Search Console:** add the domain as a property, verify it (a DNS record), then submit the sitemap at `https://<domain>/sitemap-index.xml`. Use URL Inspection on the home page to ask Google to crawl it.
- [ ] **Google Business Profile** in Aldo's name: category tile contractor, the phone and website exactly as on the site, a service area of Mississauga and the nearby areas listed on the site, and the street address hidden, because he serves clients at their place.
- [ ] **HomeStars:** create or claim the profile, with the business name, phone, website and service area matching the site and the Google profile exactly.
- [ ] **Review routine:** after each finished job, Aldo sends the client a short message with the Google review link (and HomeStars). Add real reviews to the site only with the client's permission, in their words.
- [ ] **Credits:** keep merging in batches. 300 credits a month, 15 per publish; see [owner-setup.md](owner-setup.md), Step 7.
