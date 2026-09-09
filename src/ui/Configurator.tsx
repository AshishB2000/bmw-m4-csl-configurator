import { useState } from 'react'
import { AMBIENTS, CALIPERS, ENVS, FINISHES, PAINTS, RIMS, RIM_HEX, priceOf, useStore, type Config, type Scope, type View } from '../store'
import { screenshot } from '../scene/Scene'

const TRIMS = ['#1c1c1f', '#7a1f1f', '#a88b62', '#d9d6ce', '#1d3557']
const VIEWS: { id: View; label: string }[] = [
  { id: 'home', label: 'Hero' }, { id: 'front', label: 'Front' }, { id: 'side', label: 'Side' }, { id: 'rear', label: 'Rear' },
  { id: 'top', label: 'Top' }, { id: 'wheel', label: 'Wheel' }, { id: 'interior', label: 'Interior' },
]

function Label({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-baseline justify-between">
      <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-zinc-500">{children}</span>
      {right && <span className="text-[11px] tabular-nums text-zinc-400">{right}</span>}
    </div>
  )
}
function Swatches({ colors, value, onChange, custom }: { colors: { hex: string; name?: string }[]; value: string; onChange: (c: string) => void; custom?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {colors.map((c) => (
        <button
          key={c.hex} onClick={() => onChange(c.hex)} aria-label={c.name ?? c.hex} title={c.name ?? c.hex}
          style={{ background: c.hex === 'off' ? 'transparent' : c.hex }}
          className={`h-7 w-7 rounded-full ring-2 ring-offset-2 ring-offset-zinc-950 transition ${c.hex === 'off' ? 'border border-dashed border-zinc-500' : 'border border-white/15'} ${value === c.hex ? 'ring-white scale-110' : 'ring-transparent hover:ring-white/40'}`}
        />
      ))}
      {custom && (
        <label className="relative h-7 w-7 overflow-hidden rounded-full ring-2 ring-offset-2 ring-offset-zinc-950 ring-transparent hover:ring-white/40" title="Custom colour">
          <span className="absolute inset-0 rounded-full bg-[conic-gradient(red,yellow,lime,cyan,blue,magenta,red)]" />
          <input type="color" value={value.startsWith('#') ? value : '#ffffff'} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 h-full w-full opacity-0" />
        </label>
      )}
    </div>
  )
}
function Segmented<T extends string>({ options, value, onChange }: { options: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-lg bg-white/5 p-1">
      {options.map((o) => (
        <button
          key={o} onClick={() => onChange(o)}
          className={`rounded-md px-2 py-1.5 text-xs capitalize transition ${value === o ? 'bg-white text-black shadow' : 'text-zinc-300 hover:bg-white/10'}`}
        >{o}</button>
      ))}
    </div>
  )
}
function Slider({ k, min, max, step, fmt }: { k: 'tint' | 'ride' | 'wheel' | 'explode'; min: number; max: number; step: number; fmt: (v: number) => string }) {
  const v = useStore((s) => s[k])
  const set = useStore((s) => s.set)
  return (
    <>
      <Label right={fmt(v)}>{{ tint: 'Window tint', ride: 'Ride height', wheel: 'Wheel size', explode: 'Exploded view' }[k]}</Label>
      <input type="range" min={min} max={max} step={step} value={v} onChange={(e) => set({ [k]: Number(e.target.value) } as Partial<Config>)} />
    </>
  )
}
function Toggle({ on, onChange, label, hint }: { on: boolean; onChange: () => void; label: string; hint?: string }) {
  return (
    <button onClick={onChange} title={hint} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-xs text-zinc-200 hover:bg-white/10">
      <span>{label}{hint && <kbd className="ml-1.5 rounded border border-white/15 px-1 text-[9px] text-zinc-500">{hint}</kbd>}</span>
      <span className={`relative h-5 w-9 rounded-full transition ${on ? 'bg-white' : 'bg-white/15'}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full transition ${on ? 'left-[18px] bg-black' : 'left-0.5 bg-zinc-300'}`} />
      </span>
    </button>
  )
}

const VIEW_ICON: Record<View, string> = { home: '\u25C6', front: '\u25B2', side: '\u25AE', rear: '\u25BC', top: '\u25A0', wheel: '\u25CE', interior: '\u2302' }

/** Camera presets — tertiary chrome. Desktop: quiet vertical rail on the left edge. Mobile: one button that opens a sheet. */
export function Presets() {
  const view = useStore((s) => s.view)
  const flyTo = useStore((s) => s.flyTo)
  return (
    <>
      <div data-ui="presets" data-box className="glass r-lg pointer-events-auto absolute left-[var(--edge)] top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-0.5 p-1.5 md:flex">
        <div className="px-2 pb-1 pt-0.5 text-[9px] uppercase tracking-[0.18em] text-zinc-600">View</div>
        {VIEWS.map((v) => (
          <button
            key={v.id} onClick={() => flyTo(v.id)} title={v.label}
            className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] transition ${view === v.id ? 'bg-white/15 text-white' : 'text-zinc-500 hover:bg-white/10 hover:text-zinc-200'}`}
          >
            <span className="w-3 text-center text-[10px] leading-none opacity-70">{VIEW_ICON[v.id]}</span>
            {v.label}
          </button>
        ))}
      </div>

    </>
  )
}

/** Mobile: one button (lives in the parts-rail header) that opens a full-width sheet of camera views. */
export function PresetsButton() {
  const view = useStore((st) => st.view)
  const flyTo = useStore((st) => st.flyTo)
  const [sheet, setSheet] = useState(false)
  return (
    <>
      <button
        onClick={() => setSheet(true)} data-ui="presets-btn"
        className="shrink-0 rounded-full border border-white/15 px-2 py-0.5 text-[11px] text-zinc-300 hover:bg-white/10 md:hidden"
      >{VIEW_ICON[view]} {VIEWS.find((v) => v.id === view)?.label ?? 'View'}</button>

      {sheet && (
        <div className="fixed inset-0 z-50 bg-black/50 md:hidden" onClick={() => setSheet(false)}>
          <div data-ui="presets-sheet" className="glass fade-in absolute inset-x-3 bottom-3 rounded-2xl p-2" onClick={(e) => e.stopPropagation()}>
            <div className="px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-zinc-500">Camera view</div>
            <div className="grid grid-cols-2 gap-1">
              {VIEWS.map((v) => (
                <button
                  key={v.id} onClick={() => { flyTo(v.id); setSheet(false) }}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition ${view === v.id ? 'bg-white text-black' : 'text-zinc-300 hover:bg-white/10'}`}
                ><span className="opacity-70">{VIEW_ICON[v.id]}</span>{v.label}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export function Configurator() {
  const s = useStore()
  const [toast, setToast] = useState('')
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(''), 1800) }
  const share = async () => {
    try { await navigator.clipboard.writeText(location.href); flash('Link copied') } catch { flash(location.href) }
  }
  const { total } = priceOf(s)
  const paintName = PAINTS.find((p) => p.hex === s.paint)?.name ?? s.paint

  return (
    <aside
      data-ui="panel" data-box
      className={`glass fade-in fixed inset-x-0 bottom-0 z-40 flex flex-col rounded-t-2xl transition-[max-height] duration-500 ease-out
        md:inset-auto md:right-[var(--edge)] md:top-[76px] md:bottom-[calc(var(--rail-h)+16px)] md:w-[340px] md:rounded-2xl ${s.panelOpen ? 'max-h-[70vh] md:max-h-none' : 'max-h-[150px] md:max-h-none'}`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <button className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-white/25 md:hidden" onClick={() => s.set({ panelOpen: !s.panelOpen })} aria-label="Toggle panel" />
      <header className="flex items-center justify-between px-5 pt-3 pb-2" onClick={() => window.innerWidth < 768 && s.set({ panelOpen: !s.panelOpen })}>
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">BMW</div>
          <div className="text-lg font-semibold tracking-tight">M4 CSL</div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); s.set({ summary: true }) }} className="text-right hover:opacity-80" title="Build summary">
          <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Your build</div>
          <div className="text-base font-medium tabular-nums">${total.toLocaleString()}</div>
        </button>
      </header>

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 pb-5 pt-2 [scrollbar-width:thin]">
        <section>
          <Label right={paintName}>Paint</Label>
          <Swatches colors={PAINTS} value={s.paint} onChange={(paint) => s.set({ paint })} custom />
          <div className="mt-3"><Segmented options={FINISHES} value={s.finish} onChange={(finish) => s.set({ finish })} /></div>
        </section>
        <section>
          <Label>Wheels</Label>
          <Segmented options={RIMS} value={s.rim} onChange={(rim) => s.set({ rim, rimColor: RIM_HEX[rim] })} />
          <div className="mt-3"><Swatches colors={Object.values(RIM_HEX).map((hex) => ({ hex }))} value={s.rimColor} onChange={(rimColor) => s.set({ rimColor })} custom /></div>
        </section>
        <section>
          <Label>Brake calipers</Label>
          <Swatches colors={CALIPERS.map((hex) => ({ hex }))} value={s.caliper} onChange={(caliper) => s.set({ caliper })} custom />
        </section>
        <section><Slider k="tint" min={0} max={1} step={0.01} fmt={(v) => `${Math.round(v * 100)}%`} /></section>
        <section>
          <Label>Interior trim</Label>
          <Swatches colors={TRIMS.map((hex) => ({ hex }))} value={s.trim} onChange={(trim) => s.set({ trim })} custom />
        </section>
        <section>
          <Label>Ambient lighting</Label>
          <Swatches colors={AMBIENTS.map((hex) => ({ hex, name: hex === 'off' ? 'Off' : hex }))} value={s.ambient} onChange={(ambient) => s.set({ ambient })} />
        </section>
        <section className="space-y-4">
          <div><Slider k="ride" min={-0.06} max={0.06} step={0.005} fmt={(v) => `${v >= 0 ? '+' : ''}${Math.round(v * 100)} cm`} /></div>
          <div><Slider k="wheel" min={0.9} max={1.15} step={0.01} fmt={(v) => `${Math.round(19 + (v - 1) * 20)}"`} /></div>
        </section>
        <section>
          <Label>Body & lights</Label>
          <div className="grid grid-cols-2 gap-2">
            <Toggle label="Driver door" hint="D" on={s.doorOpen} onChange={() => s.set({ doorOpen: !s.doorOpen })} />
            <Toggle label="Hood" hint="H" on={s.hoodOpen} onChange={() => s.set({ hoodOpen: !s.hoodOpen })} />
            <Toggle label="Trunk" hint="T" on={s.trunkOpen} onChange={() => s.set({ trunkOpen: !s.trunkOpen })} />
            <Toggle label="Lights" hint="L" on={s.lights} onChange={() => s.set({ lights: !s.lights })} />
            <Toggle label="Hazards" on={s.hazards} onChange={() => s.set({ hazards: !s.hazards })} />
            <Toggle label="Drive" hint="V" on={s.drive} onChange={() => s.set({ drive: !s.drive })} />
            <Toggle label="Dimensions" hint="M" on={s.dims} onChange={() => s.set({ dims: !s.dims })} />
            <Toggle label="Tour" hint="Space" on={s.tour} onChange={() => s.set({ tour: !s.tour })} />
          </div>
        </section>
        <section>
          <Label>Environment</Label>
          <Segmented options={ENVS} value={s.env} onChange={(env) => s.set({ env })} />
        </section>
        <section>
          <Slider k="explode" min={0} max={1} step={0.01} fmt={(v) => `${Math.round(v * 100)}%`} />
          <div className="mt-2"><Segmented options={['car', 'engine', 'wheel'] as Scope[]} value={s.scope} onChange={(scope) => s.set({ scope })} /></div>
        </section>
        <section className="grid grid-cols-2 gap-2 pt-1">
          <button onClick={s.reset} className="rounded-lg border border-white/10 px-2 py-2 text-xs text-zinc-300 hover:bg-white/10">Reset</button>
          <button onClick={share} className="rounded-lg border border-white/10 px-2 py-2 text-xs text-zinc-300 hover:bg-white/10">Share link</button>
          <button onClick={() => s.set({ hideUi: true })} className="rounded-lg border border-white/10 px-2 py-2 text-xs text-zinc-300 hover:bg-white/10">Photo mode <kbd className="ml-1 rounded border border-white/15 px-1 text-[9px] text-zinc-500">P</kbd></button>
          <button onClick={screenshot} className="rounded-lg bg-white px-2 py-2 text-xs font-medium text-black hover:bg-zinc-200">Screenshot</button>
        </section>
      </div>
      {toast && <div className="fade-in absolute bottom-20 left-1/2 -translate-x-1/2 rounded-full bg-white px-3 py-1.5 text-xs text-black shadow-lg md:bottom-4">{toast}</div>}
    </aside>
  )
}
