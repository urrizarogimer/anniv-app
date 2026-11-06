import { useCallback, useEffect, useRef, useState } from 'react'
import { audio, type Track } from './audio'
import { preloadAll } from './assets'
import { HeartShape } from './components/Decor'
import { Ambient } from './components/Ambient'
import { Opening } from './scenes/Opening'
import { Garden } from './scenes/Garden'
import { Prep } from './scenes/Prep'
import { Ceremony } from './scenes/Ceremony'
import { Celebration } from './scenes/Celebration'
import { Ending } from './scenes/Ending'

export type Scene = 'opening' | 'garden' | 'prep' | 'ceremony' | 'celebration' | 'ending'

const MUSIC: Record<Scene, Track> = {
  opening: 'opening',
  garden: 'garden',
  prep: 'opening',
  ceremony: 'ceremony',
  celebration: 'garden',
  ending: 'ending',
}

type Wipe = null | { phase: 'in' | 'out'; kind: 'hearts' | 'white' }

export default function App() {
  const [loaded, setLoaded] = useState(0)
  const [ready, setReady] = useState(false)
  const [scene, setScene] = useState<Scene>(() => {
    // dev helper: ?scene=ending jumps straight to a scene
    const q = new URLSearchParams(window.location.search).get('scene') as Scene | null
    return q && q in MUSIC ? q : 'opening'
  })
  const [wipe, setWipe] = useState<Wipe>(null)
  const busy = useRef(false)
  const sceneRef = useRef(scene)
  sceneRef.current = scene

  useEffect(() => {
    preloadAll((d, t) => setLoaded(d / t)).then(() => setReady(true))
  }, [])

  // Start the scene's music once audio is unlocked (first user gesture).
  useEffect(() => {
    audio.playMusic(MUSIC[scene])
  }, [scene])
  useEffect(() => {
    const unlock = () => {
      audio.unlock()
      audio.playMusic(MUSIC[sceneRef.current])
    }
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])
  const go = useCallback((next: Scene, kind: 'hearts' | 'white' = 'hearts') => {
    if (busy.current) return
    busy.current = true
    audio.unlock()
    if (kind === 'hearts') audio.sfx('whoosh')
    setWipe({ phase: 'in', kind })
    const inMs = kind === 'white' ? 1800 : 750
    window.setTimeout(() => {
      setScene(next)
      setWipe({ phase: 'out', kind })
      window.setTimeout(
        () => {
          setWipe(null)
          busy.current = false
        },
        kind === 'white' ? 2600 : 850,
      )
    }, inMs)
  }, [])

  if (!ready) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-gradient-to-b from-blush-50 to-blush-100">
        <div className="anim-pulse-soft">
          <HeartShape size={64} color="#f78aa8" />
        </div>
        <div className="h-3 w-56 overflow-hidden rounded-full bg-white shadow-inner">
          <div className="h-full rounded-full bg-gradient-to-r from-blush-300 to-blush-500 transition-all" style={{ width: `${Math.round(loaded * 100)}%` }} />
        </div>
        <p className="font-script text-2xl text-blush-600">Getting ready…</p>
      </div>
    )
  }

  return (
    <main className="relative h-full w-full overflow-hidden">
      {scene === 'opening' && <Opening onBegin={() => go('garden')} />}
      {scene === 'garden' && (
        <Garden onComplete={() => go('prep')} />
      )}
      {scene === 'prep' && <Prep onDone={() => go('ceremony')} />}
      {scene === 'ceremony' && <Ceremony onDone={() => go('celebration')} />}
      {scene === 'celebration' && <Celebration onDone={() => go('ending', 'white')} />}
      {scene === 'ending' && <Ending onPlayAgain={() => go('opening')} />}

      {wipe && <SceneWipe phase={wipe.phase} kind={wipe.kind} />}
    </main>
  )
}

function SceneWipe({ phase, kind }: { phase: 'in' | 'out'; kind: 'hearts' | 'white' }) {
  if (kind === 'white') {
    return (
      <div
        className="pointer-events-auto absolute inset-0 z-50"
        style={{
          background: 'radial-gradient(circle at 50% 45%, #fffdf6 0%, #fff4e0 55%, #ffe6ee 100%)',
          animation: phase === 'in' ? 'fade-in 1.8s ease-in both' : 'fade-in 2.6s ease-out reverse both',
        }}
      />
    )
  }
  return (
    <div className="pointer-events-auto absolute inset-0 z-50 overflow-hidden" aria-hidden>
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          width: '260vmax',
          height: '260vmax',
          transform: `translate(-50%, -45%) scale(${phase === 'in' ? 1 : 0})`,
          animation: phase === 'in' ? 'heart-grow 0.75s cubic-bezier(.6,0,.4,1) both' : 'heart-shrink 0.85s cubic-bezier(.6,0,.4,1) both',
        }}
      >
        <HeartShape size={9999} color="#fdb0c4" style={{ width: '100%', height: '100%' }} />
      </div>
      <div className="absolute inset-0" style={{ animation: phase === 'in' ? 'fade-in 0.75s ease both' : 'fade-in 0.85s ease reverse both' }}>
        <Ambient petals={0} hearts={16} sparkles={18} seed={99} />
      </div>
      <style>{`
        @keyframes heart-grow { from { transform: translate(-50%,-45%) scale(0); } to { transform: translate(-50%,-45%) scale(1); } }
        @keyframes heart-shrink { from { transform: translate(-50%,-45%) scale(1); } to { transform: translate(-50%,-45%) scale(0); } }
      `}</style>
    </div>
  )
}
