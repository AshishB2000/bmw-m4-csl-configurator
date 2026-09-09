/**
 * Procedural sub-assemblies for every part that has no mesh in the GLB.
 * Each builder receives a context with `add(id, object, pos)` (world coordinates, rides with the body)
 * and helpers for the four wheel corners. Builders are lazy: a subsystem is built on first drill-in.
 */
import * as THREE from 'three'
import { M, RX, box, boxG, cylG, cylX, cylY, cylZ, coneG, gearG, group, hexG, mesh, sphG, springG, torG, tube, type V3 } from './kit'

export type Corner = { id: string; group: THREE.Group; axle: THREE.Object3D; side: number; front: boolean; brakeCentre: THREE.Vector3 }
export type Ctx = {
  add: (id: string, obj: THREE.Object3D, pos?: V3, rot?: V3) => THREE.Object3D
  addTo: (parent: THREE.Object3D, id: string, obj: THREE.Object3D, pos?: V3, rot?: V3) => THREE.Object3D
  corners: Corner[]
}

// engine geometry constants (world frame)
const EX = 1.28, EY = 0.52 // block centre
const PITCH = 0.091
const cx = (i: number) => EX + (i - 3.5) * PITCH // cylinder 1..6 centre x (1 = front)
const CRANK_Y = 0.40
const PHASE = [0, 120, 240, 240, 120, 0].map((d) => (d * Math.PI) / 180)

function engine(c: Ctx) {
  const { add } = c
  add('engine.block', group([
    box(0.62, 0.30, 0.26, M.cast, [0, 0, 0]),
    box(0.62, 0.14, 0.34, M.cast, [0, -0.19, 0]),
    ...[1, 2, 3, 4, 5, 6].map((i) => cylY(0.045, 0.31, M.dark, [cx(i) - EX, 0.005, 0])), // bore liners (visible from the deck)
  ]), [EX, EY, 0])
  add('engine.headgasket', box(0.62, 0.006, 0.28, M.steel, [0, 0, 0]), [EX, 0.673, 0])
  add('engine.head', group([
    box(0.62, 0.11, 0.28, M.alu, [0, 0, 0]),
    ...[1, 2, 3, 4, 5, 6].flatMap((i) => [cylZ(0.016, 0.04, M.dark, [cx(i) - EX, -0.02, 0.15]), cylZ(0.018, 0.04, M.dark, [cx(i) - EX, -0.01, -0.15])]), // ports
  ]), [EX, 0.73, 0])
  add('engine.valvecover', group([box(0.6, 0.07, 0.24, M.carbon), box(0.5, 0.02, 0.1, M.black, [0, 0.045, 0])]), [EX, 0.82, 0])
  add('engine.oilpan', group([box(0.6, 0.06, 0.32, M.cast), box(0.3, 0.12, 0.28, M.cast, [-0.12, -0.08, 0]), mesh(hexG(0.012, 0.012), M.steel, [-0.12, -0.146, 0])]), [EX, 0.30, 0])
  add('engine.oilpump', group([box(0.09, 0.07, 0.08, M.cast), mesh(gearG(0.035, 12, 0.02), M.steel, [0, 0, 0.05], [RX, 0, 0])]), [1.5, 0.34, 0.06])
  add('engine.waterpump', group([cylX(0.045, 0.07, M.cast, [0, 0, 0]), cylX(0.055, 0.012, M.steel, [0.045, 0, 0])]), [1.64, 0.52, 0.07])
  add('engine.thermostat', group([box(0.06, 0.05, 0.06, M.cast), cylX(0.02, 0.05, M.cast, [0.045, 0, 0])]), [1.63, 0.64, -0.05])
  add('engine.throttle', group([cylX(0.041, 0.06, M.alu), box(0.03, 0.05, 0.04, M.plastic, [0, 0.05, 0]), cylX(0.036, 0.004, M.brass)]), [1.62, 0.70, -0.23])
  add('engine.fuelrail', group([cylX(0.012, 0.56, M.polished), ...[0.2, -0.2].map((x) => box(0.02, 0.03, 0.02, M.steel, [x, 0.02, 0]))]), [EX, 0.745, -0.135])
  add('engine.injectors', group([]), [EX, 0.70, -0.12])
  for (let i = 1; i <= 6; i++) add(`engine.injectors.i${i}`, group([cylY(0.008, 0.06, M.steel), cylY(0.011, 0.02, M.plastic, [0, 0.035, 0]), box(0.012, 0.01, 0.02, M.black, [0, 0.045, -0.01])]), [cx(i), 0.70, -0.125], [0.25, 0, 0])
  add('engine.sparkplugs', group([]), [EX, 0.80, 0])
  for (let i = 1; i <= 6; i++) add(`engine.sparkplugs.p${i}`, group([mesh(hexG(0.009, 0.014), M.steel), cylY(0.006, 0.03, M.ceramic, [0, 0.02, 0]), cylY(0.004, 0.05, M.steel, [0, -0.03, 0])]), [cx(i), 0.79, 0])
  add('engine.coils', group([]), [EX, 0.885, 0])
  for (let i = 1; i <= 6; i++) add(`engine.coils.c${i}`, group([box(0.032, 0.04, 0.05, M.black, [0, 0.03, 0]), cylY(0.011, 0.06, M.plastic, [0, -0.02, 0]), box(0.02, 0.012, 0.02, M.dark, [0, 0.055, -0.02])]), [cx(i), 0.875, 0])
  // turbochargers on the exhaust side (+Z)
  for (const [t, x] of [['t1', 1.42], ['t2', 1.14]] as const) {
    const id = `engine.turbo.${t}`
    add(id, group([cylX(0.03, 0.09, M.cast)]), [x, 0.50, 0.25]) // centre cartridge
    add(`${id}.compressor`, group([mesh(torG(0.05, 0.028, 24, 12), M.alu, [0.055, 0, 0], [0, RX, 0]), cylX(0.04, 0.03, M.alu, [0.09, 0, 0]), ...Array.from({ length: 11 }, (_, k) => mesh(boxG(0.03, 0.02, 0.003), M.polished, [0.055, Math.cos(k / 11 * Math.PI * 2) * 0.03, Math.sin(k / 11 * Math.PI * 2) * 0.03], [k / 11 * Math.PI * 2, 0, 0]))]), [x, 0.50, 0.25])
    add(`${id}.turbine`, group([mesh(torG(0.048, 0.03, 24, 12), M.cast, [-0.055, 0, 0], [0, RX, 0]), cylX(0.035, 0.03, M.cast, [-0.09, 0, 0]), ...Array.from({ length: 9 }, (_, k) => mesh(boxG(0.026, 0.018, 0.003), M.steel, [-0.055, Math.cos(k / 9 * Math.PI * 2) * 0.026, Math.sin(k / 9 * Math.PI * 2) * 0.026], [k / 9 * Math.PI * 2, 0, 0]))]), [x, 0.50, 0.25])
    add(`${id}.wastegate`, group([box(0.035, 0.03, 0.05, M.black, [0, 0.045, 0]), cylY(0.006, 0.04, M.steel, [0, 0.02, 0.02]), box(0.03, 0.006, 0.01, M.steel, [0.01, 0.005, 0.03])]), [x - 0.055, 0.55, 0.29])
  }
  add('engine.turbo', group([]), [1.28, 0.5, 0.25])
  add('engine.exmanifold', group([1, 2, 3, 4, 5, 6].map((i) => tube([[cx(i), 0.70, 0.15], [cx(i) + (i <= 3 ? 0.05 : -0.05), 0.62, 0.22], [i <= 3 ? 1.42 : 1.14, 0.52, 0.25]], 0.017, M.cast))))
  add('engine.alternator', group([cylX(0.065, 0.12, M.cast), cylX(0.03, 0.02, M.steel, [0.07, 0, 0]), box(0.05, 0.03, 0.02, M.black, [-0.04, 0.05, 0])]), [1.6, 0.42, -0.21])
  add('engine.starter', group([cylX(0.038, 0.14, M.cast), cylX(0.03, 0.06, M.dark, [0.09, 0.03, 0])]), [0.96, 0.40, 0.16])
  add('engine.belt', group([]), [1.69, 0.48, -0.08])
  add('engine.belt.crankpulley', group([cylX(0.08, 0.025, M.steel), mesh(torG(0.065, 0.008, 32, 8), M.rubber, [0, 0, 0], [0, RX, 0])]), [1.69, CRANK_Y, 0])
  add('engine.belt.altpulley', cylX(0.03, 0.02, M.steel, [0, 0, 0]), [1.69, 0.42, -0.21])
  add('engine.belt.wppulley', cylX(0.05, 0.015, M.steel, [0, 0, 0]), [1.69, 0.52, 0.07])
  add('engine.belt.tensioner', group([cylX(0.03, 0.02, M.plastic), box(0.02, 0.08, 0.02, M.cast, [-0.02, -0.04, 0])]), [1.69, 0.58, -0.09])
  add('engine.belt.serpentine', tube([[1.69, 0.32, -0.02], [1.69, 0.34, 0.06], [1.69, 0.52, 0.12], [1.69, 0.60, -0.07], [1.69, 0.45, -0.24], [1.69, 0.36, -0.14]], 0.006, M.rubber, true))
  add('engine.mounts', group([]), [1.25, 0.38, 0])
  add('engine.mounts.left', group([box(0.08, 0.04, 0.06, M.cast, [0, 0.03, 0]), cylY(0.035, 0.05, M.rubber)]), [1.25, 0.37, -0.25])
  add('engine.mounts.right', group([box(0.08, 0.04, 0.06, M.cast, [0, 0.03, 0]), cylY(0.035, 0.05, M.rubber)]), [1.25, 0.37, 0.25])
  // crankshaft: main journals + throws
  const crank: THREE.Object3D[] = [cylX(0.028, 0.72, M.polished)]
  for (let i = 1; i <= 6; i++) {
    const a = PHASE[i - 1], x = cx(i) - EX
    const oy = Math.cos(a) * 0.045, oz = Math.sin(a) * 0.045
    crank.push(cylX(0.026, 0.036, M.polished, [x, oy, oz]))
    for (const dx of [-0.028, 0.028]) crank.push(mesh(boxG(0.016, 0.13, 0.06), M.steel, [x + dx, oy * 0.3, oz * 0.3], [a, 0, 0]))
  }
  add('engine.crank', group(crank), [EX, CRANK_Y, 0])
  add('engine.crank.mainbearings', group([0, 1, 2, 3, 4, 5, 6].map((k) => mesh(torG(0.033, 0.006, 24, 8), M.copper, [-0.31 + k * 0.1033, 0, 0], [0, RX, 0]))), [EX, CRANK_Y, 0])
  add('engine.crank.flywheel', group([cylX(0.15, 0.02, M.steel), mesh(torG(0.148, 0.006, 64, 6), M.dark, [-0.012, 0, 0], [0, RX, 0])]), [0.955, CRANK_Y, 0])
  // pistons
  add('engine.pistons', group([]), [EX, 0.55, 0])
  for (let i = 1; i <= 6; i++) {
    const a = PHASE[i - 1], y = 0.55 + Math.cos(a) * 0.04
    add(`engine.pistons.p${i}`, group([cylY(0.041, 0.055, M.alu), cylY(0.036, 0.01, M.alu, [0, 0.03, 0])]), [cx(i), y, 0])
    add(`engine.pistons.p${i}.rings`, group([0.018, 0.008, -0.004].map((dy) => mesh(torG(0.0415, 0.0018, 32, 6), M.polished, [0, dy, 0], [RX, 0, 0]))), [cx(i), y, 0])
    add(`engine.pistons.p${i}.pin`, cylZ(0.011, 0.066, M.polished, [0, 0, 0]), [cx(i), y - 0.01, 0])
    add(`engine.pistons.p${i}.rod`, group([box(0.022, 0.12, 0.028, M.steel, [0, -0.06, 0]), mesh(torG(0.03, 0.012, 20, 8), M.steel, [0, -0.125, 0], [0, RX, 0])]), [cx(i), y - 0.02, 0])
  }
  // camshafts + valvetrain
  for (const [k, z] of [['intake', -0.055], ['exhaust', 0.055]] as const) {
    add(`engine.camshafts.${k}`, group([cylX(0.014, 0.6, M.polished), ...[1, 2, 3, 4, 5, 6].flatMap((i) => [-0.018, 0.018].map((d) => mesh(cylG(0.022, 0.012), M.steel, [cx(i) - EX + d, 0.004, 0], [0, 0, RX], [1, 1, 0.75]))), mesh(gearG(0.04, 18, 0.01), M.steel, [0.31, 0, 0], [0, 0, RX])]), [EX, 0.755, z])
  }
  add('engine.camshafts', group([]), [EX, 0.755, 0])
  add('engine.valves', group([]), [EX, 0.70, 0])
  add('engine.springs', group([]), [EX, 0.72, 0])
  const springs: THREE.Object3D[] = []
  for (let i = 1; i <= 6; i++) {
    for (const [k, z] of [['in', -0.045], ['ex', 0.045]] as const) {
      add(`engine.valves.${k}${i}`, group([-0.018, 0.018].flatMap((d) => [cylY(0.003, 0.09, M.polished, [d, 0.045, 0]), cylY(k === 'in' ? 0.016 : 0.014, 0.004, M.steel, [d, 0, 0])])), [cx(i), 0.66, z], [k === 'in' ? 0.2 : -0.2, 0, 0])
      for (const d of [-0.018, 0.018]) springs.push(mesh(springG(0.011, 0.0015, 5, 0.04), M.steel, [cx(i) - EX + d, 0, z], [k === 'in' ? 0.2 : -0.2, 0, 0]))
    }
  }
  add('engine.springs', group(springs), [EX, 0.725, 0])
  // timing drive on the front face
  add('engine.timing', group([]), [1.62, 0.58, 0])
  add('engine.timing.chain', tube([[1.62, 0.37, 0], [1.62, 0.36, 0.05], [1.62, 0.72, 0.1], [1.62, 0.79, 0.055], [1.62, 0.79, -0.055], [1.62, 0.72, -0.1], [1.62, 0.36, -0.05]], 0.006, M.dark, true))
  add('engine.timing.tensioner', group([cylX(0.012, 0.03, M.steel), box(0.012, 0.09, 0.02, M.plastic, [0, -0.05, 0.01])]), [1.62, 0.62, 0.11])
  add('engine.timing.guides', group([box(0.012, 0.3, 0.015, M.plastic, [0, 0, -0.095], [0.12, 0, 0]), box(0.012, 0.12, 0.015, M.plastic, [0, 0.16, 0.0])]), [1.62, 0.55, 0])
  add('engine.sensors', group([]), [1.4, 0.6, 0])
  add('engine.sensors.maf', group([cylX(0.038, 0.05, M.plastic), box(0.03, 0.02, 0.04, M.black, [0, 0.04, 0])]), [1.78, 0.74, -0.36])
  add('engine.sensors.o2', group([[0.05, 0.16], [-0.05, 0.16]].map(([dx, dz]) => group([mesh(hexG(0.009, 0.01), M.steel), cylY(0.006, 0.035, M.ceramic, [0, 0.022, 0])], [dx, 0, dz]))), [1.0, 0.44, 0.12])
  add('engine.sensors.crank', group([cylZ(0.008, 0.03, M.black), box(0.02, 0.015, 0.02, M.black, [0, 0.01, 0.025])]), [0.97, 0.36, 0.05])
}

function drivetrain(c: Ctx) {
  const { add } = c
  add('drivetrain', group([]), [0, 0.37, 0])
  add('drivetrain.converter', group([cylX(0.14, 0.07, M.steel), cylX(0.05, 0.03, M.steel, [0.05, 0, 0])]), [0.96, 0.40, 0])
  add('drivetrain.gearbox.gearsets', group([]), [0.84, 0.37, 0])
  ;[0.94, 0.86, 0.78, 0.70].forEach((x, k) => add(`drivetrain.gearbox.gearsets.g${k + 1}`, group([mesh(gearG(0.085, 36, 0.03), M.steel, [0, 0, 0], [0, 0, RX]), mesh(gearG(0.03, 12, 0.032), M.steel, [0, 0, 0], [0, 0, RX]), ...[0, 1, 2].map((j) => mesh(gearG(0.024, 10, 0.03), M.steel, [0, Math.cos(j * 2.09) * 0.055, Math.sin(j * 2.09) * 0.055], [0, 0, RX]))]), [x, 0.37, 0]))
  add('drivetrain.gearbox.shafts', group([cylX(0.02, 0.5, M.polished), cylX(0.018, 0.12, M.polished, [-0.3, 0, 0])]), [0.83, 0.37, 0])
  add('drivetrain.gearbox.synchros', group([0.98, 0.90, 0.82, 0.74, 0.66].map((x) => mesh(torG(0.06, 0.012, 32, 8), M.dark, [x - 0.83, 0, 0], [0, RX, 0]))), [0.83, 0.37, 0])
  add('drivetrain.driveshaft.ujoint_f', group([cylX(0.055, 0.02, M.rubber), cylX(0.03, 0.05, M.steel)]), [0.56, 0.36, 0])
  add('drivetrain.driveshaft.ujoint_r', group([cylX(0.045, 0.06, M.steel), mesh(torG(0.04, 0.012, 24, 8), M.rubber, [-0.04, 0, 0], [0, RX, 0])]), [-1.08, 0.36, 0])
  add('drivetrain.diff.ringgear', mesh(gearG(0.1, 41, 0.025), M.steel, [0, 0, 0], [RX, 0, 0]), [-1.25, 0.36, 0.03])
  add('drivetrain.diff.pinion', group([mesh(gearG(0.035, 13, 0.03), M.steel, [0, 0, 0], [0, 0, RX]), cylX(0.015, 0.1, M.polished, [0.06, 0, 0])]), [-1.14, 0.36, 0.0])
  add('drivetrain.diff.spider', group([[0, 0.03, 0], [0, -0.03, 0], [0.03, 0, 0], [-0.03, 0, 0]].map((p, k) => mesh(coneG(0.02, 0.02, 12), M.steel, p as V3, k < 2 ? [k ? Math.PI : 0, 0, 0] : [0, 0, k === 2 ? -RX : RX]))), [-1.25, 0.36, 0])
  add('drivetrain.axles.left', cylZ(0.015, 0.42, M.steel, [0, 0, 0]), [-1.25, 0.355, -0.42])
  add('drivetrain.axles.right', cylZ(0.015, 0.42, M.steel, [0, 0, 0]), [-1.25, 0.355, 0.42])
  add('drivetrain.axles.cv', group([-0.2, 0.2, -0.63, 0.63].map((z) => group([cylZ(0.035, 0.06, M.steel), mesh(torG(0.03, 0.008, 20, 8), M.rubber, [0, 0, z > 0 ? 0.04 : -0.04])], [0, 0, z]))), [-1.25, 0.355, 0])
}

function wheels(c: Ctx) {
  for (const w of c.corners) {
    const { id, group: g, axle, side: s, front, brakeCentre } = w
    const A = (pid: string, obj: THREE.Object3D, pos?: V3, rot?: V3) => c.addTo(axle, `${id}.${pid}`, obj, pos, rot)
    const G = (pid: string, obj: THREE.Object3D, pos?: V3, rot?: V3) => c.addTo(g, `${id}.${pid}`, obj, pos, rot)
    // tire sub-parts sit on the tire surface
    A('tire.tread', mesh(torG(0.30, 0.036, 64, 16), M.rubber, [0, 0, 0], [0, 0, 0], [1, 1, 2.3]))
    A('tire.sidewall', group([0.125, -0.125].map((z) => mesh(torG(0.27, 0.02, 64, 10), M.rubber, [0, 0, z], [0, 0, 0], [1, 1, 0.35]))))
    A('tire.bead', group([0.13, -0.13].map((z) => mesh(torG(0.238, 0.007, 48, 8), M.steel, [0, 0, z]))))
    A('lugs', group([]), [0, 0, s * 0.05])
    for (let i = 1; i <= 5; i++) { const a = (i / 5) * Math.PI * 2; A(`lugs.b${i}`, group([mesh(hexG(0.009, 0.02), M.dark, [0, 0, 0], [RX, 0, 0]), cylZ(0.006, 0.03, M.steel, [0, 0, -s * 0.02])]), [Math.cos(a) * 0.056, Math.sin(a) * 0.056, s * 0.05]) }
    A('cap', group([cylZ(0.034, 0.006, M.black), cylZ(0.02, 0.004, M.blue, [0, 0, s * 0.004]), cylZ(0.008, 0.005, M.white, [0, 0, s * 0.005])]), [0, 0, s * 0.145])
    A('valve', cylZ(0.004, 0.03, M.steel, [0, 0, 0]), [Math.cos(0.6) * 0.19, Math.sin(0.6) * 0.19, s * 0.125])
    A('tpms', box(0.02, 0.014, 0.03, M.black, [0, 0, 0]), [Math.cos(0.6) * 0.185, Math.sin(0.6) * 0.185, s * 0.095])
    G('hub', group([cylZ(0.09, 0.03, M.steel), cylZ(0.035, 0.05, M.steel, [0, 0, s * 0.03])]), [0, 0, s * 0.02])
    G('bearing', mesh(torG(0.05, 0.014, 32, 10), M.steel, [0, 0, 0]), [0, 0, -s * 0.02])
    G('abs', group([cylZ(0.008, 0.03, M.black), box(0.015, 0.012, 0.02, M.black, [0, 0, -s * 0.025])]), [0.02, 0.07, -s * 0.06])
    // brake bits around the GLB caliper
    const bc: V3 = [brakeCentre.x - g.position.x, brakeCentre.y - g.position.y, brakeCentre.z - g.position.z]
    G('pads', group([0.022, -0.022].map((z) => box(0.09, 0.05, 0.012, M.dark, [0, 0, z * s]))), bc)
    G('piston', group((front ? [-0.03, 0, 0.03] : [0]).flatMap((dx) => [0.03, -0.03].map((z) => cylZ(0.016, 0.02, M.polished, [dx, 0, z * s])))), bc)
    G('brakeline', tube([[bc[0], bc[1] + 0.02, bc[2]], [bc[0] - 0.05, bc[1] + 0.12, bc[2] - s * 0.08], [bc[0] - 0.1, bc[1] + 0.2, bc[2] - s * 0.2]], 0.005, M.hose))
    if (!front) G('caliper', group([box(0.09, 0.07, 0.05, M.red)]), bc) // rear caliper body (GLB has front-style calipers only on some corners)
  }
}

function suspension(c: Ctx) {
  const { add } = c
  add('suspension', group([]), [0, 0.35, 0])
  add('suspension.springs', group([]), [0, 0.45, 0])
  add('suspension.springs.fl', mesh(springG(0.07, 0.008, 6, 0.22), M.dark), [1.42, 0.52, -0.55])
  add('suspension.springs.fr', mesh(springG(0.07, 0.008, 6, 0.22), M.dark), [1.42, 0.52, 0.55])
  add('suspension.arms', group([]), [0, 0.28, 0])
  add('suspension.balljoints', group([]), [1.45, 0.3, 0])
  for (const [k, z] of [['fl', -0.62], ['fr', 0.62]] as const) add(`suspension.balljoints.${k}`, group([-0.1, 0.1].map((dx) => group([mesh(sphG(0.02), M.steel), cylY(0.022, 0.02, M.rubber, [0, 0.02, 0])], [dx, 0, 0]))), [1.45, 0.30, z])
  add('suspension.bushings', group([]), [0, 0.3, 0])
  add('suspension.bushings.front', group([-0.3, 0.3].map((z) => cylZ(0.02, 0.05, M.rubber, [0, 0, z]))), [1.55, 0.28, 0])
  add('suspension.bushings.rear', group([-1.1, -1.25, -1.4, -1.3, -1.45].flatMap((x) => [-0.3, 0.3].map((z) => cylZ(0.016, 0.04, M.rubber, [x + 1.3, x < -1.35 ? 0.08 : 0, z])))), [-1.3, 0.28, 0])
  add('suspension.column', group([tube([[0.42, 0.87, -0.35], [0.7, 0.62, -0.35], [1.0, 0.45, -0.35], [1.25, 0.28, -0.35]], 0.012, M.steel), mesh(sphG(0.02), M.steel, [0.7, 0.62, -0.35]), mesh(sphG(0.02), M.steel, [1.0, 0.45, -0.35])]))
}

function cooling(c: Ctx) {
  const { add } = c
  add('cooling', group([]), [1.8, 0.5, 0])
  add('cooling.fans', group([]), [1.78, 0.5, 0])
  for (const [k, z] of [['left', -0.2], ['right', 0.2]] as const) add(`cooling.fans.${k}`, group([mesh(torG(0.17, 0.01, 32, 8), M.plastic, [0, 0, 0], [0, RX, 0]), cylX(0.04, 0.05, M.black), ...Array.from({ length: 7 }, (_, i) => mesh(boxG(0.008, 0.11, 0.05), M.plastic, [0, Math.cos(i / 7 * Math.PI * 2) * 0.1, Math.sin(i / 7 * Math.PI * 2) * 0.1], [i / 7 * Math.PI * 2 + 0.6, 0, 0]))]), [1.78, 0.5, z])
  add('cooling.hoses', group([]), [1.75, 0.55, 0])
  add('cooling.hoses.upper', tube([[1.64, 0.68, -0.05], [1.75, 0.72, -0.2], [1.9, 0.68, -0.26]], 0.019, M.hose))
  add('cooling.hoses.lower', tube([[1.66, 0.45, 0.07], [1.78, 0.36, 0.2], [1.9, 0.34, 0.26]], 0.019, M.hose))
  add('cooling.tank', group([box(0.16, 0.14, 0.12, M.white), cylY(0.025, 0.02, M.black, [0, 0.08, 0])]), [1.45, 0.82, 0.5])
  add('cooling.oilcooler', group([-0.35, 0.35].map((z) => box(0.03, 0.18, 0.28, M.alu, [0, 0, z]))), [1.98, 0.30, 0])
}

function fuel(c: Ctx) {
  const { add } = c
  add('fuel.pump', group([cylY(0.04, 0.16, M.black), cylY(0.05, 0.01, M.steel, [0, 0.085, 0])]), [-0.75, 0.33, -0.2])
  add('fuel.filter', cylY(0.03, 0.1, M.white, [0, 0, 0]), [-0.75, 0.33, 0.15])
  add('fuel.lines', tube([[-0.6, 0.26, -0.36], [0.0, 0.24, -0.38], [0.8, 0.28, -0.36], [1.2, 0.5, -0.3], [1.28, 0.7, -0.16]], 0.005, M.steel))
  add('fuel.filler', tube([[-1.15, 0.4, 0.5], [-1.35, 0.55, 0.7], [-1.5, 0.75, 0.86]], 0.023, M.steel))
}

function exhaust(c: Ctx) {
  const { add } = c
  add('exhaust.downpipe', group([1.42, 1.14].map((x) => tube([[x, 0.42, 0.28], [x - 0.15, 0.3, 0.28], [0.75, 0.24, 0.2]], 0.032, M.steel))))
  add('exhaust.cat', group([0.14, -0.06].map((z) => group([cylX(0.06, 0.26, M.steel), mesh(coneG(0.06, 0.05, 20), M.steel, [0.15, 0, 0], [0, 0, -RX])], [0, 0, z]))), [0.5, 0.25, 0])
  add('exhaust.resonator', group([cylX(0.075, 0.36, M.steel), ...[-0.2, 0.2].map((x) => mesh(coneG(0.075, 0.05, 20), M.steel, [x, 0, 0], [0, 0, x > 0 ? -RX : RX]))]), [-0.4, 0.27, 0])
  add('exhaust.muffler', group([box(0.32, 0.17, 0.85, M.polished), ...[-0.3, 0.3].map((z) => cylX(0.03, 0.1, M.steel, [-0.2, 0, z]))]), [-1.9, 0.33, 0])
}

function electrical(c: Ctx) {
  const { add } = c
  add('electrical', group([]), [1.0, 0.7, 0])
  add('electrical.fusebox', group([box(0.18, 0.08, 0.14, M.black), box(0.17, 0.01, 0.13, M.plastic, [0, 0.045, 0])]), [1.05, 0.8, -0.5])
  add('electrical.ecu', group([box(0.3, 0.045, 0.2, M.alu), ...[-0.06, 0, 0.06].map((z) => box(0.04, 0.03, 0.04, M.black, [0.16, 0, z]))]), [0.92, 0.8, 0.5])
  add('electrical.harness', group([
    tube([[0.9, 0.8, 0.45], [1.1, 0.85, 0.2], [1.3, 0.86, -0.1], [1.55, 0.84, -0.2], [1.62, 0.7, -0.25]], 0.009, M.black),
    tube([[0.9, 0.8, 0.4], [1.0, 0.7, 0.3], [1.1, 0.62, 0.3], [1.42, 0.6, 0.32]], 0.007, M.black),
    tube([[1.05, 0.84, -0.45], [1.3, 0.9, -0.3], [1.55, 0.9, -0.05], [1.62, 0.45, -0.22]], 0.007, M.black),
  ]))
  add('electrical.headlights', group([]), [1.9, 0.66, 0])
  for (const [k, z] of [['left', -0.61], ['right', 0.61]] as const) {
    add(`electrical.headlights.${k}.housing`, box(0.12, 0.22, 0.38, M.black, [0, 0, 0]), [1.82, 0.66, z])
    add(`electrical.headlights.${k}.led`, group([box(0.05, 0.05, 0.16, M.alu), ...[-0.05, 0.05].map((dz) => box(0.01, 0.03, 0.03, M.led, [0.03, 0, dz])), box(0.03, 0.04, 0.04, M.black, [-0.04, 0, 0])]), [1.88, 0.66, z])
  }
  add('electrical.horn', group([-0.3, 0.3].map((z) => group([cylX(0.045, 0.02, M.black), mesh(coneG(0.03, 0.03, 12), M.dark, [0.02, 0, 0], [0, 0, -RX])], [0, 0, z]))), [2.0, 0.42, 0])
  add('electrical.sensors', group([]), [1.0, 0.8, 0])
  add('electrical.sensors.camera', group([box(0.06, 0.04, 0.08, M.black), cylX(0.012, 0.01, M.glass, [0.035, 0, 0])]), [0.68, 1.22, 0])
  add('electrical.sensors.radar', box(0.03, 0.09, 0.12, M.black, [0, 0, 0]), [2.16, 0.34, 0])
  add('electrical.sensors.parking', group([-0.6, -0.36, -0.12, 0.12, 0.36, 0.6].flatMap((z) => [cylX(0.01, 0.012, M.dark, [2.235, 0.46, z * 1.1]), cylX(0.01, 0.012, M.dark, [-2.265, 0.5, z * 1.1])])))
}

function body(c: Ctx) {
  const { add } = c
  add('body.hood.hinges', group([-0.62, 0.62].map((z) => group([box(0.12, 0.02, 0.03, M.steel, [-0.06, 0, 0]), cylZ(0.012, 0.04, M.steel)], [0, 0, z]))), [0.62, 0.93, 0])
  add('body.hood.latch', group([box(0.06, 0.05, 0.1, M.steel), cylY(0.008, 0.05, M.steel, [0, 0.035, 0])]), [2.01, 0.75, 0])
  add('body.trunk.spoiler', box(0.12, 0.025, 1.1, M.carbon, [0, 0, 0], [0, 0, 0.35]), [-2.12, 1.06, 0])
  add('body.trunk.hinges', group([-0.45, 0.45].map((z) => group([tube([[0, 0, 0], [-0.15, -0.05, 0], [-0.25, -0.2, 0]], 0.01, M.steel)], [0, 0, z]))), [-1.85, 1.03, 0])
  add('body.doors', group([]), [0.05, 0.75, 0])
  for (const [k, z] of [['left', -0.66], ['right', 0.66]] as const) {
    const s = Math.sign(z)
    add(`body.doors.${k}.inner`, group([box(1.0, 0.5, 0.015, M.dark), box(0.95, 0.04, 0.03, M.steel, [0, 0.05, 0])]), [0.05, 0.72, z - s * 0.05])
    add(`body.doors.${k}.regulator`, group([box(0.02, 0.36, 0.02, M.steel, [0.15, 0, 0]), box(0.02, 0.36, 0.02, M.steel, [-0.15, 0, 0]), box(0.08, 0.06, 0.03, M.black, [0, -0.12, 0]), box(0.5, 0.02, 0.01, M.steel, [0, 0.18, 0])]), [0.05, 0.74, z - s * 0.035])
    add(`body.doors.${k}.latch`, box(0.05, 0.08, 0.03, M.steel, [0, 0, 0]), [-0.58, 0.7, z - s * 0.03])
    add(`body.doors.${k}.hinges`, group([0.15, -0.15].map((dy) => cylY(0.012, 0.06, M.steel, [0, dy, 0]))), [0.72, 0.72, z + s * 0.02])
  }
  add('body.pillars', group(([-1, 1] as const).flatMap((s) => [
    tube([[0.86, 0.95, s * 0.58], [0.30, 1.19, s * 0.43]], 0.015, M.dark),
    tube([[-0.55, 0.93, s * 0.60], [-0.58, 1.20, s * 0.45]], 0.015, M.dark),
    tube([[-1.02, 1.19, s * 0.43], [-1.66, 0.97, s * 0.56]], 0.015, M.dark),
  ])))
  add('body.wipers', group([]), [0.92, 0.98, 0])
  add('body.wipers.blades', group([[-0.25, 0.65], [0.35, 0.48]].map(([z, len]) => group([box(0.015, 0.01, len, M.rubber, [0, 0, 0]), box(0.01, 0.02, len * 0.9, M.black, [0, 0.01, 0])], [0, 0, z], [0, 0.35, 0]))), [0.92, 0.985, 0])
  add('body.wipers.motor', group([cylZ(0.04, 0.06, M.black), box(0.05, 0.03, 0.08, M.black, [0, -0.03, 0])]), [0.98, 0.9, 0.1])
}

function interior(c: Ctx) {
  const { add } = c
  add('interior.seats', group([]), [-0.13, 0.75, 0])
  for (const [k, z] of [['left', -0.33], ['right', 0.35]] as const) {
    const id = `interior.seats.${k}`
    add(`${id}.headrest`, box(0.07, 0.14, 0.2, M.fabric, [0, 0, 0], [0, 0, 0.2]), [-0.42, 1.08, z])
    add(`${id}.belt`, group([box(0.03, 0.55, 0.005, M.black, [0, 0, 0], [0.5, 0, 0]), box(0.05, 0.03, 0.03, M.steel, [0, -0.28, 0.14])]), [-0.2, 0.75, z])
  }
  add('interior.carpet', box(2.3, 0.01, 1.4, M.fabric, [0, 0, 0]), [-0.2, 0.31, 0])
  add('interior.headliner', box(1.24, 0.008, 0.86, M.fabric, [0, 0, 0]), [-0.42, 1.205, 0])
  add('interior.mirror', group([box(0.02, 0.06, 0.24, M.black), box(0.01, 0.05, 0.22, M.polished, [-0.012, 0, 0]), cylY(0.008, 0.06, M.black, [0.02, 0.05, 0])]), [0.45, 1.18, 0])
  // curtain rails run under the roof edge (roof: x -1.10..0.26, z ±0.50, underside y 1.23), thorax bags in the seat bolsters
  add('interior.airbags', group([...[-0.43, 0.43].map((z) => box(1.45, 0.025, 0.04, M.plastic, [0, 0, z])), ...[-0.42, 0.42].map((z) => box(0.05, 0.22, 0.035, M.plastic, [-0.28, -0.42, z]))]), [-0.38, 1.19, 0])
}

function chassis(c: Ctx) {
  const { add } = c
  add('chassis', group([]), [0, 0.3, 0])
  add('chassis.crossmembers', group([-0.3, 0.6].map((x) => box(0.06, 0.04, 1.4, M.alu, [x, 0, 0]))), [0, 0.2, 0])
}

export const BUILDERS: Record<string, (c: Ctx) => void> = { engine, drivetrain, wheels, suspension, cooling, fuel, exhaust, electrical, body, interior, chassis }
