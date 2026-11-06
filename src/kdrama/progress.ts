import { useCallback, useState } from 'react'
import { ACTORS, type ActorId } from './data'

// Progress in the K-Drama Garden is kept in this browser, so it survives a reload.
const KEY = 'chibi-wedding-kdrama-v1'

export interface KProgress {
  found: ActorId[]
  trophy: boolean
}

const EMPTY: KProgress = { found: [], trophy: false }

export function loadProgress(): KProgress {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return EMPTY
    const p = JSON.parse(raw) as Partial<KProgress>
    const ids = new Set(ACTORS.map((a) => a.id))
    const found = Array.isArray(p.found) ? p.found.filter((id): id is ActorId => ids.has(id as ActorId)) : []
    return { found: [...new Set(found)], trophy: !!p.trophy && found.length === ACTORS.length }
  } catch {
    return EMPTY
  }
}

function save(p: KProgress) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    /* private mode or storage blocked: progress just lasts for this visit */
  }
}

export function useKProgress() {
  const [progress, setProgress] = useState<KProgress>(loadProgress)
  const update = useCallback((fn: (p: KProgress) => KProgress) => {
    setProgress((p) => {
      const next = fn(p)
      save(next)
      return next
    })
  }, [])
  /** Mark an actor as identified. Does nothing if they already gave their treasure. */
  const markFound = useCallback((id: ActorId) => update((p) => (p.found.includes(id) ? p : { ...p, found: [...p.found, id] })), [update])
  const awardTrophy = useCallback(() => update((p) => (p.trophy || p.found.length < ACTORS.length ? p : { ...p, trophy: true })), [update])
  const reset = useCallback(() => update(() => EMPTY), [update])
  return { progress, markFound, awardTrophy, reset }
}
