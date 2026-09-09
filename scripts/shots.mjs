// node scripts/shots.mjs <tag> — screenshots at 1920/1440/mobile, plus deep-breadcrumb and configure states
import { chromium } from 'playwright'
const tag = process.argv[2] || 'x'
const base = process.argv[3] || 'http://localhost:5173/'
const out = process.argv[4] || '/tmp/claude-501'
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const errors = []
const shots = [
  ['1920', { width: 1920, height: 1080 }, ''],
  ['1440', { width: 1440, height: 900 }, ''],
  ['mobile', { width: 390, height: 844 }, ''],
  ['deep', { width: 1600, height: 950 }, '?part=engine.turbo.t1.wastegate'],
]
for (const [name, viewport, q] of shots) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 })
  page.on('pageerror', (e) => errors.push(`${name}: ${String(e).slice(0, 200)}`))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`${name}: ${m.text().slice(0, 200)}`) })
  await page.goto(base + q, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__CAR, null, { timeout: 90000 }).catch(() => errors.push(`${name}: no __CAR`))
  await page.waitForTimeout(name === '1920' ? 14000 : 9000)
  await page.screenshot({ path: `${out}/${tag}_${name}.png`, timeout: 0, animations: 'disabled' })
  await page.close()
}
await browser.close()
console.log(JSON.stringify({ tag, errors }, null, 1))
