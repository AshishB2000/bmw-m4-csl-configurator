// node --experimental-strip-types scripts/parts-stats.mjs — prints part counts per subsystem and checks the tree
import { PARTS, BY_ID, subsystemOf } from '../src/data/parts.ts'
const counts = {}
for (const p of PARTS) counts[subsystemOf(p.id)] = (counts[subsystemOf(p.id)] || 0) + 1
const orphans = PARTS.filter((p) => p.parent !== 'car' && !BY_ID[p.parent]).map((p) => p.id)
const dupes = PARTS.map((p) => p.id).filter((id, i, a) => a.indexOf(id) !== i)
console.log(JSON.stringify({ total: PARTS.length, counts, orphans, dupes }, null, 1))
if (orphans.length || dupes.length) process.exit(1)
