import { Suspense, useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, Environment, Grid, Lightformer, MeshReflectorMaterial, PerformanceMonitor } from '@react-three/drei'
import { Bloom, DepthOfField, EffectComposer, N8AO, Noise, Outline, SMAA, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { Car, registry } from './Car'
import { queue, setThumb } from '../ui/thumbs'
import { subsystemOf } from '../data/parts'
import { useFrame, useThree } from '@react-three/fiber'
import { Controls } from './Controls'
import { useStore } from '../store'

let canvas: HTMLCanvasElement | null = null
export function screenshot() {
  if (!canvas) return
  const a = document.createElement('a')
  a.download = `bmw-m4-csl-${Date.now()}.png`
  a.href = canvas.toDataURL('image/png')
  a.click()
}

const HDR = { studio: 'studio_small_09_2k', sunset: 'venice_sunset_2k', night: 'dikhololo_night', city: 'potsdamer_platz' }
const KEY = { studio: 1.0, sunset: 0.5, night: 0.2, city: 0.7 }
const FOG = { studio: '#050507', sunset: '#6b5650', night: '#0a0d14', city: '#4a5058' }
const FLOOR = { studio: '#0a0a0c', sunset: '#1a1210', night: '#07080c', city: '#0f1114' }

/** PerformanceMonitor, mounted a few seconds after the model resolves so shader warm-up doesn't count as a decline */
function Adaptive(p: { onDecline: () => void; onIncline: () => void }) {
  const [ready, setReady] = useState(false)
  useEffect(() => { const t = setTimeout(() => setReady(true), 3000); return () => clearTimeout(t) }, [])
  return ready ? <PerformanceMonitor bounds={() => [45, 58]} ms={400} iterations={8} flipflops={2} {...p} /> : null
}

/** renders one queued part thumbnail per frame into a small render target */
function Thumbnailer() {
  const { gl, scene } = useThree()
  const rt = useMemo(() => new THREE.WebGLRenderTarget(160, 160, { samples: 4 }), [])
  const cam = useMemo(() => new THREE.PerspectiveCamera(30, 1, 0.01, 50), [])
  const tmp = useMemo(() => { const sc = new THREE.Scene(); sc.add(new THREE.DirectionalLight('#ffffff', 2).translateX(2).translateY(3).translateZ(-2), new THREE.AmbientLight('#ffffff', 0.6)); return sc }, [])
  const px = useMemo(() => new Uint8Array(160 * 160 * 4), [])
  const canvas = useMemo(() => Object.assign(document.createElement('canvas'), { width: 160, height: 160 }), [])
  useFrame(() => {
    const id = queue.shift(); const reg = registry
    if (!id || !reg) return
    reg.ensure(subsystemOf(id))
    const objs = reg.objectsOf(id)
    if (!objs.length) { setThumb(id, ''); return }
    const holder = new THREE.Group()
    for (const o of objs) {
      const mats: THREE.Material[] = []
      o.traverse((m) => { const mm = m as THREE.Mesh; if (mm.isMesh) mats.push((mm.userData.mat as THREE.Material) ?? (mm.material as THREE.Material)) })
      const c = o.clone(true) // clone() JSON-copies userData, so restore materials by traversal order instead
      c.matrix.copy(o.matrixWorld); c.matrix.decompose(c.position, c.quaternion, c.scale)
      let k = 0
      c.traverse((m) => { const mm = m as THREE.Mesh; if (mm.isMesh) { mm.material = mats[k++]; mm.visible = true } })
      holder.add(c)
    }
    tmp.add(holder); tmp.environment = scene.environment
    const box = new THREE.Box3().setFromObject(holder); const ctr = box.getCenter(new THREE.Vector3()); const size = box.getSize(new THREE.Vector3())
    holder.position.sub(ctr)
    const d = Math.max(size.x, size.y, size.z, 0.02) * 1.9 + 0.02
    cam.position.set(1, 0.7, -1.2).normalize().multiplyScalar(d); cam.lookAt(0, 0, 0); cam.near = d * 0.05; cam.far = d * 4; cam.updateProjectionMatrix()
    const prev = gl.getRenderTarget(); const clear = gl.getClearAlpha()
    gl.setRenderTarget(rt); gl.setClearColor(0x000000, 0); gl.clear(); gl.render(tmp, cam)
    gl.readRenderTargetPixels(rt, 0, 0, 160, 160, px)
    gl.setRenderTarget(prev); gl.setClearAlpha(clear)
    tmp.remove(holder)
    const ctx = canvas.getContext('2d')!; const img = ctx.createImageData(160, 160)
    for (let y = 0; y < 160; y++) img.data.set(px.subarray((159 - y) * 640, (160 - y) * 640), y * 640)
    ctx.putImageData(img, 0, 0)
    setThumb(id, canvas.toDataURL('image/png'))
  })
  return null
}

export default function Scene() {
  const env = useStore((s) => s.env)
  const lights = useStore((s) => s.lights)
  const mode = useStore((s) => s.mode)
  const sel = useStore((s) => s.sel)
  const hoverSel = useStore((s) => s.hoverSel)
  const part = useStore((s) => s.part)
  const goal = useStore((s) => s.goal)
  const [frameloop, setFrameloop] = useState<'always' | 'never'>('always')
  // adaptive quality: PerformanceMonitor lowers DPR, then drops SSAO, when the frame rate sags (DPR cap 2)
  const [dpr, setDpr] = useState(Math.min(2, window.devicePixelRatio))
  const [ao, setAo] = useState(true)
  useEffect(() => {
    const f = () => setFrameloop(document.hidden ? 'never' : 'always')
    document.addEventListener('visibilitychange', f)
    return () => document.removeEventListener('visibilitychange', f)
  }, [])
  const chassis = mode === 'chassis'
  const focus = useMemo(() => {
    if (!part || goal || !registry) return undefined
    const b = registry.box(part); const size = b.getSize(new THREE.Vector3())
    return Math.max(size.x, size.y, size.z) < 0.45 ? b.getCenter(new THREE.Vector3()) : undefined // DoF only on small parts
  }, [part, goal])

  return (
    <Canvas
      frameloop={frameloop}
      dpr={dpr}
      camera={{ position: [4.4, 1.4, -4.3], fov: 40, near: 0.05, far: 100 }}
      gl={{ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
      onCreated={({ gl }) => { canvas = gl.domElement }}
    >
      <fog attach="fog" args={[FOG[env], env === 'studio' ? 12 : 20, env === 'studio' ? 34 : 80]} />
      <Suspense fallback={null}>
        {/* HDRI + area-light style studio rim lights, baked into one environment cube */}
        {env === 'studio' ? (
          <Environment files={`/hdr/${HDR[env]}.hdr`} resolution={512} environmentIntensity={0.85}>
            <Lightformer form="rect" intensity={2} color="#ffffff" position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[8, 3, 1]} />
            <Lightformer form="rect" intensity={2} color="#dfe8ff" position={[0, 2, -6]} rotation-y={Math.PI} scale={[10, 1.2, 1]} />
            <Lightformer form="rect" intensity={2} color="#ffe9d6" position={[0, 2, 6]} scale={[10, 1.2, 1]} />
            <Lightformer form="ring" intensity={1.5} color="#ffffff" position={[7, 3, 0]} rotation-y={-Math.PI / 2} scale={2} />
          </Environment>
        ) : (
          /* outdoor: the HDRI itself becomes a blurred sky so reflections and background agree */
          <Environment files={`/hdr/${HDR[env]}.hdr`} background backgroundBlurriness={0.45} backgroundIntensity={env === 'night' ? 0.8 : env === 'sunset' ? 0.35 : 0.45} environmentIntensity={env === 'night' ? 1.4 : 0.9} />
        )}
        <Car />
        <Thumbnailer />
        <Adaptive
          onDecline={() => setDpr((d) => (d > 1 ? Math.max(1, d - 0.5) : (setAo(false), d)))}
          onIncline={() => setDpr((d) => Math.min(2, window.devicePixelRatio, d + 0.5))}
        />
      </Suspense>
      <directionalLight position={[3, 6, 2]} intensity={KEY[env]} color={env === 'sunset' ? '#ffd1a3' : '#ffffff'} />
      {chassis && <directionalLight position={[2, -4, -2]} intensity={1.2} />}
      {/* floor: reflective studio slab, or a fading grid in chassis mode */}
      {chassis ? (
        <Grid position-y={-0.001} args={[40, 40]} cellSize={0.5} sectionSize={2} cellColor="#2a2f3a" sectionColor="#4a5568" fadeDistance={22} fadeStrength={1.2} infiniteGrid side={THREE.DoubleSide} />
      ) : (
        <>
          <mesh rotation-x={-Math.PI / 2} position-y={-0.002}>
            <circleGeometry args={[120, 96]} />
            <MeshReflectorMaterial
              blur={[500, 150]} resolution={1024} mixBlur={1} mixStrength={lights ? 30 : 50} roughness={1}
              depthScale={1.2} minDepthThreshold={0.4} maxDepthThreshold={1.4} color={FLOOR[env]} metalness={0.5} mirror={0}
            />
          </mesh>
          {env === 'studio' && (
            <mesh rotation-x={-Math.PI / 2} position-y={0.003}>
              <ringGeometry args={[3.3, 3.34, 160]} />
              <meshBasicMaterial color={[0.8, 0.84, 1.05]} toneMapped={false} transparent opacity={0.4} />
            </mesh>
          )}
          <ContactShadows position-y={0.004} opacity={0.85} scale={12} blur={2} far={1.6} resolution={1024} frames={Infinity} />
        </>
      )}
      <Controls />
      <EffectComposer multisampling={0} autoClear={false}>
        {ao ? <N8AO aoRadius={0.4} intensity={1.5} distanceFalloff={0.6} quality="performance" halfRes /> : <></>}
        <Outline selection={sel} edgeStrength={6} pulseSpeed={0} visibleEdgeColor={0xffffff} hiddenEdgeColor={0x4da3ff} blur xRay />
        <Outline selection={hoverSel} edgeStrength={3} pulseSpeed={0} visibleEdgeColor={0xffd166} hiddenEdgeColor={0x8a6d1f} blur xRay />
        <Bloom mipmapBlur luminanceThreshold={1.1} intensity={0.45} radius={0.5} />
        {focus ? <DepthOfField target={focus} focalLength={0.04} bokehScale={1.2} height={480} /> : <></>}
        <SMAA />
        <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.12} />
        <Vignette eskil={false} offset={0.25} darkness={0.55} />
      </EffectComposer>
    </Canvas>
  )
}
