import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { ButterflyShape, HeartShape, PetalShape, SparkleShape, rng } from './Decor'

const PETAL_COLORS = ['#fbb6c8', '#ffd1dd', '#fff1f4', '#f9a8bf', '#ffe3ea']
const HEART_COLORS = ['#f78aa8', '#fdb0c4', '#ec6a90', '#ffc2d4']

interface AmbientProps {
  petals?: number
  hearts?: number
  sparkles?: number
  butterflies?: number
  seed?: number
  className?: string
}

/** Decorative floating layer. Pointer-events are off so it never blocks play. */
export function Ambient({ petals = 14, hearts = 0, sparkles = 0, butterflies = 0, seed = 11, className = '' }: AmbientProps) {
  const items = useMemo(() => {
    const r = rng(seed)
    return {
      petals: Array.from({ length: petals }, () => ({
        left: r() * 100,
        dur: 9 + r() * 9,
        delay: -r() * 18,
        size: 10 + r() * 10,
        color: PETAL_COLORS[Math.floor(r() * PETAL_COLORS.length)],
        drift: (r() - 0.3) * 160,
        spin: (r() < 0.5 ? -1 : 1) * (200 + r() * 400),
        sway: 15 + r() * 35,
        swayDur: 2.5 + r() * 2.5,
      })),
      hearts: Array.from({ length: hearts }, () => ({
        left: r() * 100,
        dur: 7 + r() * 7,
        delay: -r() * 14,
        size: 12 + r() * 16,
        color: HEART_COLORS[Math.floor(r() * HEART_COLORS.length)],
        drift: (r() - 0.5) * 80,
        o: 0.5 + r() * 0.4,
      })),
      sparkles: Array.from({ length: sparkles }, () => ({
        left: r() * 100,
        top: r() * 100,
        size: 8 + r() * 14,
        dur: 1.4 + r() * 2,
        delay: -r() * 3,
        color: r() < 0.6 ? '#ffe08a' : '#fff',
      })),
      butterflies: Array.from({ length: butterflies }, (_, i) => ({
        left: 8 + r() * 80,
        top: 8 + r() * 55,
        hue: (['pink', 'blue', 'gold'] as const)[i % 3],
        dur: 12 + r() * 10,
        delay: -r() * 10,
        size: 24 + r() * 14,
        b: [r(), r(), r(), r(), r(), r()].map((v) => (v - 0.5) * 260),
      })),
    }
  }, [petals, hearts, sparkles, butterflies, seed])

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      {items.sparkles.map((s, i) => (
        <div key={`s${i}`} className="absolute" style={{ left: `${s.left}%`, top: `${s.top}%`, animation: `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite` }}>
          <SparkleShape size={s.size} color={s.color} />
        </div>
      ))}
      {items.butterflies.map((b, i) => (
        <div
          key={`b${i}`}
          className="absolute"
          style={
            {
              left: `${b.left}%`,
              top: `${b.top}%`,
              '--bx1': `${b.b[0]}px`,
              '--by1': `${b.b[1] * 0.5}px`,
              '--bx2': `${b.b[2]}px`,
              '--by2': `${b.b[3] * 0.5}px`,
              '--bx3': `${b.b[4]}px`,
              '--by3': `${b.b[5] * 0.5}px`,
              animation: `flutter-path ${b.dur}s ease-in-out ${b.delay}s infinite`,
            } as CSSProperties
          }
        >
          <ButterflyShape size={b.size} hue={b.hue} />
        </div>
      ))}
      {items.hearts.map((h, i) => (
        <div
          key={`h${i}`}
          className="absolute bottom-[-40px]"
          style={{ left: `${h.left}%`, '--drift': `${h.drift}px`, '--o': h.o, animation: `float-up ${h.dur}s ease-in ${h.delay}s infinite` } as CSSProperties}
        >
          <HeartShape size={h.size} color={h.color} />
        </div>
      ))}
      {items.petals.map((p, i) => (
        <div
          key={`p${i}`}
          className="absolute top-0"
          style={{ left: `${p.left}%`, '--drift': `${p.drift}px`, '--spin': `${p.spin}deg`, animation: `fall ${p.dur}s linear ${p.delay}s infinite` } as CSSProperties}
        >
          <div style={{ '--sway': `${p.sway}px`, animation: `sway ${p.swayDur}s ease-in-out infinite` } as CSSProperties}>
            <PetalShape size={p.size} color={p.color} />
          </div>
        </div>
      ))}
    </div>
  )
}

export interface BurstSpec {
  id: number
  x: number
  y: number
  count?: number
  kinds?: ('heart' | 'sparkle' | 'petal')[]
  spread?: number
}

/** One-shot radial burst of hearts / sparkles / petals at (x, y) in the parent's coordinates. */
export function Burst({ x, y, count = 14, kinds = ['heart', 'sparkle'], spread = 140, onDone }: BurstSpec & { onDone?: () => void }) {
  // Randomize once per burst; parent re-renders must not reshuffle or restart it.
  const [parts] = useState(() =>
    Array.from({ length: count }, (_, i) => {
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.5
      const d = spread * (0.5 + Math.random() * 0.6)
      return {
        bx: Math.cos(a) * d,
        by: Math.sin(a) * d - spread * 0.25,
        kind: kinds[i % kinds.length],
        size: 12 + Math.random() * 14,
        dur: 0.8 + Math.random() * 0.5,
        color: HEART_COLORS[i % HEART_COLORS.length],
      }
    }),
  )
  const doneRef = useRef(onDone)
  doneRef.current = onDone
  useEffect(() => {
    const t = window.setTimeout(() => doneRef.current?.(), 1400)
    return () => window.clearTimeout(t)
  }, [])
  return (
    <div className="pointer-events-none absolute z-40" style={{ left: x, top: y }} aria-hidden>
      {parts.map((p, i) => (
        <div
          key={i}
          className="absolute left-0 top-0"
          style={{ '--bx': `${p.bx}px`, '--by': `${p.by}px`, animation: `burst ${p.dur}s cubic-bezier(.15,.8,.3,1) forwards` } as CSSProperties}
        >
          {p.kind === 'heart' ? (
            <HeartShape size={p.size} color={p.color} />
          ) : p.kind === 'sparkle' ? (
            <SparkleShape size={p.size} color={i % 2 ? '#ffe08a' : '#fff'} />
          ) : (
            <PetalShape size={p.size * 0.8} color="#fbb6c8" />
          )}
        </div>
      ))}
    </div>
  )
}

/** Manage a list of bursts; returns [elements, fire(x, y, opts)]. */
export function useBursts() {
  const [bursts, setBursts] = useState<BurstSpec[]>([])
  const fire = (x: number, y: number, opts: Partial<BurstSpec> = {}) => {
    setBursts((b) => [...b, { id: Date.now() + Math.random(), x, y, ...opts }])
  }
  const els = bursts.map((b) => <Burst key={b.id} {...b} onDone={() => setBursts((list) => list.filter((x) => x.id !== b.id))} />)
  return [els, fire] as const
}
