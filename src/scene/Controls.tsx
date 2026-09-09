import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useStore, type Goal } from '../store'

const DUR = 1.4
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const LOOK_R = 0.05 // interior: orbit radius so dragging becomes look-around

export function Controls() {
  const ref = useRef<OrbitControlsImpl>(null)
  const { camera, gl, size } = useThree()
  const mode = useStore((s) => s.mode)
  const flying = useStore((s) => s.flying)
  const part = useStore((s) => s.part)
  const interior = mode === 'interior'
  const chassis = mode === 'chassis'
  const [idle, setIdle] = useState(true)
  const [azimuth, setAzimuth] = useState(0)

  // auto-rotate after 4s without input
  useEffect(() => {
    let t = 0
    const wake = () => { setIdle(false); clearTimeout(t); t = window.setTimeout(() => setIdle(true), 4000) }
    const el = gl.domElement
    el.addEventListener('pointerdown', wake); el.addEventListener('wheel', wake, { passive: true })
    return () => { el.removeEventListener('pointerdown', wake); el.removeEventListener('wheel', wake); clearTimeout(t) }
  }, [gl])

  // tween camera + look target toward the store goal
  const tween = useRef<{ goal: Goal; p0: THREE.Vector3; t0: THREE.Vector3; t: number } | null>(null)
  const look = useRef(new THREE.Vector3(0, 0.55, 0))
  useFrame((_, dt) => {
    const c = ref.current
    const goal = useStore.getState().goal
    const cam = camera as THREE.PerspectiveCamera
    const fov = interior ? 68 : size.width < size.height ? 58 : 40 // portrait phones need a wider view
    if (Math.abs(cam.fov - fov) > 0.05) { cam.fov += (fov - cam.fov) * Math.min(1, dt * 4); cam.updateProjectionMatrix() }
    if (!goal || !c) return
    if (tween.current?.goal !== goal) tween.current = { goal, p0: camera.position.clone(), t0: c.target.clone(), t: 0 }
    const tw = tween.current
    tw.t = Math.min(1, tw.t + dt / DUR)
    const k = ease(tw.t)
    camera.position.lerpVectors(tw.p0, new THREE.Vector3(...goal.pos), k)
    look.current.lerpVectors(tw.t0, new THREE.Vector3(...goal.target), k)
    camera.lookAt(look.current)
    if (tw.t >= 1) {
      const fwd = new THREE.Vector3(...goal.target).sub(camera.position).normalize()
      if (useStore.getState().mode === 'interior') {
        c.target.copy(camera.position).addScaledVector(fwd, LOOK_R)
        setAzimuth(Math.atan2(-fwd.x, -fwd.z))
      } else c.target.copy(look.current)
      c.update()
      tween.current = null
      useStore.setState({ goal: null, flying: false })
    }
  })

  return (
    <OrbitControls
      ref={ref}
      makeDefault
      enabled={!flying}
      enableDamping
      dampingFactor={0.08}
      autoRotate={idle && !flying && (mode === 'exterior' || !!part)}
      autoRotateSpeed={part ? 0.35 : 0.5}
      enablePan={false}
      enableZoom={!interior}
      rotateSpeed={interior ? -0.35 : 0.8}
      minDistance={interior ? LOOK_R : 1.2}
      maxDistance={interior ? LOOK_R : 13}
      minPolarAngle={interior ? 1.05 : 0.05}
      maxPolarAngle={interior ? 2.0 : chassis ? Math.PI - 0.05 : Math.PI / 2 - 0.04}
      minAzimuthAngle={interior ? azimuth - 1.35 : -Infinity}
      maxAzimuthAngle={interior ? azimuth + 1.35 : Infinity}
    />
  )
}
