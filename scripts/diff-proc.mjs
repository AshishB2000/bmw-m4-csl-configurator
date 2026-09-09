// Renders the exterior with and without the procedural parts and reports where the image changes,
// i.e. procedural geometry that is visible from outside the closed bodywork.
import { chromium } from 'playwright'
import { writeFileSync } from 'fs'
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const p = await b.newPage({ viewport: { width: 1100, height: 750 }, deviceScaleFactor: 1 })
await p.goto(process.argv[2] || 'http://localhost:5173/', { waitUntil: 'load' })
await p.waitForFunction(() => window.__registry, null, { timeout: 90000 })
await p.waitForTimeout(9000)
const res = await p.evaluate(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  const cv = document.querySelector('canvas')
  const grab = async () => { await sleep(2500); return cv.toDataURL('image/png') }
  const mech = []
  window.__registry.ensureAll()
  for (const [, objs] of window.__registry.objects) for (const o of objs) {
    let e = o; while (e) { if (e.name === 'mech') { mech.push(o); break } e = e.parent }
  }
  const withProc = await grab()
  const prev = mech.map((o) => o.visible)
  mech.forEach((o) => (o.visible = false))
  const without = await grab()
  mech.forEach((o, i) => (o.visible = prev[i]))
  // diff in a 2D canvas
  const load = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = src })
  const [ia, ib] = await Promise.all([load(withProc), load(without)])
  const c = document.createElement('canvas'); c.width = ia.width; c.height = ia.height
  const g = c.getContext('2d')
  g.drawImage(ia, 0, 0); const A = g.getImageData(0, 0, c.width, c.height).data
  g.clearRect(0, 0, c.width, c.height); g.drawImage(ib, 0, 0); const B = g.getImageData(0, 0, c.width, c.height).data
  const cols = []
  let changed = 0
  const grid = 24, cellsX = Math.ceil(c.width / grid), cellsY = Math.ceil(c.height / grid)
  const cells = new Float64Array(cellsX * cellsY)
  for (let i = 0; i < A.length; i += 4) {
    const d = Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2])
    if (d > 40) { changed++; const px = (i / 4) % c.width, py = Math.floor((i / 4) / c.width); cells[Math.floor(py / grid) * cellsX + Math.floor(px / grid)]++ }
  }
  for (let cy = 0; cy < cellsY; cy++) for (let cx = 0; cx < cellsX; cx++) { const n = cells[cy * cellsX + cx]; if (n > 60) cols.push({ x: cx * grid, y: cy * grid, n }) }
  return { w: c.width, h: c.height, changed, pct: +(100 * changed / (c.width * c.height)).toFixed(2), hotCells: cols.slice(0, 40), withProc, without }
})
writeFileSync('/tmp/claude-501/proc_on.png', Buffer.from(res.withProc.split(',')[1], 'base64'))
writeFileSync('/tmp/claude-501/proc_off.png', Buffer.from(res.without.split(',')[1], 'base64'))
delete res.withProc; delete res.without
console.log(JSON.stringify(res, null, 1))
await b.close()
