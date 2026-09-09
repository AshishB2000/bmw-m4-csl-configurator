import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Html, Line, useGLTF, useTexture } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { SCOPE_PARTS, WHEEL_R, useStore, type Finish, type Vec3 } from '../store'
import { BY_ID, CHILDREN, subsystemOf } from '../data/parts'
import { createRegistry, type Registry } from './registry'

export let registry: Registry | null = null

export const MODEL_URL = '/models/car.glb'
useGLTF.preload(MODEL_URL, false)

/* ---------- materials ---------- */
const FINISH: Record<Finish, Partial<THREE.MeshPhysicalMaterial>> = {
  gloss: { roughness: 0.4, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.03 },
  satin: { roughness: 0.55, metalness: 0.35, clearcoat: 0.35, clearcoatRoughness: 0.45 },
  matte: { roughness: 0.85, metalness: 0, clearcoat: 0, clearcoatRoughness: 0 },
  metallic: { roughness: 0.45, metalness: 0.65, clearcoat: 1, clearcoatRoughness: 0.03 },
}
const isMesh = (o: THREE.Object3D): o is THREE.Mesh => (o as THREE.Mesh).isMesh
const prettify = (n: string) => n.replace(/^M4xNME_/, '').replace(/_csl$|\d+$/g, '').replace(/^amdb11_brakedisc_FR$/, 'Brake disc').replace(/^Object_4$/, 'Tire').replace(/wheels_enkeif/, 'Wheel').replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())

/** hinge helper: wrap a part's meshes in a pivot group at `hinge` (part-local space: X width, Y length with nose at -Y, Z up) */
function pivot(part: THREE.Object3D, pick: (b: THREE.Box3) => THREE.Vector3) {
  const box = new THREE.Box3()
  const meshes = part.children.filter(isMesh)
  for (const m of meshes) { m.geometry.computeBoundingBox(); box.union(m.geometry.boundingBox!.clone().applyMatrix4(m.matrix)) }
  const g = new THREE.Group()
  g.position.copy(pick(box))
  part.add(g)
  part.updateMatrixWorld(true)
  for (const m of meshes) g.attach(m)
  return g
}
function attachTo(g: THREE.Group, part?: THREE.Object3D) {
  part?.children.filter(isMesh).forEach((m) => g.attach(m))
}

/**
 * The source model's `splitter_F_csl` carbon mesh carries stray geometry that floats above the roof
 * (a flat plate with a red stripe). Drop the triangles above `worldY`, keeping the real splitter below.
 */
function clipAbove(mesh: THREE.Mesh, worldY: number) {
  const g = (mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry) as THREE.BufferGeometry
  const pos = g.getAttribute('position') as THREE.BufferAttribute
  const v = new THREE.Vector3()
  const keep: number[] = []
  for (let t = 0; t < pos.count; t += 3) {
    let hi = -Infinity
    for (let k = 0; k < 3; k++) { v.fromBufferAttribute(pos, t + k).applyMatrix4(mesh.matrixWorld); hi = Math.max(hi, v.y) }
    if (hi < worldY) keep.push(t, t + 1, t + 2)
  }
  if (keep.length === pos.count) return 0
  const out = new THREE.BufferGeometry()
  for (const name of Object.keys(g.attributes)) {
    const a = g.getAttribute(name) as THREE.BufferAttribute
    const arr = new (a.array.constructor as new (n: number) => Float32Array)(keep.length * a.itemSize)
    keep.forEach((src, i) => { for (let c = 0; c < a.itemSize; c++) arr[i * a.itemSize + c] = a.array[src * a.itemSize + c] })
    out.setAttribute(name, new THREE.BufferAttribute(arr, a.itemSize, a.normalized))
  }
  out.computeBoundingBox(); out.computeBoundingSphere()
  mesh.geometry = out
  return (pos.count - keep.length) / 3
}

export type Rig = {
  root: THREE.Group
  body: THREE.Group
  mech: THREE.Group
  wheels: THREE.Group[]
  spinners: THREE.Object3D[]
  parts: Record<string, THREE.Object3D>
  hinges: { hood: THREE.Group; door: THREE.Group; trunk: THREE.Group }
  shell: THREE.Mesh[]
  mats: { paint: THREE.MeshPhysicalMaterial; glass: THREE.MeshPhysicalMaterial; ghost: THREE.MeshPhysicalMaterial; trim: THREE.MeshStandardMaterial[]; rim: THREE.MeshStandardMaterial; head: THREE.MeshStandardMaterial[]; tail: THREE.MeshStandardMaterial[]; signals: THREE.MeshStandardMaterial[]; calipers: THREE.MeshStandardMaterial[] }
  size: THREE.Vector3
  centre: THREE.Vector3
}

const SHELL = ['body', 'bumper_F', 'bumper_R', 'door_FL', 'door_FR', 'fender_L', 'fender_R', 'hood_csl', 'trunk_csl', 'roof_carbon', 'roofline_csl', 'sideskirt', 'sideskirtline_csl', 'splitter_F_csl', 'diffuser', 'diffuserline_csl', 'grille_F_csl', 'grille_F_csl001', 'bumperline_R_csl', 'mirror_L', 'mirror_R', 'fenderint', 'tubs', 'undertray', 'doorpanel_FL', 'doorpanel_FR', 'trunkint', 'interior_csl']

function build(scene: THREE.Group, tread: THREE.Texture, flake: THREE.Texture): Rig {
  if (scene.userData.rig) return scene.userData.rig as Rig // useGLTF caches the scene; StrictMode/HMR call us twice
  const model = scene
  // --- orient: nose → +X, rest on the ground, centred
  model.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(model)
  const hoodC = new THREE.Box3().setFromObject(model.getObjectByName('M4xNME_hood_csl')!).getCenter(new THREE.Vector3())
  const c0 = box.getCenter(new THREE.Vector3())
  const root = new THREE.Group()
  const body = new THREE.Group()
  const mech = new THREE.Group(); mech.name = 'mech' // world-aligned holder for procedural parts; follows ride height
  root.add(body, mech); body.add(model)
  model.position.set(-c0.x, -box.min.y, -c0.z)
  body.rotation.y = hoodC.z > c0.z ? Math.PI / 2 : -Math.PI / 2
  root.updateMatrixWorld(true)

  // --- parts by short name (GLTFLoader strips dots: wheels_enkeif.001 → wheels_enkeif001)
  const parts: Record<string, THREE.Object3D> = {}
  model.traverse((o) => {
    if (!o.children.some(isMesh)) return
    if (o.name.startsWith('M4xNME_')) parts[o.name.slice(7)] = o
    else if (/^(Object_4|amdb11_brakedisc)/.test(o.name)) parts[o.name] = o
  })
  parts.unused?.removeFromParent()
  parts.driveshaft_RF_awd?.removeFromParent() // RWD car
  delete parts.unused; delete parts.driveshaft_RF_awd

  // --- materials
  const paint = new THREE.MeshPhysicalMaterial({ color: '#0f5c8c' })
  const glass = new THREE.MeshPhysicalMaterial({ transmission: 1, thickness: 0.02, roughness: 0.03, ior: 1.5, color: '#ffffff', envMapIntensity: 1.2 })
  const ghost = new THREE.MeshPhysicalMaterial({ color: '#8fb3d9', transparent: true, opacity: 0.028, roughness: 0.4, metalness: 0, depthWrite: false, side: THREE.FrontSide })
  const rim = new THREE.MeshStandardMaterial({ color: '#c9c9cf', metalness: 0.9, roughness: 0.28 })
  const trim: THREE.MeshStandardMaterial[] = []
  const head: THREE.MeshStandardMaterial[] = []
  const tail: THREE.MeshStandardMaterial[] = []
  const signals: THREE.MeshStandardMaterial[] = []
  const calipers: THREE.MeshStandardMaterial[] = []
  const seen = new Set<THREE.Material>()
  tread.wrapS = tread.wrapT = THREE.RepeatWrapping
  flake.wrapS = flake.wrapT = THREE.RepeatWrapping
  flake.repeat.set(60, 60)
  model.traverse((o) => {
    if (!isMesh(o)) return
    const mat = o.material as THREE.MeshStandardMaterial
    const n = mat.name
    const partName = o.parent?.name ?? ''
    if (n === 'M4xNME_Paint') o.material = paint
    else if (n.includes('GlassClear')) { o.material = glass; o.renderOrder = 5 }
    else if (partName.startsWith('M4xNME_wheels') && n.startsWith('M4xNME_silver')) o.material = rim
    else if (!seen.has(mat)) {
      seen.add(mat)
      const phys = mat as THREE.MeshPhysicalMaterial
      if (!/hud|screen/i.test(n)) { mat.emissive.set('#000000'); mat.emissiveIntensity = 0 } // the export ships stray emissives (engine, signals)
      if (n.startsWith('M4xNME_Colorable1') || n.startsWith('M4xNME_Leather')) { trim.push(mat); mat.roughness = 0.7 }
      else if (n.startsWith('mirror')) { mat.metalness = 1; mat.roughness = 0.08; mat.color.set('#dddddd') }
      else if (/^M4xNME_(Lights|highbeam|runningY|fog|lowhighbeam)/.test(n)) { head.push(mat); mat.emissive.set('#ffffff'); mat.color.set('#8d949c'); mat.roughness = 0.25; mat.metalness = 0.3 }
      else if (/^M4xNME_(brake|LS8|taillight_top|fogred)/.test(n)) { tail.push(mat); mat.emissive.set('#ff1a0a'); mat.color.set('#5a0a08') }
      else if (n.startsWith('M4xNME_mechanical')) { mat.metalness = 0.7; mat.roughness = 0.45; mat.color.set('#7d8085') }
      else if (n.startsWith('Scene_-_Root')) { mat.normalMap = tread; mat.normalScale.set(0.7, 0.7); mat.roughness = 0.9; mat.color.set('#161616') }
      else if (n.startsWith('M4xNME_Carbon')) { mat.roughness = 0.3; if (phys.isMeshPhysicalMaterial) phys.clearcoat = 1 }
      else if (n.startsWith('amdb11_caliper')) { calipers.push(mat); mat.roughness = 0.35 }
      else if (n.startsWith('M4xNME_signal')) { signals.push(mat); mat.emissive.set('#ff8c1a'); mat.color.set('#5a2e08') }
      else if (n.startsWith('amdb11_brake')) { mat.metalness = 0.9; mat.roughness = 0.4 }
      else if (n.startsWith('M4xNME_Engine')) { mat.color.set(n.endsWith('A') ? '#2b2b2e' : '#4a4c50'); mat.roughness = 0.55; mat.metalness = 0.35 }
    }
  })
  const shell: THREE.Mesh[] = []
  for (const s of SHELL) parts[s]?.children.forEach((c) => isMesh(c) && shell.push(c))

  // --- procedural battery (the model has none): box + terminals in the bay's rear-right corner
  const battery = new THREE.Group(); battery.name = 'battery'
  const bmat = new THREE.MeshStandardMaterial({ color: '#141416', roughness: 0.6 })
  const bx = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.19, 0.17), bmat); battery.add(bx)
  const lid = new THREE.Mesh(new THREE.BoxGeometry(0.29, 0.02, 0.18), new THREE.MeshStandardMaterial({ color: '#2a2a2e', roughness: 0.5 })); lid.position.y = 0.1; battery.add(lid)
  for (const k of [-1, 1]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.03, 12), new THREE.MeshStandardMaterial({ color: k < 0 ? '#b32020' : '#2a2a2e', metalness: 0.6, roughness: 0.4 })); t.position.set(k * 0.1, 0.125, 0.04); battery.add(t) }
  mech.add(battery); parts.battery = battery
  battery.position.set(0.95, 0.74, 0.55)
  battery.traverse((m) => { if (isMesh(m)) m.userData.part = 'battery' })

  // --- wheels: rims + tires reparented into world-space assemblies so the body can move on its own
  root.updateMatrixWorld(true)
  const rims = Object.keys(parts).filter((k) => k.startsWith('wheels_enkeif')).map((k) => parts[k])
  const tires = Object.keys(parts).filter((k) => k.startsWith('Object_4')).map((k) => parts[k])
  const wheelsG = new THREE.Group(); root.add(wheelsG)
  const centreOf = (o: THREE.Object3D) => new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3())
  const wheels = rims.map((r) => {
    const c = centreOf(r)
    const g = new THREE.Group(); g.position.copy(c); wheelsG.add(g)
    const axle = new THREE.Group(); axle.name = 'axle'; g.add(axle); g.updateMatrixWorld(true)
    const t = tires.reduce((best, x) => { const d = centreOf(x).distanceTo(c); return d < best.d ? { d, x } : best }, { d: Infinity, x: tires[0] }).x
    axle.attach(r); axle.attach(t)
    return g
  })
  // wheel0 = front-left (driver side, -Z); order the rest so wheel index is stable
  wheels.sort((a, b) => (b.position.x - a.position.x) || (a.position.z - b.position.z))
  wheels.forEach((w, i) => { w.name = `wheel${i}`; parts[`wheel${i}`] = w })
  const spinners = wheels.map((w) => w.children[0]) // axles

  // --- hinges (part-local space is Z-up, length along Y with the nose at -Y)
  const hinges = {
    hood: pivot(parts.hood_csl, (b) => new THREE.Vector3((b.min.x + b.max.x) / 2, b.max.y - 0.03, b.max.z - 0.02)),
    trunk: pivot(parts.trunk_csl, (b) => new THREE.Vector3((b.min.x + b.max.x) / 2, b.min.y + 0.03, b.max.z - 0.03)),
    door: pivot(parts.door_FL, (b) => new THREE.Vector3(b.max.x - 0.08, b.min.y + 0.04, (b.min.z + b.max.z) / 2)),
  }
  attachTo(hinges.door, parts.doorglass_FL); attachTo(hinges.door, parts.doorpanel_FL)
  delete parts.doorglass_FL; delete parts.doorpanel_FL

  // --- tag meshes with their part, remember rest positions for the exploded view
  for (const [k, p] of Object.entries(parts)) {
    p.traverse((m) => { if (isMesh(m)) m.userData.part ??= k })
    p.userData.base = p.position.clone()
  }
  root.updateMatrixWorld(true)
  const centre = new THREE.Box3().setFromObject(root).getCenter(new THREE.Vector3())
  // strip the source model's stray above-roof geometry before anything measures the car
  root.updateMatrixWorld(true)
  const strayCarbon = model.getObjectByName('M4xNME_splitter_F_csl_M4xNME_Carbon1001_0') as THREE.Mesh | undefined
  if (strayCarbon?.isMesh) clipAbove(strayCarbon, 1.05)

  const size = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3())
  const rig: Rig = { root, body, mech, wheels, spinners, parts, hinges, shell, mats: { paint, glass, ghost, trim, rim, head, tail, signals, calipers }, centre, size }
  scene.userData.rig = rig
  return rig
}

/** move `node` so that it sits `dist` metres from its rest position along world direction `dir` */
const _inv = new THREE.Matrix4(), _d = new THREE.Vector3(), _s = new THREE.Vector3()
function offset(node: THREE.Object3D, dir: THREE.Vector3, dist: number) {
  const base = node.userData.base as THREE.Vector3
  if (dist === 0) { node.position.copy(base); return }
  const parent = node.parent!
  _inv.copy(parent.matrixWorld).invert()
  _d.copy(dir).transformDirection(_inv)
  parent.getWorldScale(_s)
  node.position.copy(base).addScaledVector(_d, dist / _s.x)
}

function Dimensions({ rig }: { rig: Rig }) {
  const { size } = rig
  const box = useMemo(() => new THREE.Box3().setFromObject(rig.root), [rig])
  const L: [THREE.Vector3, THREE.Vector3, string][] = [
    [new THREE.Vector3(box.min.x, 0.02, box.min.z - 0.5), new THREE.Vector3(box.max.x, 0.02, box.min.z - 0.5), `Length ${size.x.toFixed(2)} m`],
    [new THREE.Vector3(box.max.x + 0.5, 0.02, box.min.z), new THREE.Vector3(box.max.x + 0.5, 0.02, box.max.z), `Width ${size.z.toFixed(2)} m`],
    [new THREE.Vector3(box.min.x - 0.3, 0, box.min.z - 0.3), new THREE.Vector3(box.min.x - 0.3, size.y, box.min.z - 0.3), `Height ${size.y.toFixed(2)} m`],
    [new THREE.Vector3(rig.wheels[2].position.x, 0.02, box.min.z - 0.25), new THREE.Vector3(rig.wheels[0].position.x, 0.02, box.min.z - 0.25), `Wheelbase ${(rig.wheels[0].position.x - rig.wheels[2].position.x).toFixed(2)} m`],
  ]
  return (
    <group>
      {L.map(([a, b, label], i) => (
        <group key={i}>
          <Line points={[a, b]} color="#ffffff" lineWidth={1} transparent opacity={0.7} />
          <Line points={[a, a.clone().add(new THREE.Vector3(0, i === 2 ? 0 : 0.12, 0))]} color="#ffffff" lineWidth={1} transparent opacity={0.7} />
          <Line points={[b, b.clone().add(new THREE.Vector3(0, i === 2 ? 0 : 0.12, 0))]} color="#ffffff" lineWidth={1} transparent opacity={0.7} />
          <Html position={a.clone().add(b).multiplyScalar(0.5).add(new THREE.Vector3(0, 0.08, 0))} center zIndexRange={[10, 0]}>
            <div className="whitespace-nowrap rounded bg-black/70 px-1.5 py-0.5 text-[10px] tracking-wide text-white backdrop-blur">{label}</div>
          </Html>
        </group>
      ))}
    </group>
  )
}


export function Car() {
  const { scene } = useGLTF(MODEL_URL, false)
  const [tread, flake] = useTexture(['/tex/tread_normal.png', '/tex/flake_normal.png'])
  const rig = useMemo(() => build(scene, tread, flake), [scene, tread, flake])
  const reg = useMemo(() => (scene.userData.registry ??= createRegistry(rig)) as Registry, [scene, rig])
  registry = reg
  ;(window as any).__registry = reg
  const s = useStore()
  const { paint, finish, rimColor, tint, trim, lights, ride, wheel, mode, explode, scope, part, level, context, asmExplode, doorOpen, hoodOpen, trunkOpen, caliper, ambient, drive, hazards, dims } = s

  useEffect(() => { rig.mats.paint.color.set(paint); Object.assign(rig.mats.paint, FINISH[finish]); rig.mats.paint.normalMap = finish === 'metallic' ? flake : null; rig.mats.paint.normalScale.set(0.1, 0.1); rig.mats.paint.needsUpdate = true }, [rig, paint, finish, flake])
  useEffect(() => { rig.mats.rim.color.set(rimColor) }, [rig, rimColor])
  useEffect(() => { rig.mats.calipers.forEach((m) => m.color.set(caliper)) }, [rig, caliper])
  useEffect(() => { rig.mats.trim.forEach((m) => m.color.set(trim)) }, [rig, trim])
  useEffect(() => { rig.mats.glass.color.set('#ffffff').lerp(new THREE.Color('#05070a'), tint * 0.9) }, [rig, tint])
  useEffect(() => { rig.mats.head.forEach((m) => (m.emissiveIntensity = lights ? 5 : 0)); rig.mats.tail.forEach((m) => (m.emissiveIntensity = lights ? 3 : 0)) }, [rig, lights])
  const baseY = ride + (wheel - 1) * WHEEL_R
  useEffect(() => {
    rig.body.position.y = rig.mech.position.y = baseY
    rig.wheels.forEach((w) => { w.scale.setScalar(wheel); w.position.y = WHEEL_R * wheel })
  }, [rig, baseY, wheel])

  // lazily build the procedural subsystems: the one being explored now, everything for x-ray / chassis, and all of them after idle
  useEffect(() => {
    if (part) reg.ensure(subsystemOf(part))
    if (level !== 'car') reg.ensure(subsystemOf(level))
    if (mode === 'xray' || mode === 'chassis' || mode === 'engine') reg.ensureAll()
  }, [reg, part, level, mode])
  useEffect(() => { const t = setTimeout(() => reg.ensureAll(), 2500); return () => clearTimeout(t) }, [reg])

  // ghosting: with a part selected everything else ghosts (or hides when "show in context" is off); x-ray mode ghosts the shell
  const [buildVersion, setBuildVersion] = useState(0)
  useEffect(() => { const id = setInterval(() => setBuildVersion(reg.built.size), 500); return () => clearInterval(id) }, [reg])
  useEffect(() => {
    const keep = new Set<THREE.Object3D>()
    if (part) for (const o of reg.objectsOf(part)) o.traverse((m) => keep.add(m))
    const shell = new Set<THREE.Object3D>(rig.shell)
    rig.root.traverse((o) => {
      if (!isMesh(o)) return
      const m = o
      const ghost = part ? !keep.has(m) : mode === 'xray' && shell.has(m)
      if (ghost) { m.userData.mat ??= m.material; m.material = rig.mats.ghost; m.renderOrder = 6 }
      else if (m.userData.mat) { m.material = m.userData.mat; m.renderOrder = m.material === rig.mats.glass ? 5 : 0 }
      m.visible = !(part && !context && !keep.has(m))
    })
  }, [rig, reg, part, context, mode, buildVersion])

  // selection → outline meshes + camera move
  useEffect(() => {
    if (!part) { useStore.setState({ sel: [] }); return }
    const objs = reg.objectsOf(part)
    if (!objs.length) { useStore.setState({ sel: [] }); return }
    const sel: THREE.Object3D[] = []
    objs.forEach((n) => n.traverse((m) => isMesh(m) && sel.push(m)))
    const box = reg.box(part)
    const c = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3())
    const maxS = Math.max(size.x, size.y, size.z)
    const dist = Math.max(0.7, maxS * 2.1 + 0.5)
    const dir = c.clone().sub(rig.centre).setY(0)
    if (dir.length() < 0.5) dir.set(0.6, 0, -1)
    dir.normalize()
    if (Math.abs(dir.z) < 0.45) dir.z = dir.z < 0 ? -0.7 : (c.z > 0.05 ? 0.7 : -0.7)
    dir.y = maxS > 1.5 ? 0.45 : 0.75
    dir.normalize()
    const pos = c.clone().addScaledVector(dir, dist)
    if (pos.y < 0.15 && c.y > 0.25) pos.y = 0.15
    useStore.setState({ sel, goal: { pos: pos.toArray() as Vec3, target: c.toArray() as Vec3 }, flying: true })
  }, [rig, reg, part])

  // explode the selected assembly's children outward from its centre
  const exploded = useRef<THREE.Object3D[]>([])
  useEffect(() => {
    for (const o of exploded.current) o.position.copy(o.userData.base)
    exploded.current = []
    if (!part || asmExplode === 0) return
    const kids = CHILDREN[part] ?? []
    if (!kids.length) return
    const box = reg.box(part)
    const centre = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3())
    const d = asmExplode * (Math.max(size.x, size.y, size.z) * 0.55 + 0.08)
    for (const k of kids) {
      const kc = reg.box(k.id).getCenter(new THREE.Vector3())
      const dir = kc.sub(centre)
      if (dir.lengthSq() < 1e-6) dir.set(0, 1, 0)
      dir.normalize()
      for (const o of reg.objectsOf(k.id)) { if (!o.userData.base) o.userData.base = o.position.clone(); offset(o, dir, d); exploded.current.push(o) }
    }
  }, [reg, part, asmExplode])

  // exploded view, per scope
  useEffect(() => {
    const only = SCOPE_PARTS[scope]
    const engineC = new THREE.Vector3(1.4, 0.75, 0)
    const dir = new THREE.Vector3()
    for (const [k, p] of Object.entries(rig.parts)) {
      const inScope = only ? only.includes(k) : !k.startsWith('wheel')
      if (!inScope || explode === 0) { offset(p, dir, 0); continue }
      const c = new THREE.Box3().setFromObject(p).getCenter(new THREE.Vector3())
      if (scope === 'engine') dir.subVectors(c, engineC).setY(dir.y + 0.5).normalize()
      else dir.subVectors(c, rig.centre).multiply(new THREE.Vector3(1, 2.2, 1.6)).normalize()
      if (dir.lengthSq() < 0.5) dir.set(0, 1, 0)
      offset(p, dir, explode * (scope === 'engine' ? 0.7 : 1.4))
    }
    if (scope === 'wheel') {
      const w = rig.wheels[0]
      const out = new THREE.Vector3(0, 0, -1)
      w.children[0].children.forEach((ch) => { ch.userData.base ??= ch.position.clone(); offset(ch, out, explode * (ch.name.startsWith('Object_4') ? 0.62 : 0.36)) })
      const brake = Object.keys(rig.parts).filter((k) => k.startsWith('amdb11')).map((k) => rig.parts[k]).sort((a, b) => new THREE.Box3().setFromObject(a).getCenter(new THREE.Vector3()).distanceTo(w.position) - new THREE.Box3().setFromObject(b).getCenter(new THREE.Vector3()).distanceTo(w.position))[0]
      if (brake) offset(brake, out, explode * 0.16)
    } else { rig.wheels.forEach((w) => w.children[0].children.forEach((ch) => { if (ch.userData.base) ch.position.copy(ch.userData.base) })) }
    if (scope === 'engine' && explode > 0 && !useStore.getState().hoodOpen) useStore.setState({ hoodOpen: true })
  }, [rig, explode, scope])

  useEffect(() => { ;(window as any).__CAR = 'ready' }, [rig])

  // hinges animate, wheels spin a little while the camera orbits
  const lastAz = useRef<number | null>(null)
  useFrame(({ camera }, dt) => {
    const k = 1 - Math.exp(-dt * 5)
    const h = rig.hinges
    h.hood.rotation.x += ((hoodOpen ? -0.95 : 0) - h.hood.rotation.x) * k
    h.trunk.rotation.x += ((trunkOpen ? 1.0 : 0) - h.trunk.rotation.x) * k
    h.door.rotation.z += ((doorOpen ? 1.1 : 0) - h.door.rotation.z) * k
    const az = Math.atan2(camera.position.x, camera.position.z)
    if (lastAz.current !== null) { const d = az - lastAz.current; if (Math.abs(d) < 1) rig.spinners.forEach((o) => (o.rotation.z += d * 2)) }
    lastAz.current = az
    const t = performance.now() / 1000
    if (drive) { rig.spinners.forEach((o) => (o.rotation.z -= dt * 14)); rig.body.position.y = rig.mech.position.y = baseY + Math.sin(t * 11) * 0.004 + Math.sin(t * 2.3) * 0.003 }
    else if (Math.abs(rig.body.position.y - baseY) > 1e-4) rig.body.position.y = rig.mech.position.y = baseY
    const blink = hazards ? (Math.sin(t * Math.PI * 2.6) > 0 ? 5 : 0) : 0
    if (rig.mats.signals[0] && rig.mats.signals[0].emissiveIntensity !== blink) rig.mats.signals.forEach((m) => (m.emissiveIntensity = blink))
  })

  // hover / click picking
  const hoverRef = useRef<string | null>(null)
  const onMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    const id = e.object.userData.part as string | undefined
    const label = id ? (BY_ID[id]?.name ?? prettify(id)) : null
    if (label !== hoverRef.current) {
      hoverRef.current = label
      const hoverSel: THREE.Object3D[] = []
      if (id && BY_ID[id] && id !== useStore.getState().part) reg.objectsOf(id).forEach((o) => o.traverse((m) => isMesh(m) && hoverSel.push(m)))
      useStore.setState({ hover: label, hoverId: id ?? null, hoverSel })
    }
  }
  const onOut = () => { hoverRef.current = null; useStore.setState({ hover: null, hoverId: null, hoverSel: [] }) }
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    const id = e.object.userData.part as string | undefined
    if (id && BY_ID[id]) s.selectPart(id)
  }

  const y = rig.body.position.y
  const beamTargets = useMemo(() => [new THREE.Object3D(), new THREE.Object3D()], [])
  return (
    <group>
      <primitive object={rig.root} onPointerMove={onMove} onPointerOut={onOut} onClick={onClick} />
      {ambient !== 'off' && <pointLight position={[0.1, 0.95 + y, 0]} color={ambient} intensity={2.2} distance={2.6} decay={2} />}
      {dims && <Dimensions rig={rig} />}
      {lights && [-1, 1].map((k, i) => (
        <group key={k}>
          <primitive object={beamTargets[i]} position={[10, -0.8, k * 1.2]} />
          <spotLight position={[2.2, 0.62 + y, k * 0.62]} target={beamTargets[i]} angle={0.45} penumbra={0.7} intensity={60} distance={20} color="#e8f0ff" />
        </group>
      ))}
    </group>
  )
}
