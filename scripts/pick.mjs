import { chromium } from 'playwright'
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const p = await b.newPage({ viewport: { width: 1100, height: 750 }, deviceScaleFactor: 1 })
await p.goto('http://localhost:5173/', { waitUntil: 'load' })
await p.waitForFunction(() => window.__CAR, null, { timeout: 90000 })
await p.waitForTimeout(9000)
const pts = [[420, 160], [500, 159], [580, 159], [660, 160], [730, 160], [560, 168], [300, 300], [900, 300]]
for (const [x, y] of pts) {
  await p.mouse.move(x, y)
  await p.waitForTimeout(900)
  const t = await p.evaluate(() => {
    const el = [...document.querySelectorAll('div')].find((d) => d.className.includes('fixed') && d.className.includes('z-40') && d.className.includes('bg-white'))
    return el && !el.className.includes('hidden') ? el.textContent : null
  })
  console.log(`(${x},${y}) -> ${t}`)
}
await b.close()
