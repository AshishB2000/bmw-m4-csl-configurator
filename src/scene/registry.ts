/** Maps every part id in src/data/parts.ts to an Object3D in the scene (GLB nodes or procedural builds). */
import * as THREE from 'three'
import { BY_ID, CHILDREN, PARTS, SUBSYSTEMS, subsystemOf, type Part } from '../data/parts'
import { BUILDERS, type Corner, type Ctx } from './build/systems'
import { tag } from './build/kit'
import type { Rig } from './Car'

export type Registry = {
  objects: Map<string, THREE.Object3D[]>   // part id → its own objects
  built: Set<string>
  ensure: (subsystem: string) => void
  ensureAll: () => void
  objectsOf: (id: string) => THREE.Object3D[] // own + descendants
  box: (id: string) => THREE.Box3
  missing: () => string[]
}

const isMesh = (o: THREE.Object3D): o is THREE.Mesh => (o as THREE.Mesh).isMesh

export function createRegistry(rig: Rig): Registry {
  const objects = new Map<string, THREE.Object3D[]>()
  const put = (id: string, o: THREE.Object3D) => { (objects.get(id) ?? objects.set(id, []).get(id)!).push(o); o.userData.base ??= o.position.clone() }

  // --- GLB nodes: index by short name (group nodes and their per-material child meshes)
  const byName = new Map<string, THREE.Object3D>()
  rig.root.traverse((o) => { if (o.name.startsWith('M4xNME_')) byName.set(o.name.slice(7), o); else if (o.name) byName.set(o.name, o) })
  for (const p of PARTS) {
    if (!p.node) continue
    for (const n of Array.isArray(p.node) ? p.node : [p.node]) {
      const o = rig.parts[n] ?? byName.get(n)
      if (o) { put(p.id, o); continue }
      let found = false
      rig.root.traverse((m) => { if (isMesh(m) && m.name.startsWith(`M4xNME_${n}_`)) { put(p.id, m); found = true } })
      if (!found) console.warn('[registry] node not found for', p.id, n)
    }
  }
  // per-corner GLB pieces: tire / rim in the axle, disc / caliper / misc from the nearest brake node
  const corners: Corner[] = []
  const brakes = Object.keys(rig.parts).filter((k) => k.startsWith('amdb11')).map((k) => rig.parts[k])
  const centreOf = (o: THREE.Object3D) => new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3())
  ;['fl', 'fr', 'rl', 'rr'].forEach((c, i) => {
    const g = rig.wheels[i]; const axle = g.children[0]
    const id = `wheels.${c}`
    put(id, g)
    for (const ch of axle.children) put(ch.name.startsWith('Object_4') ? `${id}.tire` : `${id}.rim`, ch)
    const brake = brakes.sort((a, b) => centreOf(a).distanceTo(g.position) - centreOf(b).distanceTo(g.position))[0]
    let brakeCentre = g.position.clone()
    if (brake) {
      for (const m of brake.children) {
        if (!isMesh(m)) continue
        if (/caliper/.test(m.name)) { put(`${id}.caliper`, m); brakeCentre = centreOf(m) }
        else if (/amdb11_brake/.test(m.name)) put(`${id}.disc`, m)
        else put(`${id}.hub`, m)
      }
    }
    corners.push({ id, group: g, axle, side: g.position.z < 0 ? -1 : 1, front: g.position.x > 0, brakeCentre })
  })

  // --- procedural builders
  const built = new Set<string>()
  const ctx: Ctx = {
    add: (id, obj, pos, rot) => ctx.addTo(rig.mech, id, obj, pos, rot),
    addTo: (parent, id, obj, pos, rot) => {
      if (!BY_ID[id]) console.warn('[registry] builder made unknown part', id)
      if (pos) obj.position.set(...pos); if (rot) obj.rotation.set(...rot)
      tag(obj, id); parent.add(obj); put(id, obj); return obj
    },
    corners,
  }
  const ensure = (sub: string) => { if (built.has(sub) || !BUILDERS[sub]) return; built.add(sub); BUILDERS[sub](ctx); rig.root.updateMatrixWorld(true) }
  const ensureAll = () => SUBSYSTEMS.forEach(ensure)
  // tag GLB-mapped objects (deepest part wins: process leaves after parents)
  const depth = (p: Part) => p.id.split('.').length
  for (const p of [...PARTS].sort((a, b) => depth(a) - depth(b))) for (const o of objects.get(p.id) ?? []) o.traverse((m) => { m.userData.part = p.id })

  const objectsOf = (id: string): THREE.Object3D[] => {
    const own = objects.get(id) ?? []
    const kids = (CHILDREN[id] ?? []).flatMap((k) => objectsOf(k.id))
    return [...own, ...kids]
  }
  const box = (id: string) => { const b = new THREE.Box3(); for (const o of objectsOf(id)) b.union(new THREE.Box3().setFromObject(o)); return b }
  const missing = () => { ensureAll(); return PARTS.filter((p) => p.id !== 'car' && objectsOf(p.id).length === 0).map((p) => p.id) }
  void subsystemOf
  return { objects, built, ensure, ensureAll, objectsOf, box, missing }
}
