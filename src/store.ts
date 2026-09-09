import { create } from 'zustand'
import type { Object3D } from 'three'

export type Finish = 'gloss' | 'satin' | 'matte' | 'metallic'
export type Rim = 'silver' | 'gunmetal' | 'black'
export type Env = 'studio' | 'sunset' | 'night' | 'city'
export type View = 'home' | 'front' | 'side' | 'rear' | 'top' | 'wheel' | 'interior'
export type Mode = 'exterior' | 'interior' | 'engine' | 'chassis' | 'xray'
export type Scope = 'car' | 'engine' | 'wheel'
export type Vec3 = [number, number, number]
export type Goal = { pos: Vec3; target: Vec3 }

export type Config = {
  paint: string
  finish: Finish
  rim: Rim
  rimColor: string
  tint: number // 0..1
  trim: string
  ride: number // metres, -0.06..0.06
  wheel: number // scale, 0.9..1.15
  lights: boolean
  env: Env
  explode: number // 0..1
  scope: Scope
  caliper: string
  ambient: string // cabin ambient light colour, 'off' disables
}

export const DEFAULT: Config = {
  paint: '#0f5c8c', finish: 'metallic', rim: 'silver', rimColor: '#c9c9cf', tint: 0.35,
  trim: '#1c1c1f', ride: 0, wheel: 1, lights: false, env: 'studio', explode: 0, scope: 'car', caliper: '#c8102e', ambient: 'off',
}
const CONFIG_KEYS = Object.keys(DEFAULT) as (keyof Config)[]
export const FINISHES: Finish[] = ['gloss', 'satin', 'matte', 'metallic']
export const PAINTS: { name: string; hex: string }[] = [
  { name: 'Portimao Blue', hex: '#0f5c8c' }, { name: 'Toronto Red', hex: '#b0121b' }, { name: 'Sao Paulo Yellow', hex: '#e4c400' }, { name: 'Isle of Man Green', hex: '#1f5f3f' },
  { name: 'Alpine White', hex: '#e9e9e7' }, { name: 'Black Sapphire', hex: '#0b0c10' }, { name: 'Brooklyn Grey', hex: '#6d7178' }, { name: 'Tanzanite Blue', hex: '#22243a' },
  { name: 'Fire Red', hex: '#c8102e' }, { name: 'Frozen Deep Green', hex: '#2e3d34' },
]
export const CALIPERS = ['#c8102e', '#e4c400', '#1a1a1c', '#1a4d9a']
export const AMBIENTS = ['off', '#ff7a1a', '#2f7bff', '#ff2a5a', '#7cffb2', '#ffffff']
export const PRICE = { base: 139900, finish: { gloss: 0, satin: 4200, matte: 3600, metallic: 1950 } as Record<Finish, number>, rim: { silver: 0, gunmetal: 1300, black: 1300 } as Record<Rim, number>, wheelUp: 2400, tint: 650, caliper: 750, ambient: 300 }
export function priceOf(c: Config) {
  const lines: [string, number][] = [['M4 CSL', PRICE.base]]
  if (PRICE.finish[c.finish]) lines.push([`${c.finish} finish`, PRICE.finish[c.finish]])
  if (PRICE.rim[c.rim]) lines.push([`${c.rim} wheels`, PRICE.rim[c.rim]])
  if (c.wheel > 1) lines.push(['Larger wheels', PRICE.wheelUp])
  if (c.tint > 0.6) lines.push(['Privacy glass', PRICE.tint])
  if (c.caliper !== DEFAULT.caliper) lines.push(['Coloured calipers', PRICE.caliper])
  if (c.ambient !== 'off') lines.push(['Ambient lighting', PRICE.ambient])
  return { lines, total: lines.reduce((a, [, v]) => a + v, 0) }
}
export const RIMS: Rim[] = ['silver', 'gunmetal', 'black']
export const RIM_HEX: Record<Rim, string> = { silver: '#c9c9cf', gunmetal: '#3a3d42', black: '#111114' }
export const ENVS: Env[] = ['studio', 'sunset', 'night', 'city']
export const MODES: { id: Mode; label: string }[] = [
  { id: 'exterior', label: 'Exterior' }, { id: 'interior', label: 'Interior' }, { id: 'engine', label: 'Engine' }, { id: 'chassis', label: 'Chassis' }, { id: 'xray', label: 'X-ray' },
]

export const WHEEL_R = 0.335
/** world Y of the body group: ride height + wheel-diameter compensation */
export const bodyY = (c: Pick<Config, 'ride' | 'wheel'>) => c.ride + (c.wheel - 1) * WHEEL_R

// car: nose at +X, driver (left) side at -Z, wheels at x=1.45 / -1.25, z=±0.74
export const PRESETS: Record<View, (c: Config) => Goal> = {
  home: () => ({ pos: [4.4, 1.4, -4.3], target: [0.1, 0.55, 0] }),
  front: () => ({ pos: [5.6, 1.2, -1.2], target: [0.2, 0.5, 0] }),
  side: () => ({ pos: [0.1, 1.0, -6.4], target: [0.1, 0.55, 0] }),
  rear: () => ({ pos: [-5.6, 1.4, 1.3], target: [-0.2, 0.55, 0] }),
  top: () => ({ pos: [0.3, 9, 0.01], target: [0.1, 0, 0] }),
  wheel: (c) => ({ pos: [2.7, 0.5, -2.4], target: [1.45, WHEEL_R * c.wheel, -0.74] }),
  interior: (c) => { const y = bodyY(c) + 1.06; return { pos: [-0.16, y, -0.31], target: [3, y - 0.28, -0.33] } },
}
export const MODE_GOALS: Record<Mode, (c: Config) => Goal> = {
  exterior: PRESETS.home,
  interior: PRESETS.interior,
  engine: () => ({ pos: [3.4, 2.0, -1.9], target: [1.35, 0.75, 0] }),
  chassis: () => ({ pos: [3.6, -1.6, -3.2], target: [0.2, 0.35, 0] }),
  xray: () => ({ pos: [4.0, 1.5, -3.6], target: [0.1, 0.6, 0] }),
}

export const SCOPE_PARTS: Record<Scope, string[] | null> = { car: null, engine: ['engine', 'enginebay', 'intake', 'strutbrace_F', 'radiator', 'radsupport', 'intercooler', 'battery'], wheel: ['wheel0'] }
/** parts that live under the hood: selecting one opens it */
export const underHood = (id: string) => /^(engine|cooling|electrical\.(fusebox|ecu|harness)|chassis\.strutbrace)/.test(id)
export const parentOf = (id: string) => (id.includes('.') ? id.slice(0, id.lastIndexOf('.')) : 'car')

type State = Config & {
  view: View
  mode: Mode
  goal: Goal | null
  flying: boolean
  part: string | null      // selected part id
  level: string            // parent whose children the bottom bar shows
  context: boolean         // show the rest of the car ghosted (true) or hide it (false)
  asmExplode: number       // explode slider for the selected assembly
  query: string
  configOpen: boolean
  hover: string | null
  hoverId: string | null
  sel: Object3D[]
  hoverSel: Object3D[]
  doorOpen: boolean
  hoodOpen: boolean
  trunkOpen: boolean
  panelOpen: boolean
  drive: boolean
  hazards: boolean
  dims: boolean
  tour: boolean
  hideUi: boolean
  summary: boolean
  set: (p: Partial<State>) => void
  flyTo: (view: View) => void
  setMode: (mode: Mode) => void
  selectPart: (id: string | null) => void
  openLevel: (id: string) => void
  back: () => void
  reset: () => void
}

const HEX = /^[0-9a-f]{6}$/i
function fromUrl(): Partial<Config> & Partial<Pick<State, 'mode' | 'view' | 'part' | 'doorOpen' | 'trunkOpen' | 'hoodOpen' | 'dims' | 'hazards'>> {
  const p = new URLSearchParams(location.hash.slice(1) + '&' + location.search.slice(1))
  const out: ReturnType<typeof fromUrl> = {}
  const hex = (k: 'paint' | 'rimColor' | 'trim' | 'caliper') => { const v = p.get(k); if (v && HEX.test(v)) out[k] = '#' + v.toLowerCase() }
  const num = (k: 'tint' | 'ride' | 'wheel' | 'explode', min: number, max: number) => {
    const v = Number(p.get(k)); if (p.has(k) && Number.isFinite(v)) out[k] = Math.min(max, Math.max(min, v))
  }
  const one = <K extends 'finish' | 'rim' | 'env' | 'scope' | 'mode' | 'view'>(k: K, list: readonly NonNullable<ReturnType<typeof fromUrl>[K]>[]) => {
    const v = p.get(k) as NonNullable<ReturnType<typeof fromUrl>[K]> | null; if (v && list.includes(v)) out[k] = v
  }
  hex('paint'); hex('rimColor'); hex('trim'); hex('caliper')
  if (p.get('ambient') === 'off') out.ambient = 'off'; else if (p.get('ambient') && HEX.test(p.get('ambient')!)) out.ambient = '#' + p.get('ambient')!.toLowerCase()
  num('tint', 0, 1); num('ride', -0.06, 0.06); num('wheel', 0.9, 1.15); num('explode', 0, 1)
  one('finish', FINISHES); one('rim', RIMS); one('env', ENVS); one('scope', ['car', 'engine', 'wheel'])
  one('mode', MODES.map((m) => m.id)); one('view', Object.keys(PRESETS) as View[])
  if (p.has('lights')) out.lights = p.get('lights') === '1'
  if (p.get('part')) out.part = p.get('part')!
  if (p.get('door') === '1') out.doorOpen = true
  if (p.get('trunk') === '1') out.trunkOpen = true
  if (p.get('hood') === '1') out.hoodOpen = true
  if (p.get('dims') === '1') out.dims = true
  if (p.get('hazards') === '1') out.hazards = true
  return out
}

export function toHash(c: Config) {
  const p = new URLSearchParams()
  for (const k of CONFIG_KEYS) {
    const v = c[k]
    if (v === DEFAULT[k]) continue
    p.set(k, typeof v === 'boolean' ? (v ? '1' : '0') : typeof v === 'number' ? String(+v.toFixed(3)) : String(v).replace('#', ''))
  }
  return p.toString()
}

const init = fromUrl()
export const useStore = create<State>((set, get) => ({
  ...DEFAULT,
  ...init,
  view: init.view ?? (init.mode === 'interior' ? 'interior' : 'home'),
  mode: init.mode ?? 'exterior',
  goal: init.mode ? MODE_GOALS[init.mode]({ ...DEFAULT, ...init }) : init.view ? PRESETS[init.view]({ ...DEFAULT, ...init }) : null,
  flying: !!(init.mode || init.view),
  part: init.part ?? null,
  level: init.part ? parentOf(init.part) : 'car',
  context: true,
  asmExplode: 0,
  query: '',
  configOpen: false,
  hover: null,
  hoverId: null,
  sel: [],
  hoverSel: [],
  doorOpen: init.doorOpen ?? false,
  hoodOpen: init.hoodOpen ?? init.mode === 'engine',
  trunkOpen: init.trunkOpen ?? false,
  panelOpen: window.innerWidth >= 768,
  drive: false,
  hazards: init.hazards ?? false,
  dims: init.dims ?? false,
  tour: false,
  hideUi: false,
  summary: false,
  set,
  flyTo: (view) => set({ view, mode: view === 'interior' ? 'interior' : get().mode === 'interior' ? 'exterior' : get().mode, goal: PRESETS[view](get()), flying: true }),
  setMode: (mode) => set({ mode, view: mode === 'interior' ? 'interior' : 'home', goal: MODE_GOALS[mode](get()), flying: true, part: null, asmExplode: 0, hoodOpen: mode === 'engine', level: mode === 'engine' ? 'engine' : mode === 'chassis' ? 'chassis' : mode === 'interior' ? 'interior' : get().level }),
  selectPart: (part) => set({ part, asmExplode: 0, explode: 0, ...(part && underHood(part) ? { hoodOpen: true } : {}), ...(part ? { level: parentOf(part) } : {}) }),
  openLevel: (id) => set({ level: id, part: id, asmExplode: 0, ...(underHood(id) ? { hoodOpen: true } : {}) }),
  back: () => { const l = parentOf(get().level); set({ level: l, part: l === 'car' ? null : l, asmExplode: 0 }) },
  reset: () => set({ ...DEFAULT, part: null, level: 'car', asmExplode: 0, doorOpen: false, hoodOpen: get().mode === 'engine', trunkOpen: false }),
}))

// keep the URL hash in sync so a reload restores the build
useStore.subscribe((s) => {
  const h = toHash(s)
  if (location.hash.slice(1) !== h) history.replaceState(null, '', h ? '#' + h : location.pathname + location.search)
})
