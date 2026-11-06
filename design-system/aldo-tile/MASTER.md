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

- **Headlines:** Brygada 1918, weight 500. A stone-cut serif with a chiselled feel that suits the trade. Sentence case.
- **Everything else:** Hanken Grotesk, weights 400 and 600.
- Only these three font files load, Latin subset, self-hosted through Fontsource with `font-display: swap`. The imports are at the top of tokens.css. A new font about as narrow as Hanken Grotesk needs only that file (after `npm install` of the new font). A wider body font also needs the call bar's and header's switch widths raised (see "Screen widths"), because they were measured for Hanken Grotesk at weight 600. AGENTS.md says which numbers to change.
- Sizes are the `--text-*` tokens. Body text is 17px, and paragraphs stop at 65 characters wide. `--text-xl`, `--text-2xl` and `--text-3xl` have a `vw` cap, so at large text on a phone a heading stops growing before a long word would split. Headings there grow less than the 200% of body text, but a browser test checks they're never smaller than it from 320px to 430px, at up to 200% text. Footer headings are small labels on purpose and don't count.
- Long words at large text: browser tests keep heading words whole at 320px and 390px with 200% text. A heading can split a long word from 640px up at large text, and a long single word can split in a tile or list at large text. Don't assume words are always kept whole.

Avoid: all-caps labels, small labels above headings, coloring one word in a headline, arrows in button text, numbered markers on anything that isn't a real sequence.

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
| Under 16.6rem of width | `MobileCallBar` stops being sticky and stays after the footer, with its buttons stacked. At normal text no phone gets here. It starts at about 121% text at 320px, 147% at 390px and 162% at 430px. One fixed rem value has to be safe at 320px, so on wider phones the buttons would still just fit one row for a few percent past this point. The value (16.59rem in `MobileCallBar.astro`) was measured for Hanken Grotesk, so a wider body font needs it raised |
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
