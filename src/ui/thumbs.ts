/** Thumbnail cache: cards request a render; the Thumbnailer in Scene.tsx fulfils one per frame. */
import { useSyncExternalStore } from 'react'
const cache = new Map<string, string>()
export const queue: string[] = []
const listeners = new Set<() => void>()
let version = 0
export function requestThumb(id: string) { if (!cache.has(id) && !queue.includes(id)) queue.push(id) }
export function setThumb(id: string, url: string) { cache.set(id, url); version++; listeners.forEach((l) => l()) }
export function useThumb(id: string) {
  const v = useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l) }, () => version)
  void v
  const url = cache.get(id)
  if (!url) requestThumb(id)
  return url
}
