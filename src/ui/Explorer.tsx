import { useEffect, useMemo, useRef, useState } from 'react'
import { BY_ID, CHILDREN, PARTS, descendants, pathOf, type Part } from '../data/parts'
import { parentOf, useStore } from '../store'
import { PresetsButton } from './Configurator'
import { useThumb } from './thumbs'

function Card({ part, active }: { part: Part; active: boolean }) {
  const url = useThumb(part.id)
  const kids = CHILDREN[part.id]?.length ?? 0
  const s = useStore()
  return (
    <button
      onClick={() => s.selectPart(part.id)}
      onDoubleClick={() => kids && s.openLevel(part.id)}
      title={kids ? `${part.name} · double-click to open` : part.name}
      className={`group flex w-[124px] shrink-0 flex-col overflow-hidden rounded-xl border text-left transition ${active ? 'border-white bg-white/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
    >
      <div className="relative h-[84px] w-full bg-[radial-gradient(circle_at_50%_40%,#2a2c33,#0c0d10)]">
        {url ? <img src={url} alt="" className="h-full w-full object-contain" draggable={false} /> : <div className="grid h-full place-items-center text-[10px] text-zinc-600">…</div>}
        {kids > 0 && <span className="absolute right-1.5 top-1.5 rounded-full bg-black/70 px-1.5 py-0.5 text-[9px] text-zinc-300">{kids}</span>}
      </div>
      <div className="px-2 py-1.5">
        <div className="truncate text-[11px] font-medium text-zinc-100">{part.name}</div>
        <div className="truncate text-[9px] text-zinc-500">{part.spec.split('·')[0].trim() || part.material.split(',')[0]}</div>
      </div>
    </button>
  )
}

export function BottomBar() {
  const level = useStore((s) => s.level)
  const part = useStore((s) => s.part)
  const s = useStore()
  const kids = CHILDREN[level] ?? []
  const crumbs = pathOf(level)
  const total = useMemo(() => (level === 'car' ? 0 : descendants(level).reduce((a, p) => a + (p.price ?? 0), 0)), [level])
  const row = useRef<HTMLDivElement>(null)
  const shell = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(true)
  const [credits, setCredits] = useState(false)
  const configOpen = useStore((st) => st.configOpen)
  useEffect(() => { row.current?.scrollTo({ left: 0 }) }, [level])
  // publish the rail height so the right-hand panels and the hint toast can sit clear of it
  useEffect(() => {
    const el = shell.current
    if (!el) return
    const set = () => document.documentElement.style.setProperty('--rail-h', `${Math.round(el.getBoundingClientRect().height)}px`)
    set()
    const ro = new ResizeObserver(set)
    ro.observe(el)
    return () => { ro.disconnect(); document.documentElement.style.setProperty('--rail-h', '0px') }
  }, [])

  return (
    <div className={`pointer-events-none absolute inset-x-0 bottom-0 z-30 px-[var(--edge)] ${configOpen ? 'hidden md:block' : ''}`}>
      <div ref={shell} data-ui="rail" data-box className="glass pointer-events-auto mx-auto max-w-[1180px] rounded-t-2xl" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <button className="mx-auto mt-1.5 mb-0.5 block h-1 w-10 rounded-full bg-white/25 md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Toggle parts rail" />

        <div className="flex items-center gap-3 px-4 pb-2 pt-2 text-[11px] md:pt-3">
          {/* breadcrumb */}
          <div className="flex min-w-0 shrink items-center gap-1">
            <PresetsButton />
            {level !== 'car' && <button onClick={s.back} data-ui="back" className="mr-1 shrink-0 rounded-full border border-white/15 px-2 py-0.5 text-zinc-300 hover:bg-white/10">← Back</button>}
            <div data-ui="crumbs" className="flex min-w-0 items-center gap-1 overflow-hidden">
              {crumbs.map((c, i) => (
                <span key={c.id} className="flex shrink-0 items-center gap-1">
                  {i > 0 && <span className="text-zinc-600">/</span>}
                  <button onClick={() => (c.id === 'car' ? s.set({ level: 'car', part: null }) : s.openLevel(c.id))} className={`truncate rounded px-1 ${i === crumbs.length - 1 ? 'text-white' : 'text-zinc-400 hover:text-white'}`}>{c.name}</button>
                </span>
              ))}
            </div>
          </div>
          {/* search */}
          <div data-ui="search" className="hidden flex-1 justify-center sm:flex"><SearchBox /></div>
          {/* count + credits */}
          <div className="ml-auto flex shrink-0 items-center gap-2 text-zinc-500">
            <span className="hidden lg:inline">{kids.length} parts{total ? ` · $${total.toLocaleString()}` : ''} · click to inspect</span>
            <span className="lg:hidden">{kids.length} parts</span>
            <div className="relative">
              <button onClick={() => setCredits((c) => !c)} className="grid h-5 w-5 place-items-center rounded-full border border-white/15 text-[10px] text-zinc-500 hover:bg-white/10 hover:text-zinc-200" aria-label="Credits">i</button>
              {credits && (
                <div className="glass r-md absolute bottom-7 right-0 w-[260px] p-3 text-[10px] leading-relaxed text-zinc-400">
                  Model: “BMW M4 CSL 2023” by Black Snow (Sketchfab), CC BY 4.0. HDRIs by Poly Haven, CC0. Interior mechanicals modelled procedurally.
                </div>
              )}
            </div>
          </div>
        </div>

        <div data-ui="search" className="px-4 pb-2 sm:hidden"><SearchBox /></div>

        <div ref={row} data-ui="cards" className={`flex gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:thin] ${open ? '' : 'hidden md:flex'}`}>
          {kids.map((k) => <Card key={k.id} part={k} active={part === k.id} />)}
        </div>
      </div>
    </div>
  )
}

export function DetailPanel() {
  const s = useStore()
  const part = s.part ? BY_ID[s.part] : null
  if (!part) return null
  const kids = CHILDREN[part.id] ?? []
  const path = pathOf(part.id)
  const rows: [string, string | undefined][] = [['What it is', part.desc], ['What it does', part.fn], ['Material', part.material], ['Spec', part.spec], ['Maintenance', part.maint]]
  return (
    <aside
      data-ui="detail" data-box
      className="glass fade-in absolute inset-x-[var(--edge)] z-30 max-h-[42vh] overflow-y-auto rounded-2xl p-5 md:inset-x-auto md:right-[var(--edge)] md:top-[76px] md:w-[340px] md:max-h-none [scrollbar-width:thin]"
      style={{ bottom: 'calc(var(--rail-h) + 16px)' }}
    >
      <div className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">{path.slice(0, -1).map((x) => x.name).join(' / ') || 'Car'}</div>
      <div className="mt-1 flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold leading-tight">{part.name}</h2>
        <button onClick={() => s.selectPart(null)} className="rounded-full px-2 text-zinc-400 hover:text-white" aria-label="Close">×</button>
      </div>
      {part.price ? <div className="mt-1 text-sm tabular-nums text-zinc-300">${part.price.toLocaleString()} <span className="text-[10px] text-zinc-500">typical replacement</span></div> : null}
      <dl className="mt-4 space-y-3 text-xs">
        {rows.filter(([, v]) => v).map(([k, v]) => (
          <div key={k}><dt className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">{k}</dt><dd className="mt-0.5 leading-relaxed text-zinc-200">{v}</dd></div>
        ))}
      </dl>
      <div className="mt-5 space-y-3">
        <button onClick={() => s.set({ context: !s.context })} className="flex w-full items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-xs text-zinc-200 hover:bg-white/10">
          Show in context
          <span className={`relative h-5 w-9 rounded-full transition ${s.context ? 'bg-white' : 'bg-white/15'}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full transition ${s.context ? 'left-[18px] bg-black' : 'left-0.5 bg-zinc-300'}`} /></span>
        </button>
        {kids.length > 0 && (
          <div>
            <div className="mb-1 flex justify-between text-[10px] uppercase tracking-[0.2em] text-zinc-500"><span>Explode this assembly</span><span>{Math.round(s.asmExplode * 100)}%</span></div>
            <input type="range" min={0} max={1} step={0.01} value={s.asmExplode} onChange={(e) => s.set({ asmExplode: Number(e.target.value) })} />
          </div>
        )}
        <div className="flex gap-2">
          {kids.length > 0 && <button onClick={() => s.openLevel(part.id)} className="flex-1 rounded-lg bg-white px-3 py-2 text-xs font-medium text-black hover:bg-zinc-200">Open · {kids.length} parts</button>}
          {part.parent !== 'car' && <button onClick={() => s.selectPart(part.parent)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:bg-white/10">↑ {BY_ID[part.parent]?.name}</button>}
        </div>
      </div>
    </aside>
  )
}

export function SearchBox() {
  const [q, setQ] = useState('')
  const s = useStore()
  const hits = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (t.length < 2) return []
    return PARTS.filter((p) => p.id !== 'car' && (p.name.toLowerCase().includes(t) || p.id.includes(t))).slice(0, 12)
  }, [q])
  return (
    <div className="relative w-full max-w-[280px]">
      <input
        value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search 372 parts…"
        onKeyDown={(e) => { if (e.key === 'Enter' && hits[0]) { s.selectPart(hits[0].id); setQ('') } if (e.key === 'Escape') setQ('') }}
        className="w-full rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[11px] text-zinc-100 placeholder:text-zinc-500 focus:border-white/40 focus:bg-white/10 focus:outline-none"
      />
      {hits.length > 0 && (
        <ul className="glass r-md absolute bottom-8 left-0 right-0 z-50 overflow-hidden py-1 text-xs">
          {hits.map((h) => (
            <li key={h.id}>
              <button onClick={() => { s.selectPart(h.id); setQ('') }} className="flex w-full items-baseline justify-between gap-2 px-3 py-1.5 text-left hover:bg-white/10">
                <span className="text-zinc-100">{h.name}</span><span className="truncate text-[10px] text-zinc-500">{pathOf(parentOf(h.id)).map((x) => x.name).join(' / ')}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
