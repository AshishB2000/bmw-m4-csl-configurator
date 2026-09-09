// Fails if any part id in src/data/parts.ts has no mesh in the scene. Needs the dev server + headless Chromium.
import { chromium } from 'playwright'
const url = process.argv[2] || 'http://localhost:5173/'
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e).slice(0, 300)))
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 300)) })
await page.goto(url, { waitUntil: 'load' })
await page.waitForFunction(() => window.__registry, null, { timeout: 90000 })
const r = await page.evaluate(() => {
  const reg = window.__registry
  const missing = reg.missing()
  let meshes = 0; window.__registry && document.querySelector('canvas')
  const counts = {}
  for (const [id, objs] of reg.objects) { const sub = id.split('.')[0]; counts[sub] = (counts[sub] || 0) + 1; objs.forEach((o) => o.traverse((m) => { if (m.isMesh) meshes++ })) }
  return { missing, meshes, counts, built: [...reg.built] }
})
await browser.close()
console.log(JSON.stringify({ ...r, errors }, null, 1))
if (r.missing.length || errors.length) { console.error(`FAIL: ${r.missing.length} parts without meshes, ${errors.length} console errors`); process.exit(1) }
console.log('OK: every part resolves to a mesh')
