import { chromium } from 'playwright'
const [q, out, w = '1100', h = '750'] = process.argv.slice(2)
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 })
const errs = []
p.on('pageerror', (e) => errs.push(String(e).slice(0, 120)))
await p.goto('http://localhost:5173/' + q, { waitUntil: 'load' })
await p.waitForFunction(() => window.__CAR, null, { timeout: 90000 })
await p.waitForTimeout(11000)
await p.screenshot({ path: out, timeout: 0 })
console.log(out, 'errors', errs)
await b.close()
