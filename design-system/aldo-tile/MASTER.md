# Aldo Tile design system

This file records the look the site actually uses. `src/styles/tokens.css` holds the values, and this file explains them. If the two disagree, tokens.css wins, so update this file whenever the design changes.

A page-specific file at `design-system/aldo-tile/pages/<page>.md` overrides these rules for that page. None exist yet.

## The idea

The site is set like a tile job. Panels and photos meet at a narrow grout gap with barely eased corners, and the one memorable shape is the raked tile panel from the logo, with a single gold tile in it. Everything around that stays calm: a serif headline, plain text, lots of off-white.

Spend boldness on the raked panel only. Don't add more decoration around it.

## Colour

| Token | Value | Use |
|---|---|---|
| `--color-ink` | `#091e2b` | Main text, dark sections |
| `--color-accent` | `#b6812a` | Gold fills, icons, lines. Never small text on a light background (3.2:1) |
| `--color-accent-text` | `#9a6618` | Gold text on off-white (4.57:1) or white (4.90:1) |
| `--color-surface` | `#f8f7f5` | Page background |
| `--color-surface-raised` | `#ffffff` | Header and menu panel |
| `--color-line` | `#d8d3ca` | Hairlines and borders. Decorative only |
| `--color-muted` | `#4d5760` | Secondary text (6.9:1 on off-white) |
| `--color-on-accent` | same as ink | Text on gold buttons (5.0:1) |
| `--color-on-ink` | `#f8f7f5` | Text on navy (15.9:1) |
| `--color-on-ink-muted` | `#c3ccd2` | Secondary text on navy (10.5:1) |
| `--color-field-line` | same as muted | Form field borders, which must stay visible (3:1 or more) |
| `--color-error` | `#a3261b` | Border of a form field the browser rejected. Always paired with the browser's own message |
| `--color-accent-on-ink` | `#d4a34e` | Gold text on navy (7.4:1) |
| `--color-line-on-ink` | `#2c4656` | Hairlines on navy |

`--color-accent-text` was `#9c6719` in the old drafts. That measures 4.49:1 on the off-white page background, just under the 4.5:1 rule, so it was darkened slightly to `#9a6618`. It looks almost the same and passes on both light backgrounds.

Add the class `on-ink` to a dark section. It sets the navy background, light text and a light focus ring.

## Type

- **All headings:** Gelasio 400, self-hosted through Fontsource. Page titles, section headings, card titles, FAQs, footer headings and utility pages share this family.
- **Body text, labels, menus and buttons:** Arimo 400 and 700, self-hosted through Fontsource. These are the only two font families used by the interface. Logo artwork remains unchanged.
- **Shared scale:** main page titles 30-40px; section headings 24-28px; smaller headings 18-20px; card titles and body copy 16px; small labels and buttons 14px; eyebrows 12px. Contact-band titles use a compact 22-28px scale.
- Page-specific tokens alias these roles, unifying home, about, contact, projects, project details, services, privacy, thank-you and 404. The former 51-68px oversized titles are removed. Form controls use 16px at normal text, including home and contact overrides.
- Viewport caps and body-size minima keep headings readable at 200% text. Text can grow with no fixed text heights or hidden headings.
- Unused Brygada 1918, Hanken Grotesk and Gelasio 700 imports are removed. Dependencies stay installed and build scripts remain unchanged.

## Tile details

- `--grout` (6px): the gap between tiles, panels and photos.
- `--radius-tile` (2px): the corner of a cut tile. `--radius-field` (3px) is for form fields.
- `--rake` (31deg): the lean of the logo's tile panel. Used by the tile fields in `CtaBand` and `CallPanel`, the home hero's strip, breadcrumb dividers and list bullets.
- `--tile-tone-*`: how strongly each tile in that field shows, from faint to deep.
- `--cta-*`: the size and position of the `CtaBand` text and tile field.
- `--logo-width-*`: the logo's width in the header and footer.
- `--call-bar-height`: the height of `MobileCallBar` while it's sticky, always one row of buttons, so the page's scroll padding keeps a focused link clear of it. It's in rem because the bar grows with text. A browser test checks the bar is never taller than this while sticky.
- `--menu-tile-min-width`, `--contact-area-min-width`: the narrowest a menu tile or contact-page city gets before it drops to one column at large text.
- `--pressed-opacity`: how far links and buttons fade while pressed.
- `--panel-padding`, `--panel-split-columns`, `--text-row-columns`: inner-page layout. `--panel-padding` and `--gutter` have a `vw` cap, so at large text on a phone they don't eat the room the words need.
- `--call-panel-*`: the size of the tile field in `CallPanel`.
- `--hero-*`: the home hero's text share, photo shape and raked strip.
- `--project-photo-ratio`, `--service-photo-ratio`: the fixed photo shapes on project cards and service pages.
- `--gallery-row-height-phone`, `--gallery-row-height`: the starting row height in `PhotoGallery`, under 640px and from 640px. The second is low enough that a photo too short to fill a row alone has room for an ordinary photo beside it. Photos that stack instead, such as two 16:9 shots under about 1200px, each fill their own row.
- `--gallery-photo-max-height`: the tallest a photo can be from 900px up.
- `--gallery-facts-basis`: the narrowest the facts tile can be from 900px up before it drops to its own row.
- `PhotoGallery.astro` repeats the height cap and the widest content width as numbers for `sizes`, so change both together. `sizes` is the most a photo can fill, not its usual width, because the exact width depends on the photos beside it and the screen. A desktop may download a larger file than it strictly needs, which is better than a soft photo. A browser test checks that no photo shows wider than `sizes` says.
- `--proof-fact-*`, `--area-tile-*`: the smallest size of the home page's fact and city tiles.
- `--bullet-*`: the tiny raked gold tile used as a list bullet.
- Spacing is the `--space-*` tokens.

## Photos

Layouts must look right with real, slightly imperfect job photos.

- Use the `tile-grid` class: photos meet at a grout gap, cropped with `object-fit: cover`.
- No heavy shadows, rounded cards or colour overlays on photos, and no text straight on a photo. These fight with busy job-site pictures. Text over a photo needs a solid backing panel that passes contrast.
- Give every slot a fixed shape, so mixed portrait and landscape photos still line up.
- The hero and service lead photos fill a frame, positioned absolutely with `object-fit: cover`, so a photo of any shape can't change the layout. The service frame keeps `--service-photo-ratio` at every width. From 900px up the hero frame has a minimum height and grows with its text, so its `sizes` is set for the width the photo is scaled to, not the column's width. A browser test checks that no first photo is stretched past its file. The sample hero is imported in both `src/components/Hero.astro` and `src/layouts/BaseLayout.astro` (as the default share image), so swapping it means changing both imports and the `imageAlt` in copy.json.
- Only the first photo on a page loads with `loading="eager"` and `fetchpriority="high"`. All others lazy-load. On `/projects/` that first photo is the first card's. Pass `sizes` that match the real column width, so phones don't download the largest file.

## Home page

- **Hero:** text beside the photo from 900px up, with the photo running off the right edge of the screen. Below that, the photo sits on top, edge to edge, then the text. Text never sits straight on the photo.
- **Raked strip:** one row of raked tiles with the single gold tile, meeting the bottom of the hero photo at a grout gap. It carries the logo's shape into the first screen, so don't add a second raked element near it. Its flat top edge is what lets it sit against a square photo.
- **Proof strip:** a navy heading tile, then one tile per fact. The tiles use flex, so a fact left empty in business.json leaves no hole. Show only facts from business.json.
- **Reviews:** plain columns under a thick navy rule, deliberately not tiles, so the page isn't all boxes. The `Sample review` label is a solid gold chip above the quote, driven by each review's own `sample` flag. With no reviews, the whole section disappears.
- **Areas:** one tile per city. Only the base city is gold, echoing the logo's one gold tile. Colour isn't the only signal, because the intro above says where the business is based.

## Service pages

- A page head with the `h1`, summary and both contact buttons, beside a lead photo from 900px up. The lead photo is the first spare photo from a related project, since each project card already shows its own first photo. With no spare photo, the head runs full width with no empty frame.
- Article text beside a navy `What's included` panel, which sticks below the header while the text scrolls. It holds no links, so it can never cover a focused one.
- Related projects and FAQs use `text-row`. With no related projects, that row disappears. With one, the card stays half width rather than stretching. FAQs are always open, as plain text.

## Projects

- **Gallery:** `ProjectCard`s in a grid of 1, 2 or 3 columns. Filtered cards close up, and a row that's short of cards keeps them at full-column width rather than stretching them.
- **Filter:** `ProjectFilter` is a row of tiles that fill their row, set a grout gap apart. Each is a real radio covering its whole tile, so the tap target and the arrow keys are the browser's own. A small raked tile stands in for the radio's dot, hollow until chosen, and the chosen tile goes navy. Don't change the weight of the chosen label: a wider word can rewrap the row and make the page jump.
- The filter offers only services with at least one project. Its hiding rules are generated from that list by `src/lib/project-filter.ts` and go in the page head through `BaseLayout`'s `head` slot, so a new service needs no CSS. Without `:has()`, all projects simply stay visible. Its label is the service's menu label, or its title if it isn't in the menu.
- **Project page:** `PhotoGallery` sets photos in justified rows: each photo keeps its own shape, and a row fills the width at one height. From 900px no photo goes taller than `--gallery-photo-max-height`, so tall phone shots stay on one screen. Under 900px a photo alone in a row fills it, as on a phone.
- **Facts tile:** the navy tile with the tile used, location, type, service and contact button is the last tile in those rows. From 900px it takes whatever room the last photo leaves, so a single photo sits beside it. Under 900px it has its own row. If it has to stretch a row, the photo beside it is trimmed slightly. Its columns respond to its own width, using a container query.
- **Holes:** ordinary camera and phone shapes (from 9:16 to 16:9, including 5:4 and 6:5) fill every row at the widths the browser test checks. The sample photos are only 4:3 and 3:4, so that test swaps in other shapes.
- **Known gap:** from 900px, a photo followed by a very wide one (about 2.4:1 or wider, such as a panorama) leaves space beside it, since the wide photo needs a row of its own. Reorder the photos if that happens.

## Cards

- `ServiceCard` and `ProjectCard` make the whole tile tappable with a stretched link. Screen readers hear only the name as the link, and the focus ring goes around the whole tile.
- `ProjectCard` titles are `h3`, so a page using them needs an `h2` above them.

## Inner pages

Classes in `global.css`, so every inner page is set the same way:

- `page-head` and `page-head__lead`: breadcrumbs, the `h1` and a lead paragraph.
- `panel`: a white tile with a hairline edge. Add `on-ink` for a navy one.
- `tile-grid tile-grid--split`: a wide tile beside a narrow one from 900px up, stacked below that.
- `text-row` and `text-row__body`: a heading beside its text from 760px up.

## Form fields

- Every field has a visible label that says Required or Optional in words. Never rely on colour or placeholder text.
- Fields are at least 48px tall with 17px text, so phones don't zoom in when one is focused.
- A rejected field gets a thicker red border, and the browser shows its own message beside it.
- The form delivery attributes and the honeypot in `ContactForm` are protected. Restyle freely, but don't change them.

## Logo

- `src/assets/logo.svg` and `src/assets/logo-on-dark.svg` are redrawn from the old PNG, with lettering as outlines, so they need no font.
- `public/favicon.svg` is the mark alone on an off-white tile. A browser icon can't read tokens, so a main-colour change must also update the colours in this file by hand.
- Use the `Logo` component (`tone="dark"` on navy). It places the SVG inline and takes its colours from tokens, so a colour change in tokens.css also recolours the logo.
- Smallest size is 90px wide (`--logo-width-small`), used only in the header on phones under 390px wide. "ALDO TILE" stays clear at that size. The small "Tile Installation" line is readable on a phone's sharp screen but blurs on an ordinary monitor, so use at least `--logo-width-header` (104px) anywhere else, and never go below 90px.

## Shared components

| Component | Props | Notes |
|---|---|---|
| `Button` | `href?`, `variant?: 'primary' \| 'secondary'`, `type?` | A link if it has `href`, otherwise a button |
| `CallLink` | `variant?: 'plain' \| 'button'` | The phone number comes from business.json |
| `Breadcrumbs` | `items: {name, path}[]` | The last item is the current page |
| `CtaBand` | `heading`, `text` | Pass wording from copy.json |
| `CallPanel` | `prompt` | Navy panel with a prompt and the phone button. Shows a raked tile field from 900px up |
| `ContactForm` | `services: {id, title}[]` | The only form on the site |
| `Logo` | `tone?: 'light' \| 'dark'` | Fills its container's width |
| `Hero` | none | Home page only. Words come from `home` in copy.json |
| `ServiceCard` | `service` | A services collection entry |
| `ProjectCard` | `project`, `sizes?`, `eager?` | A projects collection entry. Pass `sizes` when the column isn't the default width. Pass `eager` only for a card that's the first photo on screen. Depends on nothing from a specific page |
| `ProjectFilter` | `options: {id, label}[]` | Only pass services that have a project. Must come before an element with `data-project-grid`, whose children carry `data-project-service` |
| `PhotoGallery` | `photos`, plus an optional slotted last tile | Shows every photo. The first loads early and the rest lazy-load. File widths stop at each photo's own width |
| `ReviewCard` | `review` | Shows the `Sample review` label when the review's `sample` flag is true |
| `ReviewsSection` | `reviews` | Renders nothing at all when `reviews` is empty |
| `Faq` | `heading`, `items: {q, a}[]` | Visible text only, with no FAQ structured data. Renders nothing when `items` is empty |
| `Header`, `Footer`, `MobileCallBar`, `PreviewBanner` | none | Already in `BaseLayout` |

Shared wording lives under `site` in `src/data/copy.json`. Business facts come from `src/data/business.json`.

## Screen widths

| Width | What changes |
|---|---|
| Under 390px | Menu button shows only its icon. Logo shrinks |
| Under 340px | Header phone number loses its icon |
| Under 760px | `MobileCallBar` shows. It's sticky and sits after the footer in the page, so it keeps its own space and never covers the footer |
| Under 16.84rem of width | `MobileCallBar` stops being sticky and stays after the footer, with its buttons stacked. At normal text no phone gets here. It starts at about 121% text at 320px, 147% at 390px and 162% at 430px. One fixed rem value has to be safe at 320px, so on wider phones the buttons would still just fit one row for a few percent past this point. The value (16.84rem in `MobileCallBar.astro`) was measured for Hanken Grotesk, so a wider body font needs it raised |
| 560px and up | Service page project cards go to two columns |
| 640px and up | Home service tiles, home project cards and the gallery go to two columns. City tiles use larger text |
| 900px and up | Home hero and service head go side by side. Service article sits beside its panel. Reviews go to three columns |
| 640px and up | Project page rows use the lower row height. Photos that don't fit side by side each fill their own row |
| 900px and up | Project page story sits beside its links. Facts tile can sit beside a photo, and the photo height cap starts |
| 1024px and up | Gallery goes to three columns |
| 1100px and up | Proof strip and home projects each go to one row |
| 1100px and up | `CtaBand` tile field moves beside the text instead of above it |
| Under 77.5rem | Header uses the Menu button |
| 77.5rem and up | Header shows all links and sticks to the top. This is a container query in rem, so it's 1240px at normal text, a narrower screen at smaller text, and large text stays on the Menu button. The service panel's offset and the links' scroll margin use the same query, so change all three together |

## Usability rules

- Tap targets are at least 44px, buttons 48px. `tests/browser/layout.spec.ts` checks the header, the menu and the call bar.
- Links and buttons fade while pressed, using `--pressed-opacity`. Nothing moves, so the layout stays still.
- Large text works. At 150% and 200% browser text on a 390px phone, nothing scrolls sideways or gets cut off on any page, and `tests/browser/layout.spec.ts` checks this. Use `rem` for sizes that hold text, and let rows wrap instead of fixing their width.
- Above normal text on a 390px phone, the phone number takes its own row below the logo and Menu button, and the Menu button stays beside the logo. Rem-based container queries in `Header.astro` do this (19.9rem under 390px, 24rem from 390px), so they follow the text size as well as the screen width, but not the font: like the call bar's and the 77.5rem one, they were measured for Hanken Grotesk. They can't measure the font themselves: Chromium works out a `ch`-based container query from the fallback font and doesn't redo it when the web font arrives, so it would depend on how fast the font loaded. The phone number can wrap at its space or hyphen, never between digits.
- Everything works with JavaScript off. The menu is a plain `<details>`, and the call bar is CSS only.
- Focus rings are always visible. The skip link stays hidden until focused.
- Motion only answers an action, such as opening the menu or hovering a button. `prefers-reduced-motion` turns it off.
- No colour or font values outside tokens.css in components, layouts, pages or global.css. `tests/unit/tokens.test.ts` enforces this.
- Check 320px, 390px and 1280px after any layout change, and run `npm run check`. Pull requests and pushes to `main` also run Lighthouse, with budgets in `lighthouserc.json`.

## Homepage reference match - November 2026

This section supersedes older home-layout notes above. Reference: EM_Tile_Vetem_Logo_E_Re.html, inspected live in Avast alongside localhost in Chrome.

- The exact supplied EM Tile logo is used in the shared header. Desktop logo width is 215px. The homepage footer is a compact navy legal row and navigation row. Business facts and SEO remain sourced from business.json.
- The home hero uses the supplied two-line wording, a gold final word, small uppercase location label, gold gradient quote button and outlined work button. It has the reference's diagonal bathroom illustration, with solid backing wherever text could reach the image. At 761px it becomes a side-by-side composition; smaller screens stack copy before the image. Main copy begins at 6.8% on desktop. The image retains its original 1006 by 353 resolution.
- Six original outline icons follow the hero in a shallow band. They form two, three or six columns depending on available rem width. The services heading remains accessible without adding a visible title absent from the reference.
- Recent projects have functional radio filters, four rounded illustration cards and a link to the complete gallery. Illustration overrides apply only to sample projects; real content keeps its actual photo. No real job photo from the supplied mockup was added. The original project addresses and facts remain unchanged.
- About and contact are two columns on desktop and stack on phones. The Netlify form preserves all original field names, required fields, delivery attributes and visible labels. On the homepage showIntro=false avoids repeating the reference's visible contact heading; the standalone contact page keeps its original introduction.
- Required proof, reviews, service-area and closing-contact sections remain below the reference layout. Protected checks require these and the individual service navigation links. Removing them to reproduce the reference's shorter page or five-link navigation requires Halil's decision; no checks were changed.
- Colours: home hero #f7f5f2, soft sections #faf9f7, filter tabs #f1efed. Buttons grade from #d4a34e to #b6812a with navy text (at least 5.00:1). The reference's white text and darker gradient were adjusted for contrast. Accent text on the new hero is 4.5007:1; muted text on soft sections is 7.01:1.
- Fonts are self-hosted Fontsource Arimo 400/700 and Gelasio 400 for the reference appearance, with Brygada 1918 500 retained for existing inner headings. Colours and font values are defined only in tokens.css. All sample flags, the preview banner and launchReady remain unchanged.
- The call bar switches out of sticky positioning at 16.84rem, raised one 0.25rem step for Arimo. Dedicated checks pass through the last sticky text size at 320, 360, 375, 390, 412 and 430px. Header switch widths remain 19.9rem, 24rem and 77.5rem.

## EM Tile footer and mobile review - November 2026

The user confirmed EM Tile as the business name. business.json, shared copy and service-page metadata now use EM Tile. Sample flags remain unchanged. The sample site URL is retained until the owner provides the real address; a business-name change does not establish a domain name.

The shared footer now uses one design across all pages: a gold top rule, a white-backed logo badge and short introduction, two clearly separated navigation columns, and a navy contact panel. The contact panel shows the existing phone, email and service areas directly from business.json. A divided bottom row contains copyright and the privacy link. On phones the logo and introduction come first, then contact details, then navigation; desktop uses three columns. Navigation columns collapse as text grows instead of squeezing their labels.

New tokens: --color-footer-panel (#102a3a), --footer-nav-min (8rem), --footer-brand-measure (30ch). Light text on the panel and all links retain the shared focus and contrast rules. Footer links remain at least 44px tall, and the footer stays above the existing mobile call bar.

## Header refinement - November 2026

The user requested a smaller header logo and the five-link menu Home, Projects, Services, Contact Us, About Us. Header logo width is now 184px on desktop, 98px on ordinary phones and the existing 90px on the smallest phones. Header rows have 0.5rem vertical padding, and logo images use contain sizing, so their edges have breathing room.

The header progressively enhances to the five primary links from copy.site.nav.primary. The Services link leads to the home service section. With JavaScript disabled, the original direct service links and page links stay visible and fully usable; the footer retains those direct links in all cases. The original service-label data and protected checks are unchanged. The earlier note that five main links require changing the checks is superseded by this accessible static fallback.

The standalone phone icon beside View Our Work is removed. The hero retains a separate, readable phone-number link below the buttons, with no icon, through the optional showIcon=false CallLink property. Other call links retain their icons. All existing screen-width switches remain unchanged.

## Screenshot typography and menu spacing - November 2026

The user supplied Screenshot 2026-11-08 205018.jpg. Primary navigation now follows its wording and order: Home, Services, Projects, About Us, Contact. Navigation uses Arimo 700 at 0.9375rem with 1.875rem gaps; the current page has a gold underline and gold text. The desktop header shows a navy Contact Us telephone button and the gold quote button. The navy button is part of the enhanced five-link header; the static fallback retains all direct service links without crowding in that extra button.

Header logo width is reduced again to 168px on desktop. Phone widths stay 98px and 90px. Heading tracking is now -0.0286em, matching the reference's approximately -2px at a 70px display size. All colour and type values remain in tokens.css.

The request to remove the remaining hero phone-number link conflicts with the protected hero-call check in tests/browser/pages.spec.ts. It remains unchanged pending the owner decision required by rule 4; the header's navy telephone button is already available for the requested final placement.

## Complete logo artwork - November 2026

The user supplied Elegant Marble Tile Installation Logo.png to correct the visibly cut-off marble tip in the older embedded reference image. The new original is preserved byte-for-byte as src/assets/em-tile-complete.png. Logo.astro optimizes it as WebP and places it in a code-native SVG frame (viewBox 40 240 1480 580), excluding only excess blank canvas while preserving the complete marble tip, gold edges, lettering and surrounding shadow. The original 1536 by 1024 artwork remains untouched.

Desktop header logo width is now 160px. Phone widths remain 98px and 90px to preserve legibility. The footer uses the same complete artwork at its existing width. Existing vertical header padding remains, and the linked logo retains its accessible business-name label and at least 44px tap height.

## Owner-approved telephone placement - November 2026

Halil identified himself and explicitly authorized updating the protected hero-call requirement. This supersedes the earlier pending-owner note. The telephone link below Get a Free Quote is removed from Hero.astro. Desktop callers use the navy Contact Us button in the header; phones retain the header phone link and existing mobile call bar. Both use the existing number from business.json.

The corresponding browser check now verifies one visible header telephone link to the correct number on phone and desktop, the Contact Us wording when its desktop button is shown, the retained hero quote link, and the absence of any repeated hero telephone link. No other checks or launch controls are changed.

## Recent Projects screenshot layout - November 2026

The user supplied Screenshot 2026-11-08 211048.jpg. The home projects section now runs across the page with 1rem side gutters. From 900px, its heading, filters and gallery link share one row. Equal flexible outer columns keep the filter group truly centred; View More Projects stays at the right. On phones the filters wrap into centred rows with natural-width buttons rather than stretching the last button.

Home filter categories and their order are All, Bathrooms, Kitchens, Floors, Walls. The explicit home presentation map classifies the current sample office washroom's wall-tile view under Walls, independent of its commercial service-page link. Unknown future projects retain their actual service classification. Project URLs, content facts, ordering and the four-project limit remain unchanged. The sample artwork is now selected by category, so shower, wall, kitchen and floor illustrations match the corresponding card rather than being assigned by list position. Real projects retain their own photos.

Cards use 12px corners, a subtle token-defined shadow, 175px-high cover photos and pale caption panels with bold 15px titles and 12px category labels. Four columns appear on desktop; the rem-based minimum card width lets phones stack cards as text grows. Category labels are a home-only ProjectCard option; other pages still show the actual city. All photos remain lazy-loaded and sample flags remain unchanged. The reference's real shower photo is not added without confirmation of written publication permission.

New spacing, size, corner and shadow values live in tokens.css under the home-project tokens. The existing CSS radio filtering continues to work without JavaScript.

## Projects button interaction - November 2026

View More Projects keeps its outlined resting appearance and takes the shared gold gradient, gold border and navy text on hover, keyboard focus and press. It uses the existing button colour tokens, keeps its visible focus ring and does not move or animate.

## Trust and client-review reference - November 2026

The user supplied Trusted for Quality & Reliability.png. The existing proof and review sections now share a warm, light background and follow this reference. The proof eyebrow reads Why people call us, with the heading Trusted for Quality & Reliability. and its final phrase in accessible dark gold. Three white, rounded fact cards have a gold lower edge, soft shadow, circular calendar/location/shield icons and a vertical divider. Values still come directly from business.json; missing facts drop their entire card, and an empty proof section disappears.

The Client Reviews section has the What clients say eyebrow and three rounded white cards, gold quotation marks, italic body copy and a divided source area. Existing review words, authors, cities and individual Sample review labels are preserved. Gold stars are decorative mockup elements on explicitly labelled sample reviews only; real reviews without a provided rating receive no stars. No ratings or Review structured data are created.

The two arrow buttons cycle only the existing review cards, keep focus on the button and announce the first review position to assistive technology. They do not autoplay or animate. Without JavaScript the controls stay hidden and every review remains readable. On phones the cards stack; desktop shows three columns. The browser check exercises next/previous ordering, content preservation and keyboard focus.

New trust-card, icon, spacing, quotation and shadow tokens live in tokens.css. Sample flags and launchReady remain unchanged. Existing proof-card presence checks and content-state checks are retained.


## Compact trust and reviews refinement - November 2026

The user approved refining both sections against the same supplied screenshot. Fact cards now use 20px padding, 64px icons, 48px numbers, 18px labels, 14px corners and a lighter shadow. The gap between cards is 16px. Section headings use their own responsive size, leaving other home headings unchanged; Gelasio display and Arimo body fonts remain self-hosted.

Review text is 16px italic with smaller quotation marks and stars. The Sample review label now shares the compact source area with the existing author and city, preserving every sample disclosure while removing the extra top row. Card heights follow their text, including at enlarged text sizes. No business facts, review wording or controls changed.


## Service areas and marble contact reference - November 2026

The user approved matching Luxury Tile Services in Mississauga.png on the home page. Service areas have a Where we work eyebrow, a Gelasio heading with Nearby Areas. in accessible dark gold, the existing introduction and four shallow cards with outline location pins. Names continue to come from business.json; the base city receives the shared gold gradient with navy text for readable contrast. Cards use 56px minimum height, 10px corners and 16px gaps, with a 13rem minimum column width so enlarged text reflows.

The homepage closing contact panel now uses HomeCta.astro; other pages retain CtaBand.astro. The new panel has a white solid text backing, Get in touch eyebrow, two-line Gelasio heading, gold telephone button and outlined message button with a gold arrow. An AI-generated materials illustration shows three stacked white, grey and charcoal tiles beside the copy, separated by a gold diagonal from 1000px up. Smaller screens stack the image below the text. The original telephone and message destinations remain unchanged. The image is lazy-loaded with responsive WebP sizes and kept as sample-marble-tile-stack.png; no real installation photo or business fact was added, and all sample flags remain.

Image generation used the built-in image_gen tool. Final prompt: "Use case: product-mockup. Asset type: decorative website contact banner image, landscape 3:2. Primary request: photorealistic studio still life of three large square porcelain tile samples stacked slightly offset diagonally on a white marble surface. Top tile white ivory Calacatta marble with subtle warm gray and beige veins, middle tile medium warm gray stone, bottom tile dark charcoal marble with thin white veins. Low oblique overhead view, tile edges visible and realistic thickness, corners point toward lower left, top white slab occupies upper right. Bright soft daylight, subtle shadows, elegant quiet luxury. Fill frame with tile slabs, natural marble backdrop at edges. No text, logos, people, tools or other objects. This is a materials illustration, not a completed installation."


## Owner-authorized consultation placement - November 2026

After the protected final-CTA rule was explained, the user confirmed Halil authorizes the change. The home About Us and contact form block now follows the marble Get in touch panel and is the final content before the footer. The browser order check retains the hero-first and exactly-once section assertions, and now checks the closing sequence: marble CTA, About Us, contact, with the consultation block last. This supersedes the earlier final-CTA placement requirement for the homepage only.

The supplied Elegant Tile Design Consultation Section.png guides the two-column composition: narrower about column, wider contact column, thin divider, Gelasio headings with gold final phrases, shortened supplied about paragraph and three supplied outline-icon labels. Phones stack About Us above the form. Inputs remain at least 44px tall, the submit button at least 48px, and long labels wrap. The message hint remains available to assistive technology. A homepage-only paper-plane icon appears on submit. All Netlify attributes, field names, required fields, sample flags and delivery destinations are preserved. Colour, type and dimension values remain in tokens.css.


## Shared dark marble footer - November 2026

The user approved the supplied Elegant Dark Marble Tile Footer.png across every page. The footer now has a restrained navy marble background, large transparent white-and-gold EM Tile logo, service-specific outline icons, page icons with chevrons, thin column dividers and white Gelasio section headings with short gold rules. The contact panel is solid navy with rounded gold edges, larger telephone type, an envelope icon and divided service-area details. The bottom row retains the current copyright year, business name and privacy destination, separated by a gold rule. A small diagonal marble corner appears only on wide screens.

All links, business details and navigation labels still come from their existing data. Main text uses solid navy backing, and the contact text uses the solid #102a3a panel, preserving at least 4.5:1 contrast. Gold icons and lines use the existing #d4a34e accent-on-ink token. Keyboard focus and 44px link targets remain. On phones the brand, contact panel and navigation stack; columns and long words reflow at enlarged text sizes. New dimensions and opacity are footer-only tokens. Header logo artwork remains unchanged; only the dark Logo variant uses the new transparent asset.

Image generation: built-in image_gen. Final assets: src/assets/sample-footer-navy-marble.png and src/assets/em-tile-on-dark.png. Background prompt: "Use case: ads-marketing. Asset type: decorative website footer background, wide landscape 3:1. Deep midnight navy marble, very subtle natural blue-gray thin marble veins only near far left edge and upper right and bottom right edges, central 80 percent almost uniform dark navy #091e2b. Flat straight-on polished marble texture, no objects, no lettering, no logos, no borders, no gold, no text, restrained contrast. This is a background texture, not a webpage screenshot."

Final logo edit prompt: "Edit the attached EM TILE logo. Preserve exact layout, lettering shapes, overlapping marble diamond tiles and metallic gold. Keep EM and TILE INSTALLATION warm white, TILE metallic gold. Remove ALL glow, haze, halo, bloom and shadows outside the actual logo shapes. Outer background MUST be genuinely fully transparent, clean sharp alpha edges only. No black background, no gray or gold mist, no fuzzy glow around any letter or tile. Preserve the marble inside diamonds opaque, preserve every diamond tip. This is a clean transparent logo cutout for a dark navy website, not a luminous neon sign." The original light-background logo is preserved.

Footer large-text refinement: the brand column explicitly uses minmax(0,1fr), so the 18rem logo and location line shrink within a phone at 150% and 200% text. Link type is 16px; wide-screen navigation gives the services column more room than Explore. Footer-only labels use the reference capitalization Get in Touch, Areas We Serve and Privacy Notice.


## Compact footer and designer credit - November 2026

The user requested a thinner shared footer, smaller logo, one marble surface at the diagonal corner and the English credit Designed by epasho centred between copyright and Privacy Notice. Footer vertical padding is now 24px, the grid-to-legal gap 20px, the logo 200px, headings 22px, body and legal copy 14px, link labels 15px and icons 24px. All links retain their 44px minimum target. The contact card uses 16px padding and tighter spacing. The current year still comes from the date and business details from business.json.

The legal row has equal flexible outer columns to keep the designer credit centred; phones stack the three items in order. The decorative corner isolates the upper white marble surface of the existing materials illustration through a CSS close-up, displaying a single marble plane rather than a stack. No new bitmap is needed. The dark marble background, original logo artwork, navigation and contrast colours are retained.


The user corrected the designer credit capitalization and punctuation to Designed by E.Pasho. Placement and styling remain unchanged.


## Remove sample client reviews - November 2026

The user requested removing the What clients say / Client Reviews section. All three review entries were explicitly labelled samples and have been deleted, as allowed by the sample-content rules. The existing empty-collection behaviour now omits the section completely, closing the gap between the trust cards and service areas. No real review was removed, no sample flag was cleared and no check was modified. The component remains available if genuine reviews are supplied later.


## Projects portfolio reference - November 2026

The user approved adapting Modern Tile Projects Portfolio Page.png on /projects/. A breadcrumb with a home outline icon leads into the Tile projects eyebrow and Our Tile Projects Gelasio heading, with Projects in accessible dark gold. Existing introductory words remain. A decorative optimized version of the existing stacked-tile illustration sits at the right on wide screens; phones omit this decorative area so the heading stays compact. Copy always has a solid white backing. SEO metadata, canonical path and structured-data helpers are unchanged.

The existing service radios now optionally display gold outline icons. This option is used only on the projects page, preserving the homepage filter presentation. Five white rounded, softly shadowed filter buttons wrap naturally and the selected option uses the shared accessible gold gradient, navy text and an underline. Native radio keyboard focus and CSS-only filtering remain. The 10rem minimum basis prevents normal phone labels splitting within words.

Project photos keep their existing content, source order and individual URLs, using a 2.1 wide crop with 14px rounded corners, three columns on desktop, two on tablets and one on phones. A solid navy Project badge is displayed over each photo. Existing project titles, cities and tile details remain below the photo; sample content flags are unchanged. The shared card receives only an optional badge and a media wrapper, and retains its original appearance elsewhere. The first project photo remains the only eager, high-priority image; the header illustration is decorative CSS. New values are portfolio-only tokens.


## Projects background and filter precision - November 2026

The user requested a closer match to the same reference, specifically the button widths, background fade and placement of the slabs. A new decorative header asset, sample-projects-marble-banner.png, is edited from the supplied reference: three whole offset slabs at the upper right, gold diagonals, a navy corner and a soft marble fade into warm white. The old rectangular close-up and vertical border are removed. Intersecting horizontal and vertical CSS masks blend the artwork before the solid copy panel and before the filter area, avoiding a visible image boundary. The whole projects page uses #faf9f7 so the header and filter backgrounds are continuous.

Wide-screen filter proportions now follow the reference: 1 / 1.28 / 0.93 / 1.03 / 1.22, giving Bathrooms and showers room on one line. Phones retain wrapping with the existing 10rem minimum basis. Selected filters use white text on a dedicated deeper gold gradient (#9f6b10 to #8d5d0d), measuring 4.58:1 and 5.67:1 respectively; the heading gold and muted text both retain at least 4.5:1 on the new background. Other pages keep their existing button colours. The underline, native checked state and focus ring remain.

Built-in image_gen was used for the final asset at src/assets/sample-projects-marble-banner.png. Prompt: "Edit target: supplied website screenshot. Produce ONLY the decorative upper background banner, no website content. Preserve as closely as possible the EXACT three floating square tile slabs at upper right: bright white Calacatta marble tile on top, medium gray stone beneath, charcoal bottom, all whole rectangular slab edges visible, same angle, scale and arrangement as screenshot. Preserve dark navy diagonal corner at upper right and the two diagonal metallic gold stripes behind the tiles. Preserve the soft white marble texture fading into almost plain warm white on the left and along the entire bottom edge. Remove ALL breadcrumb text, headings, paragraphs, labels, buttons, icons, and the entire lower project photo gallery. Fill their areas seamlessly with warm white. Output a wide landscape background 3:1, approximately 2000x667. Keep tile grouping in rightmost 32% of full canvas; leftmost 60% must be empty plain warm white #faf9f7 for text backing, no conspicuous veins there. Very soft fading edges at bottom and left, no rectangular photo boundary, no crop cutting tile tips, no text whatsoever. This is a decorative website header background." Project photos, details, URLs and flags are unchanged.


## Projects artwork reaches the screen edge - November 2026

The user reported the right-hand artwork ending early on wide screens. The decorative header now has a full-width outer container, with the breadcrumb and text in a separate centred inner wrapper. This removes the previous 1280px artwork boundary while preserving alignment with the project filters and cards. The marble/navy artwork reaches the right viewport edge at both 1280px and 1920px; mobile layout and the existing fade remain unchanged.


## Thinner, longer project filters - November 2026

The user requested slimmer, more elongated filters in the same order as the reference. Visible filter faces now start at 36px high with 24px icons, 4px vertical face padding and 10px corners. Each radio label adds 6px above and below, preserving a 48px full clickable target without making the visible face bulky. Labels can grow with larger text. On wide screens the filter row expands to 85vw whenever that is wider than the content column, keeping its centre and reference column proportions. Project card widths, order, content and all other buttons are unchanged.


## Project filters align with the cards - November 2026

The user clarified with Screenshot 2026-11-09 113447.jpg that the thin filters must begin at the first project card and end at the last card. The 85vw row expansion is removed. The fieldset now uses its normal full content-column width, exactly matching the gallery outer edges at every width. Slim 36px faces, 48px clickable radio targets, reference proportions, order and responsive wrapping remain unchanged. This supersedes the earlier wide-row expansion note.


## About page screenshot redesign - November 2026

The user approved adapting EM Tile About Us Overview.png on /about/. The page now has a full-width shower illustration beside a solid white copy panel, split by a gold diagonal. The About eyebrow, About EM Tile heading with the business name in accessible gold, current lead and breadcrumb match the reference composition. On phones, copy and photo stack. The image is a labelled sample design illustration, eagerly loaded with responsive WebP sizes; no real installation photo was added. The business name is sourced from business.json.

What we believe uses two columns separated by a fine vertical rule on desktop and stacks on phones, showing the first two existing paragraphs as in the reference. How we work has five white rounded cards, pale circular gold icons, numbered bold titles and decorative arrows between cards on wide screens. The supplied shorter wording is used for the first three steps. All copy remains in copy.json and sample flags are unchanged. Steps wrap naturally on phones and tablets.

Experience and areas share a rounded navy panel, with calendar/location/shield icons, white figures, thin separators and a small single-marble diagonal corner. Counts, credentials and city names remain sourced from business.json. Missing-fact and empty-panel behaviours are preserved. Main facts have solid navy backing and high-contrast light text. The existing closing contact links remain below this composition. Page metadata, schemas, URLs and checks are unchanged. All new type, dimension and corner values are about-only tokens.

Image generation used built-in image_gen. Final asset: src/assets/sample-about-shower-illustration.png. Prompt: "Use the supplied About Us page image as the visual reference. Create only the bathroom illustration shown in its upper-right hero, no webpage, no text, no icons, no diagonal divider. Match the bathroom carefully: large warm gray stone-look porcelain shower tiles, frameless glass enclosure with black vertical handles, matte black rainfall shower and handheld shower on right wall, horizontally recessed niche on left softly illuminated with warm LED and two small dark bottles. At right a pale vanity counter, oval white basin, mirror, and ceramic vase with green leafy branches. Soft warm architectural daylight. Composition straight-on with shower filling left and centre, vanity at right, photorealistic architectural illustration, landscape 3:2, polished but plausible, all important shower fittings fully visible. No people, logos, lettering, brands or watermarks. This is a generic design illustration, not evidence of a completed business project."

About-page verification refinement: facts-panel padding is capped at 6vw so enlarged headings keep Experience whole at 320px and 200% text. Solid navy backings follow the text rather than filling the whole areas column, leaving the decorative marble corner with a clean diagonal edge. The corner crop uses a height-based close-up to show only the white marble surface.


## Compact, equal About cards and matching closing panel - November 2026

The user requested smaller spaces, equal work cards and the same closing design as the home Get in touch panel. About hero height is reduced to 18-23rem; story/work section padding and the facts-to-contact gap are 24px. Work cards use 16px padding, 56px icon circles, 36px icons, 16px titles and 16px gaps. Equal grid rows and full-height cards keep every card the same height across wrapped rows; title slots reserve two lines. Five columns remain on wide screens and phone cards reflow without clipping text. Facts padding is reduced to 16-28px with the existing viewport cap for enlarged headings.

About now reuses HomeCta with page-specific words from copy.about.cta: Let's talk / about your space. It has the same stacked-marble image, gold diagonal, white text backing, eyebrow, gold telephone button and outlined message button as the homepage. HomeCta accepts optional content, defaulting to its original home words, so the homepage appearance remains unchanged. Metadata, forms, business facts, URLs, sample flags and checks are unchanged.


## Clean About hero diagonal - November 2026

The user reported a white rectangular notch interrupting the gold diagonal. The About hero copy backing is now 41% of the inner content and the photo is 55% of the viewport, creating clearance between the text panel and diagonal. The photo sizes declaration follows the 55vw frame. The solid white text backing is retained, and the hero keeps its compact height. No image, wording or other section changed.


## Slim experience panel aligned to work cards - November 2026

The user requested the Experience and credentials panel match the outer edges of the work cards and become smaller and thinner. It now sits inside the same wrap and 5% gutters as the work-card grid, with no wider full-page panel. Padding is 16px with the 6vw enlarged-text cap, title 26-32px, figures 32px, main icons 28px and fact copy 13px. Experience spacing is tightened, and cities form two columns on desktop to reduce height. Mobile content stacks normally, with no fixed height or hidden facts. The navy/gold appearance, marble corner, all business values and missing-fact behaviour remain unchanged.


## Keep compact facts corner clear of text - November 2026

The user reported rectangular interruptions in the gold/marble corner after the experience panel became thinner. The decorative corner is now a small 3rem-wide accent confined to the bottom padding, below all text and lists. It no longer passes behind the solid text backings, so the gold diagonal has no notches. The aligned panel width, compact height and all content remain unchanged.


## Visible marble corner with reserved space - November 2026

The user asked to restore a visible tile after the small accent became too subtle. On desktop the marble corner is a 96px triangle, and the areas column reserves the same 96px at its right edge so text backings never interrupt the diagonal. The city grid uses an adaptive minimum column width, allowing one column at enlarged text. Phones retain a visible narrow corner capped at 12vw, clear of the city labels. Panel width and compact spacing are preserved. This supersedes the tiny bottom-padding accent.


## Contact page reference - November 2026

The user approved matching EM TILE Contact Page.png. Contact now has a full-width shower illustration and gold diagonal, the Contact us eyebrow and two-line Let’s talk about / your project. Gelasio heading. Existing phone and email links sit under the introduction, sourced from business.json. The existing sample bathroom illustration is reused, eagerly loaded with responsive sizes, without adding a real project photograph. Hero copy remains on a solid white backing with the same diagonal clearance as About. Breadcrumb schema and SEO metadata are retained.

Below, a rounded white form panel sits left of a navy What happens next panel and a white Areas we serve card. The outer page has a softly washed marble material background, while all text panels have solid backing. The form uses compact 14px labels and fields, at least 44px input heights, an 80px message box and a paper-plane submit icon. Every existing field, required attribute, field name, Netlify delivery setting, hidden trap, subject and destination remains. The required-field note and message hint remain accessible but are visually compacted. The two existing optional selectors are kept as agreed. Sidebar steps have gold circled numbers, and city names have gold outline pins. Phones stack hero copy, image, form and side cards. All new values are contact-only tokens; shared form appearance on other pages is unchanged.

The contact hero telephone and envelope icons use small pale circular backings, and wide screens show the reference's gold divider between the two links. Phone layouts keep the links free to wrap.


## Smaller About text below the hero - November 2026

The user requested smaller lettering in the lower About Us sections. Main section headings now range from 26 to 34px, body introductions are 15px, work-card titles 15px, experience headings 24-28px, figures 28px and the areas subheading 16px. Existing 14px card paragraphs and 13px fact labels remain readable at their current sizes. The About-only closing panel uses 28-36px display text, 15px body copy and smaller button lettering with unchanged tap heights. The top About hero, homepage, Contact page and shared footer keep their original type sizes. Equal work-card heights and responsive text growth remain.


## Smaller About opening to match the supplied crop - November 2026

The user supplied Screenshot 2026-11-09 122743.jpg for the About opening. Its display heading now ranges from 32 to 48px, the eyebrow is 12px and the lead 16px, with 12px copy gaps. The desktop hero is reduced to a 15-18rem starting height and still grows if text needs room. Gold emphasis, the complete wording, solid text backing and the uninterrupted diagonal are retained. Other page heroes are unchanged.


## Homepage menu centred on the page - November 2026

The user requested Home, Services, Projects, About Us and Contact sit at the true centre of the homepage header. On the enhanced desktop homepage only, the primary navigation is centred independently in the header row, and the contact/quote actions remain grouped at the right. Logo and action widths no longer shift the menu left. The existing 77.5rem switch, mobile menu and no-JavaScript direct-service navigation are unchanged. Other pages keep their current header alignment.


## Homepage header screenshot proportions - November 2026

The user supplied Screenshot 2026-11-09 163637.jpg to refine the homepage header. Its enhanced desktop row now spans the viewport with 4% gutters, a responsive 160-256px logo, 88-112px starting height and 6px vertical padding. Menu labels range from 15 to 17px with wider responsive gaps; the five primary links remain exactly centred on the page. Right-side action labels range from 14 to 16px. The quote button uses white text on a deeper gold gradient (#9f6b10 to #8d5d0d), preserving at least 4.58:1 contrast. The navy telephone button remains alongside it. Phones, inner pages and no-JavaScript navigation keep their existing layouts. The 77.5rem switch and protected checks are unchanged.


## Homepage menu shifted slightly left - November 2026

The user asked to move the primary links a little left to match the supplied header screenshot more closely. The enhanced desktop homepage navigation now sits 3.5vw left of centre, capped at 4rem, approximately 62px at the reference width. Logo and contact/quote buttons stay in place. This supersedes the earlier true-centre alignment note; mobile and other-page headers are unchanged.


## Service-page reference designs - November 2026

The user approved matching the Bathroom, Floor, Kitchen Backsplash, Wall Tiling, Custom Tile Layouts and Premium Tile Finishing references. ServicePage.astro now shares a full-width solid white copy panel and a right image with an uninterrupted gold diagonal; compact Gelasio headings; six equal-height cards with service-specific gold SVG icons; five numbered process cards with chevrons; a compact navy contact panel with a gold-edged marble corner; and links to the other services. Custom layouts have their own step labels. Original service prose, visible highlights, related-project links, FAQ answers and SEO remain. Commercial retains its original URL and content. Contact facts come from business.json.

The four original collection categories remain fixed, as required by the protected content check. Three additional presentation pages at /services/wall-tiling/, /services/custom-tile-layouts/ and /services/premium-tile-finishing/ use the same component and sample wording in additional-services.json. Their material-selection notes use native expandable panels. Concept galleries are labelled design illustrations, never completed jobs. Their sample flags remain true. Home's six tiles now open the matching pages; a separate visible Commercial link preserves that service. No protected checks changed.

Service-only tokens: main headings 32-56px, section headings 26-40px, introductions 17px, labels 15px, icons 40px, feature minimum height 104px, corners 14px. All six feature cards share one grid row height. Phones stack image and copy, use two feature columns and vertical process steps. Desktop included/process sections split 1:2 and 1:3. Original project images retain loading/priority behaviour. The 77.5rem switch remains in the dynamic service route.

Generated sample assets: src/assets/sample-service-{wall,custom,premium}.png and sample-service-{bathroom,floor,kitchen}.jpg. The three JPEGs are also sample spare images in the existing sample project folders, with sample flags retained and illustration descriptions. The floor hero selects the concrete-look project through collection metadata. PNG outputs were encoded to JPEG to meet the protected sample format requirement.

Imagegen prompt common wording: photorealistic wide landscape 3:2 architectural design illustration, warm neutral residential lighting, realistic material and precise joints, no text, logos, website UI, collage or people. Subjects: large pale-grey rectangular wall tiles, white ledge, ivory vase and green leaves with spotlights; beige herringbone backsplash, white vessel basin, gold faucet and glowing mirror; ivory marble corner with gold profiles and horizontal trim; greige walk-in shower with illuminated niche, black fixtures and vanity plant; large-grey-porcelain living room with patio doors, plants and beige sofa; ivory glazed subway backsplash with undercabinet lights, cutting boards, herbs and black stovetop. These are illustrative assets, never real job claims.


Halil explicitly confirmed his identity and authorised adding the three new pages to the protected browser coverage list in this conversation. tests/browser/site.ts now includes those three URLs, so all existing generic accessibility, responsive, heading and keyboard tests cover them. No existing checks were removed or weakened. This supersedes the earlier no-protected-check-changes note for this exact addition. Service display titles use 12vw/11vw caps so complete words fit at 200% text. Hero responsive-image sizes account for both the 55vw frame and cover cropping, with a minimum 800px desktop request and 480px phone request to retain sharpness.


## Closer service reference proportions - November 2026

The user requested another detailed comparison and smaller openings on every service page. Hero display titles now use the short service names from the supplied references, with the original SEO titles, summaries and content retained. Hero heading size is 28-40px with a 12vw phone cap, introduction 15px, copy padding 16px, gap 10px and minimum image height 240px. The frame remains responsive and grows for enlarged text rather than clipping it.

Feature icons now follow the reference assignments: bathroom shield, stacked tile, shower niche, floor grid, edge profile and finishing sparkle; floor stacked preparation, grid, spirit level, grout drop, edge and sparkle; kitchen grid, layers, edge, drop, heat waves and sparkle. New niche, spirit-level and heat-wave SVGs were drawn in the existing outline system. The stacked-tile SVG stays within its viewbox. Labels use the supplied line groupings, all cards retain equal height, icons are 44px, process figures 36px. Gold section rules and the navy contact heading underline are 4px. Empty related-project wrappers no longer add space to the three additional pages. All existing project, content, SEO and form behaviour remains.

Reference line breaks are now explicit for each hero, feature label and process step. Hero lead width is 384px. The five residential other-service cards match the reference row, with Commercial retained as a separate visible link; Commercial itself still links to all six residential services. Decorative icons use the existing gold accent, while text keeps its accessible darker gold. The contact marble corner is 120px with reserved desktop space and 64px mobile bottom clearance.

Service headings now load the actual Gelasio 700 font and use it only in these service views to match the heavier reference lettering. The other pages keep their existing weights. Service breadcrumbs include the middle Services link shown in the references.

Phone hero pictures use a shorter 160px frame, reducing the stacked opening by another 80px while keeping all text visible. Desktop openings measured 249-295px at 1280px, compared with the earlier 320px minimum and larger text-driven openings.

A faint separator precedes the process row, and project/inspiration headings use the same gold underline as the supplied gallery headings.

On phones the contact heading uses a 9vw cap with a 1rem minimum, so long words remain whole at 200% without making a heading smaller than body text.

The phone contact-heading minimum follows --text-base (17px at normal text), including intermediate 175% enlargement, rather than a fixed 1rem minimum.


## Remove standalone Commercial links and update phone - November 2026

The user requested removing the separate Commercial Tile Installation arrow link. Both standalone links beneath the home service icons and service-page card rows were removed; the Commercial page and existing navigation/footer links remain. The provided real phone is displayed exactly as +905 904 5116, with tel:+9059045116 used consistently by all shared call components and structured data. Its sample flag is false because the user supplied this real value; no other flags changed. No country prefix was inferred or added.


## Stacked marble tab icon - November 2026

The supplied EM Tile Stacked Marble Logo.png now supplies the existing /favicon.svg. The original image was resized for icon delivery and embedded as PNG data in the SVG; its square viewport frames the white rounded app tile and omits the distant black outer margins. The white and charcoal marble slabs and gold edges retain the supplied artwork. Existing SEO icon markup and all page URLs remain unchanged.


## Remove Recent Projects illustration note - November 2026

The user requested removing the sentence below Recent Projects on the homepage. Its rendered paragraph and unused note styles were removed. The source copy remains available, all sample flags remain unchanged, and the protected preview banner remains on every page.


## Gold service-label hover - November 2026

On the homepage six-service row, hovering a link changes its label to --color-accent-text, exactly matching the existing icon stroke. Keyboard focus applies the same gold label while retaining the shared focus ring. No animation or layout change is introduced.

While verifying all six service links, the last two destinations were aligned with the displayed Premium Tile Finishing and Custom Tile Layouts order.


## Service-area hover highlight - November 2026

On pointer devices, the gold area-card highlight follows the hovered city. Mississauga returns to white when another city is hovered and restores its default gold when the pointer leaves the row. The hovered icon uses the dark label colour against gold. Informational list semantics remain; no artificial button action or extra tab stop was added. Touch devices keep the original Mississauga highlight. This CSS-only effect uses existing accessible gold/navy tokens and introduces no animation or layout movement.


## Plain white city cards - November 2026

The user reversed the city-card hover request and requested plain white cards. All four cities now use the same white background, navy text and gold pin, including Mississauga. Both the default gold base-city style and pointer hover rules were removed. The earlier gold text hover on the separate service-icon row remains as requested. This supersedes the area-hover entry.


## Smaller service feature and process cards - November 2026

The user requested smaller cards on every service page and precisely centred connecting arrows. Shared feature cards now use 32px icons, 14px labels, 8px padding, 4px internal gaps and an 84px minimum height, with 10px corners. Process figures are 28px; desktop steps have a 92px minimum height and vertically centred content. Desktop process gaps are 20px. Text-glyph arrows were replaced with crisp CSS chevrons centred at half the gap and half the card height, independent of font metrics. Cards retain equal grid heights and can grow with enlarged text. Phone steps remain a vertical list without sideways arrows. Other service-page sections keep their existing dimensions.


## Smaller Other services cards - November 2026

The user requested reducing the remaining Other services cards on every service page. These now share the compact 32px icons, 14px labels, 8px padding, 4px gaps and 10px corners of the feature cards, with an 88px minimum height. The arrow shares the label row at its lower-right instead of occupying a separate row. All cards retain equal row heights and expand for enlarged text; destinations, wording and focus rings remain.


## Smaller navy contact-panel titles - November 2026

The user requested reducing the large headings inside the navy service contact panels on every service page. The shared title now uses a dedicated 22-28px responsive token, preserving the Gelasio font, gold underline, wording and other section headings. Phones retain a body-size minimum at enlarged text so the smaller title remains readable and whole words fit.


## Site-wide typography unification - November 2026

The user approved the global type cleanup with "ok". All page headings now use Gelasio 400; body text, labels and controls use Arimo. Shared role tokens replace independent page title sizes, while compact service cards and contact panels keep their smaller roles. Page titles do not exceed 40px at normal desktop text. Work-card/project-card headings share the display family and 16px size. Home/contact form controls now use 16px. Wording, facts, samples, SEO helpers, form delivery, URLs and full-menu switch remain unchanged.

The mobile navigation tiles also use Arimo, matching every menu. The desktop home image begins at 48% so the smaller headline and lead remain fully on the solid copy area without notching the gold diagonal. Image requests remain conservatively sharp.


## Slightly smaller header logo - November 2026

The user requested a slightly smaller logo at the top. Header logo widths were reduced by about 10%: 82/90px on phones, 144px on inner desktop pages, and clamp(144px,13vw,232px) on the enhanced desktop homepage. The supplied artwork, aspect ratio, footer logo, tab icon and 44px minimum link tap height remain unchanged.


## Smaller regular-weight footer phone - November 2026

The user requested reducing the footer contact-panel telephone and removing its bold weight. It now uses the same 15px size as footer links/email and Arimo 400, with the existing 44px tap height, gold icon, focus ring and shared business number retained. Other call links retain their existing styling.


## Cloudflare form delivery and reference thank-you page - November 2026

Halil approved the combined plan: use FormSubmit for the GitHub-connected Cloudflare Pages site, remove the visible preview banner while retaining noindex/sample protections, redesign the thank-you page from the supplied banner and adapt the related protected checks, including the earlier removed Commercial home link.

The real site URL is now https://em-tile.pages.dev, supplied by the owner, with its URL sample flag cleared. launchReady remains false and every other unconfirmed sample flag remains. site-settings.json controls explicit banner visibility and form provider. PreviewBanner and its wording remain available; the owner has selected hidden. SEO helpers and BaseLayout remain intact. The audit continues enforcing noindex while not launch-ready and tests cover the owner-disabled banner state.

Both forms submit HTML POST requests directly to FormSubmit using the canonical business email. All original field names, subject and bot-field remain. Provider _subject, absolute _next, default spam challenge and an additional hidden-from-keyboard _honey trap support Cloudflare without a Worker, API key or JavaScript. Legacy Netlify attributes and a Netlify settings option remain for compatibility. Privacy wording now identifies Cloudflare hosting and FormSubmit delivery. Actual delivery requires the owner to confirm FormSubmit's activation email, then verify a real follow-up test; automated tests mock the provider and do not send email.

The thank-you card uses a gold circled check and divider, Gelasio title in the supplied two-line wording, solid white copy area, gold diagonal and a new beige/gold shower illustration. Home and project buttons use matching outline icons. A navy call band has a large phone outline, source-copy prompt, current business number and gold-edged marble corner. The unified 30-40px page-title scale is retained. On phones the heading stacks to keep whole words readable at 200%, the photograph sits below copy, and the call prompt wraps naturally. Existing thank-you SEO remains noindex.

Generated illustration: src/assets/sample-thank-you-shower.png. Imagegen prompt: photorealistic warm beige stone-look shower with large rectangular tiles, gold rainfall head and handshower rail, illuminated recessed niche with two black soap bottles, glass screen, pale oak vanity with white top, white pot and fresh green leaves beside a curved mirror; photo only, no text, logos, UI, collage or people. It is a design illustration, not a real completed job photo.

The externally commented-out pages.spec.ts was restored, with a temporary backup kept outside the repository. Existing checks remain active. Home still verifies all six residential service destinations in main, and Commercial through existing header/footer navigation. New form tests cover POST fields, optional email, provider acceptance/redirect and failure without falsely showing success, including JavaScript off. Audit tests retain legacy Netlify coverage and add strict recipient, redirect, subject and spam-trap checks for FormSubmit. Documentation validation now recognises the settings data file.


## Mobile header and home actions - November 2026

At phone widths up to 760px the header hides its compact telephone, leaving the logo and Menu. Footer and bottom call-bar phone links remain. The two hero action buttons share a single horizontal row with equal flexible widths and compact horizontal padding; text may wrap within each button when enlarged. Tablet and desktop layouts retain their existing telephone and button presentation.

Halil explicitly approved adapting the header telephone checks to this mobile change. They now assert no visible header phone on mobile, a working bottom call link, horizontal hero actions, and unchanged visible desktop calling. The enlarged-text in-flow bar cases still check footer placement and verify the phone link can be scrolled into view.


## Mobile Get in Touch actions - November 2026

The shared HomeCta phone and message buttons remain side by side through 760px, including the compact About version. Each shares the row, with the established 14px button type, compact padding and 16px icons. Buttons retain at least 48px height; enlarged text can wrap within its own button without stacking the two buttons. Desktop styling is unchanged.


## Mobile Recent Projects heading actions - November 2026

View More Projects follows the heading before the service filters in reading and visual order. Through 760px it aligns with the left edge of the title. Filters use a regular three-column grid with centered labels and equal widths, keeping the final options aligned rather than floating in the center. Desktop retains its title/filter/link header row.
