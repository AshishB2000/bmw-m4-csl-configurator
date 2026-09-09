# Part pages: turning the configurator into a public site

Date: 2026-09-05
Status: approved, not yet implemented

## Summary

Publish a free, no-login website that explains how a car works, using the
existing 3D M4 CSL as the illustration. Every substantial part in
`src/data/parts.ts` gets its own static HTML page at `/parts/<id>/`, carrying
the text we already store (what it is, what it does, material, spec, how it
fails, what it costs). The existing configurator stays at `/` and becomes the
interactive surface people graduate to, reached from any part page via the
`?part=` deep link that already works.

Positioning: **"How a car works, shown on a real M4 CSL."** Not a parts
catalogue. The catalogue framing competes with retailers and loses; the
educational framing has no direct competitor, because nothing else shows a
part in place, on a real car, in 3D.

## Decisions

| Question | Decision |
| --- | --- |
| Audience | Curious people and learners. Not owners, not B2B, not portfolio. |
| Login | None. No accounts, no per-user state, anywhere. |
| Site shape | Text-first pages; 3D is a destination, not the landing experience. |
| Build | Static HTML generated at build time from the existing data file. |
| Framework | None added. No Astro, no Next, no router. |
| Monetization | None at launch. Structural slots only. See "Money" below. |
| Hosting | Static. Any free host. |

## Scope

**In scope**

- A generator script that emits one static HTML page per qualifying part (240 of them).
- A pre-rendered still image per page, produced by the existing screenshot tooling.
- Cross-linking: breadcrumb, children, siblings, subsystem index pages.
- A site index listing all subsystems.
- SEO basics: title, meta description, canonical, Open Graph, JSON-LD, sitemap.
- Empty sponsor and affiliate slots in the page template.

**Out of scope for this spec**

- Symptom search, repair cost estimator, quiz mode. All three sit on top of
  these pages and need them to exist first.
- A second car. The generator must not assume one car, but multi-car support
  is not built here.
- Any change to the configurator's behaviour, controls, or rendering.
- Analytics beyond whatever the host provides.

## Which parts get a page

Not all 372. The data has two distinct kinds of duplication, and both have to
be handled or the site reads as padded and search engines discount it.

**Duplication 1: numbered siblings.** "Injector 1" through "Injector 6" differ
by a single digit. Six pages, one idea.

**Duplication 2: repeated assemblies.** The four wheel corners carry
byte-identical text. `wheels.fl.hub` and `wheels.fr.hub` are the same words.
So are the twenty lug bolts, and the internals of all six pistons.

**Rule 1 — collapse numbered siblings.** A part is collapsed when its parent
has three or more children whose names are identical after stripping a
trailing number. Collapsed parts get no page; they render as a compact list on
the parent's page. Catches 60 parts.

**Rule 2 — merge identical text.** Parts whose `desc`, `fn`, `material`,
`spec` and `maint` are all identical share one page. The shallowest id wins as
canonical; the others become "appears at" positions listed on that page.
Merges a further 72 parts.

Both rules are mechanical and need no hand-maintained list.

Rule 2 produces *better* pages, not compromised ones. One "Wheel hub" page
that says it appears at all four corners is more useful than four identical
pages, and it is what a reader expects. The same is true for tire tread,
brake lines, and wheel bearings.

**Verified result: 240 pages.** Measured by running both rules over the real
data file, not estimated. By depth: 12 subsystem pages, 100 at level two, 98
at level three, 30 at level four. The generator prints this count and the spec
defers to it if the data changes.

## Architecture

Two independent surfaces sharing one data file.

```
/                       existing React app, unchanged
/parts/<id>/            static HTML, zero JavaScript
/parts/                 index of subsystems
/sitemap.xml
```

Part pages ship **no JavaScript at all**. They are text, a still image, and
links. The "View in 3D" control is an ordinary anchor to `/?part=<id>`, which
the app already understands via `fromUrl()` in `src/store.ts`. This is why no
router, hydration, or framework is needed: the two surfaces never share a
runtime, only a data file.

Consequence worth stating plainly: clicking "View in 3D" is a full page load
of a heavy WebGL app. That is the correct trade. It keeps every part page
instant on a phone, and only people who asked for 3D pay for it.

## The generator

One script, `scripts/build-pages.mjs`, run after `vite build`.

1. Import `src/data/parts.ts` directly with `node --experimental-strip-types`,
   the pattern `scripts/parts-stats.mjs` already uses. The data file stays the
   single source of truth; there is no second copy of the content.
2. Apply the collapse rule to get the page list.
3. For each page, write `dist/parts/<id>/index.html` from a template literal.
4. Write `dist/parts/index.html` and `dist/sitemap.xml`.

No template engine, no new dependency. The whole thing is string
concatenation over an array, and it should stay that way.

Ids contain dots (`engine.turbo.t1.wastegate`). Those are safe in URLs and
directory names, so the id is used verbatim as the path segment. No slug
mapping to maintain, no second identifier to keep in sync.

## Page structure

In order, top to bottom:

1. **Site header** — name, subsystem links, search link (search points at the
   app; part pages have no JS to search with).
2. **Breadcrumb** — the full ancestor chain as links. A cold visitor arriving
   from search needs orientation before anything else.
3. **Title and one-line context** — part name, its parent, its typical price.
4. **What it is** — the `desc` field.
5. **What it does** — the `fn` field.
6. **How it fails** — the `maint` field. This is the most search-valuable text
   on the site and it is already written for every part.
7. **Spec table** — `material` and `spec`, split into rows on the `·`
   separator the data already uses.
8. **Still image and "View in 3D"** — pre-rendered image, anchor to
   `/?part=<id>`.
9. **Sponsor slot** — empty div with a stable class name.
10. **Appears at** — for merged parts, the positions this part occupies
    ("front left, front right, rear left, rear right"). Omitted when there is
    only one.
11. **Children** — links to child parts, or the collapsed list if this part
    has numbered children.
12. **Siblings** — "nearby" links under the same parent.

Everything except the sponsor slot comes from data that already exists. No new
copy gets written for launch.

## Still images

Reuse `scripts/shot.mjs`. For each page, load
`/?part=<id>`, press `p` to enter photo mode (hides the UI), screenshot,
write to `dist/parts/<id>/still.jpg`.

Photo mode is currently keyboard-only, and Playwright can press a key, so the
app needs no change for this. Roughly 240 screenshots at a few seconds each is
a slow build step; it runs separately from the HTML generation and its output
is cached, so a content edit does not re-render every image.

If an image is missing the page still renders correctly, with the
"View in 3D" control and no picture. The generator warns and continues rather
than failing the build.

## SEO

- `<title>`: "Wastegate — what it is and what it does".
- Meta description: the `desc` field, truncated.
- Canonical URL on every page.
- Open Graph tags using the still image, so shared links show the part.
- JSON-LD as a `TechArticle` per page, and `BreadcrumbList` for the ancestor chain.
- `sitemap.xml` listing every generated page.
- Internal linking is the whole strategy: breadcrumb up, children down,
  siblings across. A 240-page site lives or dies on whether someone reads a
  second page.

## Money

Nothing is monetized at launch, deliberately. Every option except ads needs
traffic that does not exist yet, and choosing a revenue model now means
structuring 240 pages around a guess about who shows up.

What gets built now is the *structure* to add it later without touching the
template again:

- An empty sponsor slot per page, keyed by subsystem, so a single sponsor can
  own all of Brakes.
- The price field rendered as an element that can become an affiliate link
  with a one-line change.

Deferred, in the order they become viable: affiliate links (trivial, any
time), ads (needs traffic), dealer leads from the configurator (works at small
scale, likely the first real revenue), sponsored parts (needs traffic numbers
to sell), featured builds (needs a second car).

## Legal note

The model is CC BY 4.0, so commercial use is permitted with attribution, which
the README already carries. "BMW M4 CSL" is BMW's trademark. An educational
site is ordinary use; charging money for a product built around their
trademarked vehicle is a different question and needs real advice before any
money changes hands. This is a reason to keep the generator car-agnostic.

## Verification

- The generator asserts every emitted page has a non-empty title, desc, fn,
  and at least one link out, and fails loudly if not.
- `scripts/check-parts.mjs` already fails when a part id has no mesh; the
  generator additionally fails when a page's id is not in the parts data.
- One check that every breadcrumb ancestor and every sibling link resolves to
  a page that was actually written, including links that point at a part which
  was merged or collapsed away and must redirect to its canonical page. Broken internal links are the failure mode
  that matters most here, and the only one that is invisible by eye across 240 pages.

## Open questions

- Hosting target, which decides whether the sitemap needs an absolute domain
  at build time.
- Whether the site header search should link to the app or be dropped at
  launch. Dropping it is defensible; a dead-end search box is worse than none.
