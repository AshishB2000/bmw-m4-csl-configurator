// Flags procedural parts whose bounding box escapes the car body shell (or is suspiciously large).
import { chromium } from 'playwright'
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const p = await b.newPage({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 1 })
await p.goto(process.argv[2] || 'http://localhost:5173/', { waitUntil: 'load' })
await p.waitForFunction(() => window.__registry, null, { timeout: 90000 })
const r = await p.evaluate(() => {
  const reg = window.__registry
  reg.ensureAll()
  const bb = (id) => { const x = reg.box(id); return { min: [x.min.x, x.min.y, x.min.z], max: [x.max.x, x.max.y, x.max.z] } }
  const round = (a) => a.map((v) => +v.toFixed(2))
  const shell = bb('body')
  const out = { shell: { min: round(shell.min), max: round(shell.max) }, roof: { ...bb('body.roof') }, offenders: [] }
  out.roof = { min: round(out.roof.min), max: round(out.roof.max) }
  const pad = 0.03
  const hasKids = new Set([...reg.objects.keys()].map((k) => k.slice(0, k.lastIndexOf('.'))).filter(Boolean))
  for (const [id, objs] of reg.objects) {
    if (!objs.length || hasKids.has(id)) continue // aggregate parents union their children; only leaves are meaningful
    // only parts built procedurally (their objects live under the 'mech' group)
    const proc = objs.some((o) => { let e = o; while (e) { if (e.name === 'mech') return true; e = e.parent } return false })
    if (!proc) continue
    const x = bb(id)
    const esc = []
    if (x.max[1] > shell.max[1] + pad) esc.push(`above roof by ${(x.max[1] - shell.max[1]).toFixed(2)}`)
    if (x.min[1] < shell.min[1] - pad) esc.push(`below floor by ${(shell.min[1] - x.min[1]).toFixed(2)}`)
    if (x.max[0] > shell.max[0] + pad) esc.push(`past nose by ${(x.max[0] - shell.max[0]).toFixed(2)}`)
    if (x.min[0] < shell.min[0] - pad) esc.push(`past tail by ${(shell.min[0] - x.min[0]).toFixed(2)}`)
    if (x.max[2] > shell.max[2] + pad || x.min[2] < shell.min[2] - pad) esc.push('past side')
    // anything reaching greenhouse height must stay within the roof footprint, or it floats outside the cabin
    if (x.max[1] > 1.18 && (Math.max(Math.abs(x.min[2]), Math.abs(x.max[2])) > 0.52 || x.max[0] > 0.35 || x.min[0] < -1.20)) esc.push('outside greenhouse')
    if (esc.length) out.offenders.push({ id, box: [round(x.min), round(x.max)], esc })
  }
  out.high = []
  for (const [id] of reg.objects) { const x = bb(id); if (x.max[1] > 1.30) out.high.push({ id, y: [+x.min[1].toFixed(2), +x.max[1].toFixed(2)], x: [+x.min[0].toFixed(2), +x.max[0].toFixed(2)], z: [+x.min[2].toFixed(2), +x.max[2].toFixed(2)] }) }
  out.high.sort((a, b) => b.y[1] - a.y[1])
  out.probe = {}
  for (const id of ['body.roof','body.hood','body.grille','body.badges','interior','interior.wheel','interior.wheel.rim','interior.wheel.airbag','interior.wheel.buttons','interior.wheel.paddles','interior.headliner','interior.carpet','interior.mirror','interior.dash','interior.dash.cluster','interior.seats.left','chassis.crumple.front','cooling.radiator','cooling.oilcooler','electrical.horn','electrical.sensors.radar','electrical.sensors.parking','body.wipers.blades','body.pillars'])
    { try { const x = bb(id); out.probe[id] = [round(x.min), round(x.max)] } catch (e) { out.probe[id] = 'ERR' } }
  return out
})
console.log(JSON.stringify(r, null, 1))
await b.close()
