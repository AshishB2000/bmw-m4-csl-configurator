// node scripts/ui-check.mjs — asserts overlay layout (nothing covered, nothing overlapping) and that every
// overlay control still fires, at 1920 / 1440 / mobile. Clicks are dispatched in-page: under SwiftShader the
// renderer starves rAF, which stalls Playwright's animation-stability wait, so hit-testing is asserted
// explicitly with elementFromPoint instead (a stronger layout guarantee than a synthetic click).
import { chromium } from 'playwright'
const base = process.argv[2] || 'http://localhost:5173/'
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const fails = [], ok = []
const check = (cond, msg) => { console.log((cond ? 'PASS ' : 'FAIL ') + msg); (cond ? ok : fails).push(msg) }

const PAGE_FNS = () => {
  window.__find = (sel, text) => {
    const els = [...document.querySelectorAll(sel)]
    if (text == null) return els[0]
    const t = (e) => e.textContent.trim()
    return els.find((e) => t(e) === text) || els.find((e) => t(e).endsWith(text))
  }
  // click through the real hit-test: fails if anything covers the control
  window.__hitClick = (sel, text) => {
    const el = window.__find(sel, text)
    if (!el) return { found: false }
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) return { found: true, visible: false }
    const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)
    const hit = !!top && (top === el || el.contains(top) || top.contains(el))
    if (hit) el.click()
    return { found: true, visible: true, hit, covering: hit ? null : `${top?.tagName}.${(top?.className || '').toString().slice(0, 40)}` }
  }
  window.__boxes = () => {
    const out = {}
    for (const el of document.querySelectorAll('[data-box]')) {
      const r = el.getBoundingClientRect()
      if (r.width > 0 && r.height > 0) out[el.getAttribute('data-ui')] = { x: r.x, y: r.y, w: r.width, h: r.height }
    }
    return out
  }
}
const overlaps = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
function assertLayout(r, label) {
  const keys = Object.keys(r)
  let bad = 0
  for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) {
    if (overlaps(r[keys[i]], r[keys[j]])) { check(false, `${label}: ${keys[i]} overlaps ${keys[j]}`); bad++ }
  }
  if (!bad) check(true, `${label}: ${keys.length} panels (${keys.join(', ')}), no overlaps`)
}
const hit = async (page, sel, text, msg) => {
  const r = await page.evaluate(([s, t]) => window.__hitClick(s, t), [sel, text])
  check(r.found && r.visible && r.hit, `${msg}${r.found ? (r.visible ? (r.hit ? '' : ` — covered by ${r.covering}`) : ' — zero size') : ' — not found'}`)
  return r
}

const ONLY = process.argv[3]
for (const [name, viewport] of [['1920', { width: 1920, height: 1080 }], ['1440', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]].filter(([n]) => !ONLY || n === ONLY)) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 })
  page.on('pageerror', (e) => check(false, `${name} pageerror: ${String(e).slice(0, 140)}`))
  page.on('console', (m) => { if (m.type() === 'error') check(false, `${name} console: ${m.text().slice(0, 140)}`) })
  await page.addInitScript(PAGE_FNS)
  await page.goto(base, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__CAR, null, { timeout: 90000 })
  await page.waitForTimeout(6000)

  assertLayout(await page.evaluate(() => window.__boxes()), `${name} idle`)

  // view modes
  for (const label of ['Interior', 'Engine', 'Chassis', 'X-ray', 'Exterior']) {
    await hit(page, '[data-ui="modes"] button', label, `${name} mode ${label} clickable`)
    await page.waitForTimeout(400)
    const on = await page.evaluate((l) => window.__find('[data-ui="modes"] button', l)?.classList.contains('seg-on'), label)
    check(on, `${name} mode ${label} becomes active`)
  }

  // camera presets
  if (name === 'mobile') {
    await hit(page, '[data-ui="presets-btn"]', null, `${name} presets button clickable`)
    await page.waitForTimeout(400)
    await hit(page, '[data-ui="presets-sheet"] button', 'Side', `${name} preset Side in sheet clickable`)
  } else {
    await hit(page, '[data-ui="presets"] button', 'Side', `${name} preset Side clickable`)
  }
  await page.waitForTimeout(2000)
  const presetOn = await page.evaluate(() => !!window.__find('[data-ui="presets"] button', 'Side')?.className.includes('bg-white/15'))
  if (name !== 'mobile') check(presetOn, `${name} preset Side becomes active`)

  // search
  await page.evaluate(() => { const i = document.querySelector('[data-ui="search"] input'); const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; set.call(i, 'caliper'); i.dispatchEvent(new Event('input', { bubbles: true })) })
  await page.waitForTimeout(500)
  const hits = await page.evaluate(() => document.querySelectorAll('[data-ui="search"] li').length)
  check(hits > 0, `${name} search returns ${hits} hits`)
  await page.evaluate(() => document.querySelector('[data-ui="search"] li button')?.click())
  await page.waitForTimeout(2200)
  const title = await page.evaluate(() => document.querySelector('[data-ui="detail"] h2')?.textContent)
  check(!!title && /caliper/i.test(title), `${name} search opens detail panel (${title})`)
  assertLayout(await page.evaluate(() => window.__boxes()), `${name} detail open`)

  // drill down / back from the rail
  await page.evaluate(() => document.querySelector('[data-ui="crumbs"] button')?.click())
  await page.waitForTimeout(700)
  await hit(page, '[data-ui="cards"] button', null, `${name} first part card clickable`)
  await page.waitForTimeout(1600)
  check(!!(await page.evaluate(() => document.querySelector('[data-ui="detail"] h2')?.textContent)), `${name} card click opens detail`)
  await page.evaluate(() => { const c = document.querySelector('[data-ui="cards"] button'); c.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })) })
  await page.waitForTimeout(1600)
  const d1 = await page.evaluate(() => document.querySelectorAll('[data-ui="crumbs"] button').length)
  check(d1 > 1, `${name} drill-in deepens breadcrumb to ${d1}`)
  await hit(page, '[data-ui="back"]', null, `${name} back button clickable`)
  await page.waitForTimeout(1200)
  const d2 = await page.evaluate(() => document.querySelectorAll('[data-ui="crumbs"] button').length)
  check(d2 < d1, `${name} back returns to depth ${d2}`)

  // configure panel
  await hit(page, '[data-ui="configure"]', null, `${name} configure clickable`)
  await page.waitForTimeout(700)
  check(await page.evaluate(() => !!document.querySelector('[data-ui="panel"]')), `${name} configure opens`)
  assertLayout(await page.evaluate(() => window.__boxes()), `${name} configure open`)
  await hit(page, '[data-ui="configure"]', null, `${name} configure close clickable`)
  await page.waitForTimeout(400)
  check(await page.evaluate(() => !document.querySelector('[data-ui="panel"]')), `${name} configure closes`)

  await page.close()
}
await browser.close()
console.log(`\n${ok.length} passed, ${fails.length} failed`)
if (fails.length) process.exit(1)
