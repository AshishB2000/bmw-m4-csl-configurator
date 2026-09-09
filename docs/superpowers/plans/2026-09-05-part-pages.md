# Part Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate 240 static, zero-JavaScript HTML pages, one per deduplicated car part, from the existing `src/data/parts.ts`, published alongside the existing configurator.

**Architecture:** A post-build Node script imports the parts data directly, applies two dedupe rules to pick which parts get pages, and writes `dist/parts/<id>/index.html` by string concatenation. Part pages contain no JavaScript; the "View in 3D" control is a plain anchor to `/?part=<id>`, a URL the existing app already parses in `fromUrl()` at `src/store.ts:123`. The two surfaces share a data file and nothing else.

**Tech Stack:** Node 24 with `--experimental-strip-types` (already the repo's convention, see `scripts/parts-stats.mjs`), `node:test` and `node:assert` from stdlib, Playwright for stills (already a devDependency). **No new dependencies.**

## Global Constraints

- **No new npm dependencies.** Everything uses stdlib or what is already installed.
- **No template engine, no framework, no router.** Template literals only.
- **Part pages emit no executable JavaScript.** The only permitted `<script>` tags are `application/ld+json` data blocks.
- Import parts data from `../src/data/parts.ts`. It is the single source of truth. Never copy content into a second file.
- Run all scripts with `node --experimental-strip-types`, matching `scripts/parts-stats.mjs`.
- Part ids contain dots (`engine.turbo.t1.wastegate`) and are used verbatim as URL path segments and directory names. No slug mapping.
- Escape every interpolated data value with the shared `esc()` helper. The data contains ampersands and quotes.
- `price` of `0` means structural or not sold separately. Never render `$0`.
- `spec` and `material` are sometimes empty strings. Never render an empty table row.
- Sentence case for all UI copy. No exclamation marks.
- Generated output goes to `dist/`, which is gitignored. Never commit generated HTML.

## Resolved open questions

The spec left two questions open. Both are resolved here so no task blocks:

- **Base URL:** read from the `SITE_URL` environment variable, defaulting to `http://localhost:4173` (the `vite preview` port). Absolute URLs are required for `sitemap.xml` and `og:url`. The generator warns when `SITE_URL` is unset so a real deploy cannot silently ship localhost URLs.
- **Header search box:** dropped at launch. Part pages have no JavaScript to search with, and a dead-end search box is worse than none. The header carries the 11 subsystem links only.

## File structure

| File | Responsibility |
| --- | --- |
| `scripts/lib/pages.mjs` | Pure data: which parts get pages, which merge, which collapse. No HTML, no I/O. |
| `scripts/lib/pages.test.mjs` | Tests for the two dedupe rules against real data. |
| `scripts/lib/template.mjs` | Pure functions: part data in, HTML string out. No I/O. |
| `scripts/lib/template.test.mjs` | Tests for escaping, empty-field guards, and required page elements. |
| `scripts/build-pages.mjs` | I/O: walks the page list, writes files, prints counts. |
| `scripts/check-links.mjs` | Verifies every internal link resolves to a written page. |
| `scripts/build-stills.mjs` | Playwright: one screenshot per page. |

Splitting pure logic (`lib/`) from I/O (`build-*.mjs`) is what makes the first two tasks testable without touching the filesystem.

---

### Task 1: Page selection

Decides which of the 372 parts become pages. Pure functions over the parts array, no HTML and no filesystem.

**Files:**
- Create: `scripts/lib/pages.mjs`
- Test: `scripts/lib/pages.test.mjs`

**Interfaces:**
- Consumes: `PARTS`, `BY_ID` from `src/data/parts.ts`.
- Produces:
  - `selectPages(parts)` returns `{ pages, canonicalOf, collapsedUnder, positionsOf }`
  - `pages`: `Part[]`, the parts that get their own page, in data order.
  - `canonicalOf`: `Map<string, string>`, every part id to the id of the page that covers it. A part with its own page maps to itself.
  - `collapsedUnder`: `Map<string, Part[]>`, parent id to the numbered children folded into that parent's page.
  - `positionsOf`: `Map<string, Part[]>`, canonical page id to all parts sharing its text, including itself. Length 1 means no "appears at" section.

- [ ] **Step 1: Write the failing test**

Create `scripts/lib/pages.test.mjs`:

```javascript
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PARTS, BY_ID } from '../../src/data/parts.ts'
import { selectPages } from './pages.mjs'

const { pages, canonicalOf, collapsedUnder, positionsOf } = selectPages(PARTS)
const ids = new Set(pages.map((p) => p.id))

test('produces 240 pages from 372 parts', () => {
  assert.equal(PARTS.length, 372)
  assert.equal(pages.length, 240)
})

test('collapses numbered siblings into their parent', () => {
  for (let i = 1; i <= 6; i++) assert.ok(!ids.has(`engine.injectors.i${i}`), `injector ${i} should have no page`)
  assert.ok(ids.has('engine.injectors'), 'the parent keeps its page')
  const folded = collapsedUnder.get('engine.injectors')
  assert.equal(folded.length, 6)
  assert.equal(folded[0].name, 'Injector 1')
})

test('keeps the two turbos, which are not a numbered set of three or more', () => {
  assert.ok(ids.has('engine.turbo.t1'))
  assert.ok(ids.has('engine.turbo.t2'))
})

test('merges the four wheel corners into one canonical page', () => {
  const corners = ['wheels.fl.hub', 'wheels.fr.hub', 'wheels.rl.hub', 'wheels.rr.hub']
  const canon = corners.map((id) => canonicalOf.get(id))
  assert.equal(new Set(canon).size, 1, 'all four map to one page')
  assert.equal(canon[0], 'wheels.fl.hub', 'shallowest, first in data order, wins')
  assert.equal(positionsOf.get('wheels.fl.hub').length, 4)
  for (const id of corners.slice(1)) assert.ok(!ids.has(id), `${id} should have no page of its own`)
})

test('every part resolves to a page that exists', () => {
  const allCollapsed = new Set([...collapsedUnder.values()].flat().map((c) => c.id))
  for (const p of PARTS) {
    const canon = canonicalOf.get(p.id)
    assert.ok(canon, `${p.id} has no canonical page`)
    assert.ok(ids.has(canon) || allCollapsed.has(p.id), `${p.id} resolves to ${canon}, which is not a page`)
  }
})

test('every page id is a real part', () => {
  for (const p of pages) assert.ok(BY_ID[p.id], `${p.id} is not in the data`)
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
node --test --experimental-strip-types scripts/lib/pages.test.mjs
```

Expected: FAIL with `Cannot find module './pages.mjs'`.

- [ ] **Step 3: Write the implementation**

Create `scripts/lib/pages.mjs`:

```javascript
// Decides which parts get their own page. Pure: no I/O, no HTML.

/** "Injector 3" -> "Injector". Used to spot numbered sibling sets. */
const stem = (name) => name.replace(/\s*\d+\s*$/, '').trim()

/** Two parts are the same page when every prose field matches. */
const textKey = (p) => [p.desc, p.fn, p.material, p.spec, p.maint].join(' ')

export function selectPages(parts) {
  // Rule 1: three or more siblings whose names differ only by a trailing
  // number are one idea, not N pages. They fold into the parent's page.
  const byParent = new Map()
  for (const p of parts) {
    if (!byParent.has(p.parent)) byParent.set(p.parent, [])
    byParent.get(p.parent).push(p)
  }
  const collapsed = new Set()
  const collapsedUnder = new Map()
  for (const [parent, kids] of byParent) {
    const groups = new Map()
    for (const k of kids) {
      const s = stem(k.name)
      if (!groups.has(s)) groups.set(s, [])
      groups.get(s).push(k)
    }
    for (const members of groups.values()) {
      if (members.length < 3) continue
      for (const m of members) collapsed.add(m.id)
      collapsedUnder.set(parent, (collapsedUnder.get(parent) ?? []).concat(members))
    }
  }

  // Rule 2: parts with byte-identical prose share one page. The shallowest
  // id wins; ties break on data order, which is stable and human-ordered.
  const survivors = parts.filter((p) => !collapsed.has(p.id))
  const depth = (id) => id.split('.').length
  const ranked = survivors
    .map((p, i) => ({ p, i }))
    .sort((a, b) => depth(a.p.id) - depth(b.p.id) || a.i - b.i)

  const canonByText = new Map()
  for (const { p } of ranked) {
    const k = textKey(p)
    if (!canonByText.has(k)) canonByText.set(k, p)
  }

  const pages = survivors.filter((p) => canonByText.get(textKey(p)) === p)

  const positionsOf = new Map()
  for (const p of survivors) {
    const canon = canonByText.get(textKey(p))
    if (!positionsOf.has(canon.id)) positionsOf.set(canon.id, [])
    positionsOf.get(canon.id).push(p)
  }

  // Every part, page or not, must resolve somewhere. A collapsed part points
  // at its parent's page; a merged part points at its canonical twin.
  const canonicalOf = new Map()
  for (const p of parts) {
    if (collapsed.has(p.id)) canonicalOf.set(p.id, p.parent)
    else canonicalOf.set(p.id, canonByText.get(textKey(p)).id)
  }

  return { pages, canonicalOf, collapsedUnder, positionsOf }
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
node --test --experimental-strip-types scripts/lib/pages.test.mjs
```

Expected: PASS, 6 tests.

If the count assertion fails, the data file changed since this plan was written. Print the real number, confirm the dedupe groups still look right, then update the assertion and the spec together. Do not loosen the assertion to a range.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/pages.mjs scripts/lib/pages.test.mjs
git commit -m "Add page selection: two dedupe rules over the parts data"
```

---

### Task 2: Page template

Turns one part into one HTML string. Pure: takes data, returns a string, touches no files.

**Files:**
- Create: `scripts/lib/template.mjs`
- Test: `scripts/lib/template.test.mjs`

**Interfaces:**
- Consumes: nothing from Task 1 directly. The generator in Task 3 assembles the context object.
- Produces:
  - `esc(str)` returns an HTML-escaped string.
  - `partPage(ctx)` returns a full HTML document string. `ctx` is `{ part, ancestors, children, collapsed, positions, siblings, siteUrl, hasStill }`.
  - `indexPage(ctx)` returns the `/parts/` subsystem index. `ctx` is `{ subsystems, siteUrl }` where each subsystem is `{ part, count }`.
  - `sitemap(urls, siteUrl)` returns a `sitemap.xml` string. `urls` is an array of path strings such as `/parts/engine/`.

- [ ] **Step 1: Write the failing test**

Create `scripts/lib/template.test.mjs`:

```javascript
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { esc, partPage, indexPage, sitemap } from './template.mjs'

const wastegate = {
  id: 'engine.turbo.t1.wastegate', parent: 'engine.turbo.t1', name: 'Wastegate',
  desc: 'Electrically actuated flap in the turbine housing.',
  fn: 'Bypasses exhaust around the turbine to cap boost.',
  material: 'Stainless flap, electric actuator',
  spec: 'Actuator travel 12 mm | 0 to 100 % in 120 ms'.replace('|', '·'),
  maint: 'Rattle at idle is a worn flap pivot.', price: 380,
}
const base = {
  part: wastegate,
  ancestors: [{ id: 'engine', name: 'S58 engine' }, { id: 'engine.turbo', name: 'Turbochargers' }],
  children: [], collapsed: [], positions: [wastegate], siblings: [],
  siteUrl: 'https://example.test', hasStill: true,
}

test('escapes HTML-significant characters', () => {
  assert.equal(esc('Tom & "Jerry" <b>'), 'Tom &amp; &quot;Jerry&quot; &lt;b&gt;')
})

test('renders the part name, prose fields and price', () => {
  const html = partPage(base)
  assert.match(html, /<h1[^>]*>Wastegate<\/h1>/)
  assert.ok(html.includes('Bypasses exhaust around the turbine'))
  assert.ok(html.includes('Rattle at idle'))
  assert.ok(html.includes('$380'))
})

test('emits no executable JavaScript', () => {
  const html = partPage(base)
  assert.ok(!html.includes('<script>'), 'no bare script tags')
  assert.ok(!html.includes('text/javascript'), 'no javascript blocks')
  assert.ok(!/ on[a-z]+=/.test(html), 'no inline event handlers')
})

test('links to the 3D app with the part deep link', () => {
  assert.ok(partPage(base).includes('href="/?part=engine.turbo.t1.wastegate"'))
})

test('splits the spec string into one row per separated value', () => {
  const html = partPage(base)
  assert.ok(html.includes('Actuator travel 12 mm'))
  assert.ok(html.includes('0 to 100 % in 120 ms'))
})

test('omits the price when it is zero', () => {
  const html = partPage({ ...base, part: { ...wastegate, price: 0 } })
  assert.ok(!html.includes('$0'), 'zero price means structural, not free')
})

test('omits empty spec and material rows', () => {
  const html = partPage({ ...base, part: { ...wastegate, spec: '', material: '' } })
  assert.ok(!html.includes('<td></td>'), 'no empty table cells')
  assert.ok(!html.includes('Material'), 'the row disappears entirely')
})

test('renders an appears-at list only when the part has several positions', () => {
  assert.ok(!partPage(base).includes('Appears at'))
  const many = partPage({ ...base, positions: [wastegate, { ...wastegate, id: 'x', name: 'Rear wastegate' }] })
  assert.ok(many.includes('Appears at'))
  assert.ok(many.includes('Rear wastegate'))
})

test('renders collapsed children as plain text, not links', () => {
  const html = partPage({ ...base, collapsed: [{ id: 'a.i1', name: 'Injector 1' }, { id: 'a.i2', name: 'Injector 2' }] })
  assert.ok(html.includes('Injector 1'))
  assert.ok(!html.includes('href="/parts/a.i1/"'), 'collapsed parts have no page to link to')
})

test('breadcrumb links every ancestor', () => {
  const html = partPage(base)
  assert.ok(html.includes('href="/parts/engine/"'))
  assert.ok(html.includes('href="/parts/engine.turbo/"'))
})

test('sets canonical and og:url from the site url', () => {
  const html = partPage(base)
  assert.ok(html.includes('<link rel="canonical" href="https://example.test/parts/engine.turbo.t1.wastegate/">'))
  assert.ok(html.includes('property="og:url" content="https://example.test/parts/engine.turbo.t1.wastegate/"'))
})

test('omits og:image when no still was rendered', () => {
  assert.ok(!partPage({ ...base, hasStill: false }).includes('og:image'))
})

test('index page lists every subsystem with its count', () => {
  const html = indexPage({ subsystems: [{ part: { id: 'engine', name: 'S58 engine' }, count: 90 }], siteUrl: 'https://example.test' })
  assert.ok(html.includes('href="/parts/engine/"'))
  assert.ok(html.includes('90'))
})

test('sitemap emits absolute urls', () => {
  const xml = sitemap(['/parts/engine/'], 'https://example.test')
  assert.ok(xml.includes('<loc>https://example.test/parts/engine/</loc>'))
  assert.ok(xml.startsWith('<?xml'))
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
node --test --experimental-strip-types scripts/lib/template.test.mjs
```

Expected: FAIL with `Cannot find module './template.mjs'`.

- [ ] **Step 3: Write the implementation**

Create `scripts/lib/template.mjs`. The `SEP` constant is the middle-dot character the parts data uses to separate spec values:

```javascript
// Data in, HTML string out. Pure: no I/O.

export const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const SEP = '·'
const href = (id) => `/parts/${id}/`
const money = (n) => `$${n.toLocaleString('en-US')}`

const CSS = `
:root{color-scheme:light dark;--fg:#111;--dim:#666;--line:#e2e2e2;--bg:#fff;--card:#fafafa}
@media(prefers-color-scheme:dark){:root{--fg:#eee;--dim:#999;--line:#2a2a2a;--bg:#0d0d0f;--card:#151517}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.6 system-ui,-apple-system,sans-serif}
a{color:inherit}
.wrap{max-width:900px;margin:0 auto;padding:0 20px}
header{border-bottom:1px solid var(--line);padding:14px 0;margin-bottom:24px}
header nav{display:flex;flex-wrap:wrap;gap:14px;font-size:14px;color:var(--dim);margin-top:6px}
h1{font-size:32px;margin:0 0 4px}
h2{font-size:14px;color:var(--dim);margin:22px 0 4px;font-weight:600}
.crumb{font-size:14px;color:var(--dim);margin-bottom:18px}
.cols{display:grid;grid-template-columns:1fr;gap:28px}
@media(min-width:760px){.cols{grid-template-columns:1.15fr 1fr}}
table{width:100%;border-collapse:collapse;font-size:14px;margin-top:18px}
td{padding:7px 0;border-top:1px solid var(--line)}
td:last-child{text-align:right}
.still{width:100%;border-radius:10px;border:1px solid var(--line);display:block}
.cta{display:inline-block;margin-top:10px;padding:9px 16px;border:1px solid var(--line);border-radius:8px;text-decoration:none;background:var(--card)}
.chips{display:flex;flex-wrap:wrap;gap:6px;font-size:14px;margin-top:6px}
.chips a,.chips span{border:1px solid var(--line);border-radius:7px;padding:3px 10px;text-decoration:none}
.sponsor{margin-top:14px;border:1px dashed var(--line);border-radius:8px;padding:10px 12px;font-size:13px;color:var(--dim)}
footer{border-top:1px solid var(--line);margin-top:44px;padding:18px 0;font-size:13px;color:var(--dim)}
`

const SUBSYSTEM_NAV = [
  ['engine', 'Engine'], ['drivetrain', 'Drivetrain'], ['wheels', 'Wheels'],
  ['suspension', 'Suspension'], ['cooling', 'Cooling'], ['fuel', 'Fuel'],
  ['exhaust', 'Exhaust'], ['electrical', 'Electrical'], ['body', 'Body'],
  ['interior', 'Interior'], ['chassis', 'Chassis'],
]

const shell = ({ title, description, canonical, head = '', body }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
${head}
<style>${CSS}</style>
</head>
<body>
<div class="wrap">
<header>
<strong><a href="/parts/" style="text-decoration:none">How a car works</a></strong>
<nav>${SUBSYSTEM_NAV.map(([id, label]) => `<a href="${href(id)}">${esc(label)}</a>`).join('')}</nav>
</header>
${body}
<footer>Shown on a BMW M4 CSL. Model by Black Snow, CC BY 4.0. <a href="/">Open the 3D explorer</a></footer>
</div>
</body>
</html>`

/** One row per separated segment, skipping blanks. */
const specRows = (label, value) =>
  String(value || '').split(SEP).map((s) => s.trim()).filter(Boolean)
    .map((v, i) => `<tr><td>${i === 0 ? esc(label) : ''}</td><td>${esc(v)}</td></tr>`).join('')

export function partPage({ part, ancestors, children, collapsed, positions, siblings, siteUrl, hasStill }) {
  const canonical = `${siteUrl}${href(part.id)}`
  const still = `${href(part.id)}still.jpg`
  const crumb = ['<a href="/parts/">All parts</a>']
    .concat(ancestors.map((a) => `<a href="${href(a.id)}">${esc(a.name)}</a>`))
    .join(' &rsaquo; ') + ` &rsaquo; ${esc(part.name)}`

  const jsonld = {
    '@context': 'https://schema.org', '@type': 'TechArticle',
    headline: part.name, description: part.desc, articleBody: `${part.desc} ${part.fn}`, url: canonical,
  }
  const crumbLd = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: ancestors.concat([part]).map((a, i) => ({
      '@type': 'ListItem', position: i + 1, name: a.name, item: `${siteUrl}${href(a.id)}`,
    })),
  }

  const rows = specRows('Material', part.material) + specRows('Spec', part.spec)
  const parent = ancestors[ancestors.length - 1]

  const body = `
<p class="crumb">${crumb}</p>
<div class="cols">
<div>
<h1>${esc(part.name)}</h1>
<p style="color:var(--dim);margin:0">${parent ? `Part of ${esc(parent.name)}` : 'The whole car'}${part.price > 0 ? ` &middot; about ${money(part.price)} to replace` : ''}</p>
<h2>What it is</h2><p>${esc(part.desc)}</p>
<h2>What it does</h2><p>${esc(part.fn)}</p>
${part.maint ? `<h2>How it fails</h2><p>${esc(part.maint)}</p>` : ''}
${rows ? `<table>${rows}</table>` : ''}
</div>
<div>
${hasStill ? `<img class="still" src="${still}" alt="${esc(part.name)} highlighted on the car" loading="lazy" width="800" height="600">` : ''}
<a class="cta" href="/?part=${esc(part.id)}">View in 3D</a>
<div class="sponsor" data-sponsor-slot="${esc(part.id.split('.')[0])}"></div>
${positions.length > 1 ? `<h2>Appears at</h2><div class="chips">${positions.map((p) => `<span>${esc(p.name)}</span>`).join('')}</div>` : ''}
${children.length ? `<h2>Inside this part</h2><div class="chips">${children.map((c) => `<a href="${href(c.id)}">${esc(c.name)}</a>`).join('')}</div>` : ''}
${collapsed.length ? `<h2>Individual units</h2><div class="chips">${collapsed.map((c) => `<span>${esc(c.name)}</span>`).join('')}</div>` : ''}
${siblings.length ? `<h2>Nearby</h2><div class="chips">${siblings.map((s) => `<a href="${href(s.id)}">${esc(s.name)}</a>`).join('')}</div>` : ''}
</div>
</div>`

  return shell({
    title: `${part.name} - what it is and what it does`,
    description: part.desc.slice(0, 155),
    canonical,
    head: `${hasStill ? `<meta property="og:image" content="${esc(siteUrl + still)}">\n` : ''}<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
<script type="application/ld+json">${JSON.stringify(crumbLd)}</script>`,
    body,
  })
}

export function indexPage({ subsystems, siteUrl }) {
  const body = `
<h1>How a car works</h1>
<p style="color:var(--dim)">Every part of a BMW M4 CSL, what it does, and how it fails. Pick a system to start.</p>
<table>${subsystems.map(({ part, count }) =>
    `<tr><td><a href="${href(part.id)}">${esc(part.name)}</a></td><td>${count} parts</td></tr>`).join('')}</table>`
  return shell({
    title: 'How a car works - every part of a BMW M4 CSL',
    description: 'An explorable reference for every part of a car: what it is, what it does, how it fails, and what it costs.',
    canonical: `${siteUrl}/parts/`,
    body,
  })
}

export const sitemap = (urls, siteUrl) =>
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map((u) => `<url><loc>${esc(siteUrl + u)}</loc></url>`).join('\n') +
  '\n</urlset>\n'
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
node --test --experimental-strip-types scripts/lib/template.test.mjs
```

Expected: PASS, 14 tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/template.mjs scripts/lib/template.test.mjs
git commit -m "Add part page HTML template with escaping and empty-field guards"
```

---

### Task 3: The generator

Wires Task 1 and Task 2 to the filesystem: writes every page, the index, and the sitemap.

**Files:**
- Create: `scripts/build-pages.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: `selectPages` from Task 1; `partPage`, `indexPage`, `sitemap` from Task 2; `PARTS`, `BY_ID`, `CHILDREN`, `pathOf`, `SUBSYSTEMS`, `descendants` from `src/data/parts.ts`.
- Produces: `dist/parts/<id>/index.html` for each of the 240 pages, `dist/parts/index.html`, `dist/sitemap.xml`. Exits non-zero on any validation failure.

- [ ] **Step 1: Write the generator**

Create `scripts/build-pages.mjs`:

```javascript
// node --experimental-strip-types scripts/build-pages.mjs
// Writes static part pages into dist/. Run after `vite build`.
import { mkdir, writeFile, access } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PARTS, BY_ID, CHILDREN, pathOf, SUBSYSTEMS, descendants } from '../src/data/parts.ts'
import { selectPages } from './lib/pages.mjs'
import { partPage, indexPage, sitemap } from './lib/template.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')

const siteUrl = (process.env.SITE_URL ?? 'http://localhost:4173').replace(/\/$/, '')
if (!process.env.SITE_URL) console.warn('! SITE_URL is unset, canonical and sitemap URLs will point at localhost')

const { pages, canonicalOf, collapsedUnder, positionsOf } = selectPages(PARTS)
const pageIds = new Set(pages.map((p) => p.id))
const exists = (p) => access(p).then(() => true, () => false)

const problems = []
const urls = ['/parts/']

for (const part of pages) {
  // Ancestors go through canonicalOf too: an ancestor that merged into another
  // page must link to that page, and one that has no page at all is dropped
  // rather than linked into the void.
  const ancestors = pathOf(part.id).slice(0, -1)
    .map((a) => BY_ID[canonicalOf.get(a.id)] ?? a)
    .filter((a) => pageIds.has(a.id) && a.id !== part.id)
    .filter((a, i, arr) => arr.findIndex((x) => x.id === a.id) === i)
  const collapsed = collapsedUnder.get(part.id) ?? []
  const children = (CHILDREN[part.id] ?? [])
    .map((c) => canonicalOf.get(c.id))
    .filter((id) => pageIds.has(id) && id !== part.id)
    .filter((id, i, a) => a.indexOf(id) === i)
    .map((id) => BY_ID[id])
  const siblings = (CHILDREN[part.parent] ?? [])
    .filter((s) => s.id !== part.id && pageIds.has(s.id))
    .slice(0, 8)
  const positions = positionsOf.get(part.id) ?? [part]

  if (!part.desc || !part.fn) problems.push(`${part.id}: missing desc or fn`)

  const dir = join(dist, 'parts', part.id)
  await mkdir(dir, { recursive: true })
  const hasStill = await exists(join(dir, 'still.jpg'))
  await writeFile(join(dir, 'index.html'), partPage({
    part, ancestors, children, collapsed, positions, siblings, siteUrl, hasStill,
  }))
  urls.push(`/parts/${part.id}/`)
}

const subsystems = SUBSYSTEMS.map((id) => ({ part: BY_ID[id], count: descendants(id).length + 1 }))
await writeFile(join(dist, 'parts', 'index.html'), indexPage({ subsystems, siteUrl }))
await writeFile(join(dist, 'sitemap.xml'), sitemap(urls, siteUrl))

console.log(JSON.stringify({ parts: PARTS.length, pages: pages.length, urls: urls.length, siteUrl, problems }, null, 1))
if (problems.length) process.exit(1)
```

Note the children list maps through `canonicalOf` before filtering. A child that was merged into a different canonical page must link to that page, not vanish, and duplicates are removed so four merged corners produce one link.

- [ ] **Step 2: Add the npm scripts**

In `package.json`, replace the `"build"` line and add two more alongside it:

```json
"build": "tsc -b && vite build && npm run build:pages",
"build:pages": "node --experimental-strip-types scripts/build-pages.mjs",
"test": "node --test --experimental-strip-types scripts/lib/",
```

- [ ] **Step 3: Run the generator and inspect one page**

```bash
npm run build && head -40 dist/parts/engine.turbo.t1.wastegate/index.html
```

Expected: the JSON summary reports `"pages": 240` and `"problems": []`, and the wastegate page contains its heading, its prose, and `href="/?part=engine.turbo.t1.wastegate"`.

- [ ] **Step 4: Confirm the page count on disk**

```bash
find dist/parts -name index.html | wc -l
```

Expected: `241`, the 240 part pages plus the index.

- [ ] **Step 5: Commit**

```bash
git add scripts/build-pages.mjs package.json
git commit -m "Generate static part pages, subsystem index and sitemap into dist"
```

---

### Task 4: Link integrity

Across 240 pages a broken internal link is invisible by eye, and internal linking is the only thing making people read a second page. This checks every link resolves.

**Files:**
- Create: `scripts/check-links.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: the `dist/` tree written by Task 3.
- Produces: exit 0 when every internal href resolves to a file on disk; a list of offenders and exit 1 otherwise.

- [ ] **Step 1: Write the checker**

Create `scripts/check-links.mjs`:

```javascript
// node scripts/check-links.mjs - every internal link in dist/ must resolve.
import { readFile, readdir, access } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')

async function* htmlFiles(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) yield* htmlFiles(p)
    else if (e.name.endsWith('.html')) yield p
  }
}

const broken = []
let links = 0
for await (const file of htmlFiles(join(dist, 'parts'))) {
  const html = await readFile(file, 'utf8')
  for (const m of html.matchAll(/href="(\/[^"#]*)"/g)) {
    const url = m[1]
    // "/?part=..." is the 3D app itself, served by dist/index.html
    const rel = url.startsWith('/?') ? 'index.html'
      : url.replace(/^\//, '') + (url.endsWith('/') ? 'index.html' : '')
    links++
    if (!(await access(join(dist, rel)).then(() => true, () => false))) {
      broken.push(`${file.replace(dist, '')} -> ${url}`)
    }
  }
}

console.log(JSON.stringify({ links, broken: broken.length, examples: broken.slice(0, 10) }, null, 1))
if (broken.length) process.exit(1)
```

- [ ] **Step 2: Add the npm script**

In `package.json`:

```json
"check:links": "node scripts/check-links.mjs",
```

- [ ] **Step 3: Run it against the built site**

```bash
npm run build && npm run check:links
```

Expected: `"broken": 0`, with `links` in the thousands.

- [ ] **Step 4: Prove the checker actually catches a break**

Delete one page, re-run, confirm it fails, then rebuild:

```bash
rm dist/parts/engine.turbo/index.html && npm run check:links; echo "exit=$?"; npm run build:pages
```

Expected: the check exits 1 and names `engine.turbo` among the examples, then the rebuild restores the page. A checker that never fails is not a checker.

- [ ] **Step 5: Commit**

```bash
git add scripts/check-links.mjs package.json
git commit -m "Add internal link integrity check across generated pages"
```

---

### Task 5: Still images and documentation

One rendered image per page, plus the README section describing the whole thing.

**Files:**
- Create: `scripts/build-stills.mjs`
- Modify: `README.md`, `package.json`

**Interfaces:**
- Consumes: `selectPages` from Task 1; a running preview server; Playwright's `chromium`.
- Produces: `dist/parts/<id>/still.jpg` per page. Task 3 detects these and emits `og:image` and the image tag only when present, so this can run before or after the generator and the site works either way.

- [ ] **Step 1: Write the still renderer**

Create `scripts/build-stills.mjs`. It reuses the launch flags and the `window.__CAR` readiness signal already used by `scripts/shot.mjs`:

```javascript
// node --experimental-strip-types scripts/build-stills.mjs [baseUrl]
// One still per part page. Needs a running server and PLAYWRIGHT_BROWSERS_PATH.
import { mkdir, access } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { PARTS } from '../src/data/parts.ts'
import { selectPages } from './lib/pages.mjs'

const base = (process.argv[2] ?? 'http://localhost:4173').replace(/\/$/, '')
const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const { pages } = selectPages(PARTS)

const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'],
})
const page = await browser.newPage({ viewport: { width: 1000, height: 750 }, deviceScaleFactor: 1 })

let done = 0, skipped = 0
const failed = []
for (const part of pages) {
  const dir = join(dist, 'parts', part.id)
  await mkdir(dir, { recursive: true })
  const out = join(dir, 'still.jpg')
  if (await access(out).then(() => true, () => false)) { skipped++; continue }
  try {
    await page.goto(`${base}/?part=${part.id}`, { waitUntil: 'load' })
    await page.waitForFunction(() => window.__CAR || window.__ERR, null, { timeout: 60000 })
    await page.keyboard.press('p')     // photo mode hides the UI chrome
    await page.waitForTimeout(2500)    // let the camera finish its flight
    await page.screenshot({ path: out, type: 'jpeg', quality: 82 })
    await page.keyboard.press('p')
    done++
  } catch (e) {
    failed.push(`${part.id}: ${String(e).slice(0, 120)}`)
  }
  if ((done + skipped) % 25 === 0) console.log(`  ${done + skipped}/${pages.length}`)
}
await browser.close()
console.log(JSON.stringify({ total: pages.length, done, skipped, failed: failed.length, examples: failed.slice(0, 5) }, null, 1))
```

It skips ids that already have a still, so an interrupted run resumes and a content edit does not re-render 240 images. It never exits non-zero: a missing still degrades to a page without a picture, which Task 3 already handles, and that is not worth failing a build over.

- [ ] **Step 2: Add the npm script**

In `package.json`:

```json
"build:stills": "node --experimental-strip-types scripts/build-stills.mjs",
```

- [ ] **Step 3: Render the stills and check one by eye**

Start the preview server, render, then regenerate the pages so they pick up the new images:

```bash
npm run build && npx vite preview --port 4173 &
sleep 3 && npm run build:stills && npm run build:pages
```

Expected: the summary shows `done` climbing with `failed: 0`. Open `dist/parts/engine.turbo/still.jpg` and confirm the turbo is highlighted with the rest of the car ghosted, and that no bottom bar or side panel is visible. If UI chrome is present, photo mode did not engage. The key is handled at `src/App.tsx:42`, where `p` toggles `hideUi`; confirm that is still true before changing anything else.

- [ ] **Step 4: Document it in the README**

Add this section to `README.md` immediately after the `## Verification` section and before `## Deep links`. It documents build commands, so it belongs with the other verification material:

```markdown
## Part pages

`npm run build` emits the app to `dist/` and then writes a static, zero-JavaScript
page per part to `dist/parts/<id>/index.html`. 372 parts collapse to 240 pages:
numbered sibling sets (Injector 1 to Injector 6) fold into their parent, and parts
whose text is identical across positions (the four wheel corners, the six pistons'
internals) share one page that lists where it appears. Each page carries the part's
description, function, failure note, spec and price, links to its ancestors,
children and siblings, and a "View in 3D" link to `/?part=<id>`, which the app
already resolves.

Set `SITE_URL` for real deploys or canonical and sitemap URLs point at localhost.
```

Follow it with this block:

```bash
SITE_URL=https://your-domain npm run build   # pages + sitemap with absolute URLs
npm run check:links                          # every internal link must resolve
npm run build:stills                         # one render per page; needs a running preview server
npm test                                     # dedupe rules and template
```

- [ ] **Step 5: Commit**

```bash
git add scripts/build-stills.mjs README.md package.json
git commit -m "Render one still per part page and document the pages build"
```

---

## Definition of done

- [ ] `npm test` passes, 20 tests across the two lib files.
- [ ] `npm run build` reports `"pages": 240` and `"problems": []`.
- [ ] `npm run check:links` reports `"broken": 0`.
- [ ] `dist/parts/engine.turbo.t1.wastegate/index.html` renders correctly in a browser with JavaScript disabled.
- [ ] That page contains no executable script tag, only `application/ld+json` blocks.
- [ ] Clicking "View in 3D" on it loads the configurator with the wastegate selected.
- [ ] `dist/sitemap.xml` lists 241 URLs.
