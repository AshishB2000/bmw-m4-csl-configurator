// Headless screenshot helper: node scripts/shot.mjs "<url>" out.png [wait-ms]
import { chromium } from 'playwright'
const [url = 'http://localhost:5173/', out = 'shot.png', wait = '4000'] = process.argv.slice(2)
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] })
const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 1 })
const errors = []
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text().slice(0, 300)}`) })
page.on('pageerror', (e) => errors.push('[pageerror] ' + String(e).slice(0, 300)))
await page.goto(url, { waitUntil: 'load' })
await page.waitForFunction(() => window.__CAR || window.__ERR, null, { timeout: 60000 }).catch(() => errors.push('[timeout] __CAR never set'))
await page.waitForTimeout(Number(wait))
const info = await page.evaluate(() => ({ car: window.__CAR, err: window.__ERR, step: window.__STEP }))
await page.screenshot({ path: out, timeout: 180000 })
console.log(JSON.stringify({ out, errors, ...info }, null, 1).slice(0, 4000))
await browser.close()
