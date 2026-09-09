import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Loader, useProgress } from '@react-three/drei'
import { Configurator, Presets } from './ui/Configurator'
import { MODES, PAINTS, priceOf, useStore, type Mode, type View } from './store'
import { CHILDREN } from './data/parts'
import { BottomBar, DetailPanel } from './ui/Explorer'

const Scene = lazy(() => import('./scene/Scene'))

// cinematic tour: each stop is a mode or preset, held for a few seconds
const TOUR: ({ mode: Mode } | { view: View })[] = [{ view: 'home' }, { view: 'front' }, { view: 'wheel' }, { view: 'side' }, { mode: 'engine' }, { mode: 'xray' }, { mode: 'chassis' }, { mode: 'interior' }, { view: 'rear' }]

export default function App() {
  const s = useStore()
  const { env, mode, hover, hideUi, summary, tour, configOpen } = s
  const label = useRef<HTMLDivElement>(null)
  // the hint shows once the scene is up (not at mount, or it expires behind the loader) and clears on first input
  const loading = useProgress((p) => p.active)
  const [hint, setHint] = useState(true)
  useEffect(() => {
    if (loading) return
    const off = () => setHint(false)
    const t = setTimeout(off, 6000)
    window.addEventListener('pointerdown', off, { once: true })
    window.addEventListener('keydown', off, { once: true })
    return () => { clearTimeout(t); window.removeEventListener('pointerdown', off); window.removeEventListener('keydown', off) }
  }, [loading])

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return
      const st = useStore.getState()
      const k = e.key.toLowerCase()
      if (k >= '1' && k <= '5') st.setMode(MODES[Number(k) - 1].id)
      else if (k === 'd') st.set({ doorOpen: !st.doorOpen })
      else if (k === 'h') st.set({ hoodOpen: !st.hoodOpen })
      else if (k === 't') st.set({ trunkOpen: !st.trunkOpen })
      else if (k === 'l') st.set({ lights: !st.lights })
      else if (k === 'v') st.set({ drive: !st.drive })
      else if (k === 'm') st.set({ dims: !st.dims })
      else if (k === 'p') st.set({ hideUi: !st.hideUi })
      else if (k === 'r') st.reset()
      else if (k === 'escape') st.set({ hideUi: false, summary: false, part: null, tour: false, configOpen: false })
      else if (k === 'backspace' || k === 'arrowup') st.back()
      else if (k === 'arrowleft' || k === 'arrowright') {
        e.preventDefault()
        const sibs = CHILDREN[st.level] ?? []
        if (!sibs.length) return
        const i = sibs.findIndex((x) => x.id === st.part)
        const n = i < 0 ? 0 : (i + (k === 'arrowright' ? 1 : sibs.length - 1)) % sibs.length
        st.selectPart(sibs[n].id)
      }
      else if (k === 'enter' || k === 'arrowdown') { if (st.part && CHILDREN[st.part]?.length) st.openLevel(st.part) }
      else if (k === ' ') { e.preventDefault(); st.set({ tour: !st.tour }) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // tour: advance every 5 s, stop on the first drag
  useEffect(() => {
    if (!tour) return
    let i = 0
    const step = () => {
      const stop = TOUR[i++ % TOUR.length]
      if ('mode' in stop) useStore.getState().setMode(stop.mode)
      else { if (useStore.getState().mode !== 'exterior') useStore.getState().setMode('exterior'); useStore.getState().flyTo(stop.view) }
    }
    step()
    const id = setInterval(step, 5000)
    const cancel = () => useStore.setState({ tour: false })
    const canvas = document.querySelector('canvas')
    canvas?.addEventListener('pointerdown', cancel)
    return () => { clearInterval(id); canvas?.removeEventListener('pointerdown', cancel) }
  }, [tour])

  const { lines, total } = priceOf(s)
  const paintName = PAINTS.find((x) => x.hex === s.paint)?.name ?? s.paint

  return (
    <div
      className="stage relative h-full w-full select-none" data-env={env}
      onPointerMove={(e) => { if (label.current) label.current.style.transform = `translate(${e.clientX + 14}px, ${e.clientY + 14}px)` }}
    >
      <Suspense fallback={<div className="grid h-full place-items-center text-xs uppercase tracking-[0.3em] text-zinc-500">Loading</div>}>
        <Scene />
      </Suspense>
      <Loader
        containerStyles={{ background: '#050507' }}
        innerStyles={{ width: 200, height: 2, background: '#27272a' }}
        barStyles={{ height: 2, background: '#fff' }}
        dataStyles={{ color: '#71717a', fontFamily: 'inherit', fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase' }}
        dataInterpolation={(pr) => `Loading ${pr.toFixed(0)}%`}
      />

      {hideUi ? (
        <button onClick={() => s.set({ hideUi: false })} className="glass r-pill absolute right-[var(--edge)] top-[var(--edge)] z-40 px-3 py-1.5 text-[11px] text-zinc-300 hover:bg-white/10">Show UI · P</button>
      ) : (
        <>
          {/* top-left: brand only */}
          <div data-ui="brand" data-box className="pointer-events-none absolute left-[var(--edge)] top-[var(--edge)] z-20 [text-shadow:0_1px_10px_rgba(0,0,0,.85)]">
            <div className="text-[9px] uppercase tracking-[0.3em] text-zinc-500">BMW M</div>
            <h1 className="text-[15px] font-semibold leading-tight tracking-tight">M4 CSL</h1>
          </div>

          {/* top-centre: view modes, primary */}
          <div data-ui="modes" data-box className="glass r-pill absolute left-1/2 top-[60px] z-20 flex max-w-[calc(100vw-2*var(--edge))] -translate-x-1/2 gap-1 overflow-x-auto p-1 md:top-[var(--edge)] [scrollbar-width:none]">
            {MODES.map((m, i) => (
              <button
                key={m.id} onClick={() => s.setMode(m.id)} title={`${m.label} (${i + 1})`}
                className={`seg ${mode === m.id ? 'seg-on' : 'seg-off'}`}
              >{m.label}</button>
            ))}
          </div>

          {/* left edge: camera presets, tertiary */}
          <Presets />

          {/* top-right: configure only */}
          <button
            onClick={() => s.set({ configOpen: !configOpen })} data-ui="configure" data-box
            className={`r-pill absolute right-[var(--edge)] top-[var(--edge)] z-40 px-3 py-1.5 text-[11px] transition ${configOpen ? 'bg-white text-black shadow-lg' : 'glass text-zinc-300 hover:bg-white/10'}`}
          >{configOpen ? 'Close' : 'Configure'}</button>

          <BottomBar />
          {!configOpen && <DetailPanel />}
          {configOpen && <Configurator />}

          {/* bottom-centre hint toast, above the rail */}
          {hint && (
            <div
              data-ui="hint" data-box
              className="glass r-pill fade-in pointer-events-none absolute left-1/2 z-20 hidden -translate-x-1/2 px-3 py-1.5 text-[11px] text-zinc-400 md:block"
              style={{ bottom: 'calc(var(--rail-h) + 16px)' }}
            >Drag to rotate · click any part · ←/→ siblings · Enter opens · Backspace up</div>
          )}

          {tour && (
            <div className="glass r-pill fade-in pointer-events-none absolute left-1/2 top-[108px] z-20 -translate-x-1/2 px-3 py-1 text-[11px] text-zinc-300 md:top-[68px]">Tour playing · drag or press Space to stop</div>
          )}
        </>
      )}

      {/* hover label */}
      <div ref={label} className={`pointer-events-none fixed left-0 top-0 z-40 rounded-md bg-white px-2 py-1 text-[11px] font-medium text-black shadow ${hover && !hideUi ? '' : 'hidden'}`}>{hover}</div>

      {/* build summary */}
      {summary && (
        <div className="absolute inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm" onClick={() => s.set({ summary: false })}>
          <div className="fade-in w-[min(92vw,420px)] rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">Your build</div>
            <div className="mt-1 text-xl font-semibold">BMW M4 CSL</div>
            <dl className="mt-4 space-y-1.5 text-xs">
              {[['Paint', `${paintName} · ${s.finish}`], ['Wheels', `${s.rim} · ${Math.round(19 + (s.wheel - 1) * 20)}"`], ['Calipers', s.caliper], ['Interior', s.trim], ['Glass tint', `${Math.round(s.tint * 100)}%`], ['Ride height', `${s.ride >= 0 ? '+' : ''}${Math.round(s.ride * 100)} cm`], ['Ambient light', s.ambient]].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4"><dt className="text-zinc-500">{k}</dt><dd className="capitalize text-zinc-200">{v}</dd></div>
              ))}
            </dl>
            <div className="my-4 h-px bg-white/10" />
            <dl className="space-y-1.5 text-xs tabular-nums">
              {lines.map(([k, v]) => (
                <div key={k} className="flex justify-between"><dt className="capitalize text-zinc-400">{k}</dt><dd>${v.toLocaleString()}</dd></div>
              ))}
              <div className="flex justify-between border-t border-white/10 pt-2 text-sm font-semibold"><dt>Total</dt><dd>${total.toLocaleString()}</dd></div>
            </dl>
            <div className="mt-5 flex gap-2">
              <button onClick={() => navigator.clipboard?.writeText(`BMW M4 CSL — ${paintName} ${s.finish}, ${s.rim} wheels · $${total.toLocaleString()}\n${location.href}`)} className="flex-1 rounded-lg bg-white px-3 py-2 text-xs font-medium text-black hover:bg-zinc-200">Copy build</button>
              <button onClick={() => s.set({ summary: false })} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:bg-white/10">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
