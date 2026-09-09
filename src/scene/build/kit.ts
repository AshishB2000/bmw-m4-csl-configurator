/** Procedural modelling kit: shared materials, geometry helpers, and part tagging. Units are metres, world frame (nose +X, driver side -Z). */
import * as THREE from 'three'

export const M = {
  steel: new THREE.MeshStandardMaterial({ color: '#8f9399', metalness: 0.85, roughness: 0.4 }),
  polished: new THREE.MeshStandardMaterial({ color: '#c9ccd2', metalness: 1, roughness: 0.18 }),
  cast: new THREE.MeshStandardMaterial({ color: '#6b6e73', metalness: 0.6, roughness: 0.7 }),
  alu: new THREE.MeshStandardMaterial({ color: '#b9bcc2', metalness: 0.8, roughness: 0.35 }),
  dark: new THREE.MeshStandardMaterial({ color: '#1c1d20', metalness: 0.3, roughness: 0.6 }),
  black: new THREE.MeshStandardMaterial({ color: '#0f0f11', metalness: 0.1, roughness: 0.8 }),
  rubber: new THREE.MeshStandardMaterial({ color: '#141414', roughness: 0.95 }),
  plastic: new THREE.MeshStandardMaterial({ color: '#2a2b2f', roughness: 0.7 }),
  copper: new THREE.MeshStandardMaterial({ color: '#b87333', metalness: 0.9, roughness: 0.35 }),
  brass: new THREE.MeshStandardMaterial({ color: '#c8a951', metalness: 0.9, roughness: 0.35 }),
  red: new THREE.MeshStandardMaterial({ color: '#b3202a', roughness: 0.5 }),
  ceramic: new THREE.MeshStandardMaterial({ color: '#e8e2d0', roughness: 0.5 }),
  carbon: new THREE.MeshPhysicalMaterial({ color: '#17181b', roughness: 0.3, clearcoat: 1 }),
  fabric: new THREE.MeshStandardMaterial({ color: '#232326', roughness: 1 }),
  glass: new THREE.MeshPhysicalMaterial({ color: '#cfe4ff', transparent: true, opacity: 0.35, roughness: 0.05, metalness: 0 }),
  hose: new THREE.MeshStandardMaterial({ color: '#111', roughness: 0.85 }),
  blue: new THREE.MeshStandardMaterial({ color: '#1f5bc4', roughness: 0.5 }),
  white: new THREE.MeshStandardMaterial({ color: '#eeeeee', roughness: 0.5 }),
  led: new THREE.MeshStandardMaterial({ color: '#dfe8ff', emissive: '#ffffff', emissiveIntensity: 0.4, roughness: 0.3 }),
}
export type V3 = [number, number, number]
const _cache = new Map<string, THREE.BufferGeometry>()
function cached<T extends THREE.BufferGeometry>(key: string, make: () => T): T {
  let g = _cache.get(key); if (!g) { g = make(); _cache.set(key, g) } return g as T
}
export const cylG = (r: number, h: number, seg = 24, rt = r) => cached(`cyl${r},${h},${seg},${rt}`, () => new THREE.CylinderGeometry(rt, r, h, seg))
export const boxG = (x: number, y: number, z: number) => cached(`box${x},${y},${z}`, () => new THREE.BoxGeometry(x, y, z))
export const sphG = (r: number, seg = 16) => cached(`sph${r},${seg}`, () => new THREE.SphereGeometry(r, seg, seg))
export const torG = (R: number, r: number, seg = 24, tseg = 12) => cached(`tor${R},${r},${seg},${tseg}`, () => new THREE.TorusGeometry(R, r, tseg, seg))
export const coneG = (r: number, h: number, seg = 16) => cached(`cone${r},${h},${seg}`, () => new THREE.ConeGeometry(r, h, seg))
export const hexG = (r: number, h: number) => cylG(r, h, 6)
/** spur gear: extruded toothed disc, axis along Y */
export function gearG(R: number, teeth: number, thick: number) {
  return cached(`gear${R},${teeth},${thick}`, () => {
    const s = new THREE.Shape(); const ri = R * 0.88
    for (let i = 0; i < teeth; i++) {
      const a0 = (i / teeth) * Math.PI * 2, a1 = ((i + 0.5) / teeth) * Math.PI * 2, d = Math.PI / teeth * 0.4
      const pts: [number, number][] = [[ri, a0 - d], [R, a0 + d * 0.3], [R, a1 - d * 0.3], [ri, a1 + d]]
      for (const [r, a] of pts) { const x = Math.cos(a) * r, y = Math.sin(a) * r; i === 0 && a === a0 - d ? s.moveTo(x, y) : s.lineTo(x, y) }
    }
    s.closePath()
    const hole = new THREE.Path(); hole.absarc(0, 0, R * 0.25, 0, Math.PI * 2, true); s.holes.push(hole)
    const g = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: false, curveSegments: 4 })
    g.rotateX(-Math.PI / 2); g.translate(0, -thick / 2, 0)
    return g
  })
}
/** coil spring: helix tube, axis along Y, centred */
export function springG(R: number, wire: number, turns: number, height: number) {
  return cached(`spring${R},${wire},${turns},${height}`, () => {
    const pts: THREE.Vector3[] = []
    const n = Math.round(turns * 16)
    for (let i = 0; i <= n; i++) { const t = i / n; const a = t * turns * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * R, -height / 2 + t * height, Math.sin(a) * R)) }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n, wire, 8, false)
  })
}
/** tube along a poly-line (world points) */
export function tubeG(points: V3[], r: number, closed = false) {
  const c = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), closed, 'catmullrom', 0.3)
  return new THREE.TubeGeometry(c, Math.max(8, points.length * 6), r, 10, closed)
}

export function mesh(g: THREE.BufferGeometry, mat: THREE.Material, pos: V3 = [0, 0, 0], rot: V3 = [0, 0, 0], scale?: V3 | number) {
  const m = new THREE.Mesh(g, mat)
  m.position.set(...pos); m.rotation.set(...rot)
  if (scale !== undefined) typeof scale === 'number' ? m.scale.setScalar(scale) : m.scale.set(...scale)
  return m
}
export const RX = Math.PI / 2
/** cylinder whose axis points along world X (default cylinder axis is Y) */
export const cylX = (r: number, h: number, mat: THREE.Material, pos: V3 = [0, 0, 0], seg = 24) => mesh(cylG(r, h, seg), mat, pos, [0, 0, RX])
export const cylZ = (r: number, h: number, mat: THREE.Material, pos: V3 = [0, 0, 0], seg = 24) => mesh(cylG(r, h, seg), mat, pos, [RX, 0, 0])
export const cylY = (r: number, h: number, mat: THREE.Material, pos: V3 = [0, 0, 0], seg = 24) => mesh(cylG(r, h, seg), mat, pos)
export const box = (x: number, y: number, z: number, mat: THREE.Material, pos: V3 = [0, 0, 0], rot: V3 = [0, 0, 0]) => mesh(boxG(x, y, z), mat, pos, rot)
export const tube = (pts: V3[], r: number, mat: THREE.Material, closed = false) => mesh(tubeG(pts, r, closed), mat)
export function group(children: THREE.Object3D[], pos: V3 = [0, 0, 0], rot: V3 = [0, 0, 0]) {
  const g = new THREE.Group(); g.position.set(...pos); g.rotation.set(...rot); children.forEach((c) => g.add(c)); return g
}
/** tag an object (and untagged descendants) with a part id */
export function tag(obj: THREE.Object3D, id: string) {
  obj.name = id
  obj.traverse((o) => { if (!o.userData.part) o.userData.part = id })
  obj.userData.part = id
  return obj
}
