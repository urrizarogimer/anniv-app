import { useMemo, type CSSProperties } from 'react'
import { S, type ChairColor } from '../assets'

// Small deterministic random generator so decorations look the same on every render.
export function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

export const ROSE_COLORS = [
  ['#f9a8bf', '#ec6a90'],
  ['#ffd1dd', '#f39ab4'],
  ['#fffaf2', '#eedfcf'],
  ['#ffe3ea', '#f5b1c4'],
  ['#fff1d6', '#ecd4a0'],
]

/** A single cartoon rose (SVG group), centered on (x, y). */
export function Rose({ x, y, r, c = 0 }: { x: number; y: number; r: number; c?: number }) {
  const [fill, line] = ROSE_COLORS[c % ROSE_COLORS.length]
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill={fill} stroke={line} strokeWidth={Math.max(0.6, r * 0.12)} />
      <path
        d={`M ${-r * 0.55} ${r * 0.1} Q 0 ${-r * 0.75} ${r * 0.55} ${r * 0.05} M ${-r * 0.3} ${r * 0.35} Q ${r * 0.1} ${-r * 0.25} ${r * 0.35} ${r * 0.3} M ${-r * 0.12} ${-r * 0.05} q ${r * 0.18} ${-r * 0.15} ${r * 0.24} ${r * 0.08}`}
        fill="none"
        stroke={line}
        strokeWidth={Math.max(0.6, r * 0.11)}
        strokeLinecap="round"
      />
      <circle cx={-r * 0.35} cy={-r * 0.4} r={r * 0.18} fill="#fff" opacity={0.55} />
    </g>
  )
}

export function Leaf({ x, y, s, rot }: { x: number; y: number; s: number; rot: number }) {
  return (
    <ellipse
      cx={x}
      cy={y}
      rx={s}
      ry={s * 0.45}
      transform={`rotate(${rot} ${x} ${y})`}
      fill="#9cc488"
      stroke="#6f9e5e"
      strokeWidth={0.8}
    />
  )
}

/** A bush of roses and leaves: a rounded mound centered at (x, y). */
export function RoseBush({ x, y, w, seed = 1, h }: { x: number; y: number; w: number; seed?: number; h?: number }) {
  const items = useMemo(() => {
    const r = rng(seed)
    const hh = h ?? w * 0.55
    const leaves = Array.from({ length: 14 }, () => ({
      x: (r() - 0.5) * w * 0.95,
      y: -r() * hh * 0.85,
      s: w * (0.07 + r() * 0.05),
      rot: r() * 180,
    }))
    const roses = Array.from({ length: Math.round(w / 14) + 4 }, () => {
      const a = r() * Math.PI
      const rad = 0.3 + r() * 0.7
      return {
        x: Math.cos(a) * (w / 2) * rad * 0.9,
        y: -Math.sin(a) * hh * rad * 0.85,
        r: w * (0.05 + r() * 0.045),
        c: Math.floor(r() * 5),
      }
    })
    return { leaves, roses, hh }
  }, [w, seed, h])
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx={0} cy={-items.hh * 0.38} rx={w / 2} ry={items.hh * 0.6} fill="#a9cf94" stroke="#7fae6a" strokeWidth={1.4} />
      <ellipse cx={-w * 0.12} cy={-items.hh * 0.55} rx={w * 0.28} ry={items.hh * 0.32} fill="#bfe0a9" opacity={0.7} />
      {items.leaves.map((l, i) => (
        <Leaf key={i} {...l} />
      ))}
      {items.roses.map((p, i) => (
        <Rose key={i} {...p} />
      ))}
    </g>
  )
}

/** Flower arch with draped curtains, in a 200 x 240 box (origin top-left). */
export function FlowerArch({ seed = 3 }: { seed?: number }) {
  const flowers = useMemo(() => {
    const r = rng(seed)
    const out: { x: number; y: number; r: number; c: number; leaf: boolean; rot: number }[] = []
    for (let i = 0; i <= 46; i++) {
      const t = i / 46
      const a = Math.PI * (1 - t)
      const cx = 100 + Math.cos(a) * 82
      const cy = 92 - Math.sin(a) * 78
      out.push({ x: cx + (r() - 0.5) * 14, y: cy + (r() - 0.5) * 12, r: 6 + r() * 6, c: Math.floor(r() * 5), leaf: r() < 0.5, rot: r() * 180 })
    }
    // posts
    for (const px of [18, 182]) {
      for (let i = 0; i < 14; i++) {
        out.push({ x: px + (r() - 0.5) * 16, y: 92 + i * 10 + r() * 6, r: 4.5 + r() * 5, c: Math.floor(r() * 5), leaf: r() < 0.6, rot: r() * 180 })
      }
    }
    return out
  }, [seed])
  return (
    <svg viewBox="-10 -10 220 260" className="h-full w-full overflow-visible" aria-hidden>
      {/* posts */}
      <rect x={12} y={90} width={12} height={150} rx={5} fill="#fffaf2" stroke="#e8d6c3" strokeWidth={1.5} />
      <rect x={176} y={90} width={12} height={150} rx={5} fill="#fffaf2" stroke="#e8d6c3" strokeWidth={1.5} />
      {/* arch frame */}
      <path d="M 18 92 A 82 78 0 0 1 182 92" fill="none" stroke="#fffaf2" strokeWidth={10} />
      <path d="M 18 92 A 82 78 0 0 1 182 92" fill="none" stroke="#e8d6c3" strokeWidth={1.2} />
      {/* curtains */}
      <path d="M 22 70 Q 50 120 34 238 L 16 238 Q 26 140 14 78 Z" fill="#fff" opacity={0.85} stroke="#f3dfe4" />
      <path d="M 178 70 Q 150 120 166 238 L 184 238 Q 174 140 186 78 Z" fill="#fff" opacity={0.85} stroke="#f3dfe4" />
      <path d="M 26 40 Q 100 92 174 40" fill="none" stroke="#fff" strokeWidth={7} opacity={0.75} />
      {flowers.map((f, i) =>
        f.leaf ? (
          <g key={i}>
            <Leaf x={f.x - 5} y={f.y + 3} s={f.r * 0.9} rot={f.rot} />
            <Rose x={f.x} y={f.y} r={f.r} c={f.c} />
          </g>
        ) : (
          <Rose key={i} x={f.x} y={f.y} r={f.r} c={f.c} />
        ),
      )}
    </svg>
  )
}

/** Covered wedding chair seen from behind, with a satin bow (art from the entourage sheet). Fills its box, bottom-aligned. */
export function Chair({ flip = false, color = 'blue' }: { flip?: boolean; color?: ChairColor }) {
  return (
    <img
      src={S(`chair_${color}`)}
      alt=""
      draggable={false}
      className="h-full w-full object-contain object-bottom"
      style={{ transform: flip ? 'scaleX(-1)' : undefined, filter: 'drop-shadow(0 3px 3px rgba(120,90,70,0.18))' }}
    />
  )
}

/** String of twinkling fairy lights between two points, drawn in a full-size SVG. */
export function FairyLights({
  from,
  to,
  sag = 40,
  count = 14,
  seed = 7,
  className = '',
  viewBox = '0 0 1000 300',
}: {
  from: [number, number]
  to: [number, number]
  sag?: number
  count?: number
  seed?: number
  className?: string
  viewBox?: string
}) {
  const pts = useMemo(() => {
    const r = rng(seed)
    return Array.from({ length: count }, (_, i) => {
      const t = (i + 0.5) / count
      const x = from[0] + (to[0] - from[0]) * t
      const y = from[1] + (to[1] - from[1]) * t + Math.sin(Math.PI * t) * sag
      return { x, y, d: r() * 2.4, c: r() < 0.5 ? '#fff3c4' : '#ffd6e2' }
    })
  }, [from, to, sag, count, seed])
  const mx = (from[0] + to[0]) / 2
  const my = (from[1] + to[1]) / 2 + sag * 2
  return (
    <svg viewBox={viewBox} preserveAspectRatio="none" className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} aria-hidden>
      <defs>
        <radialGradient id={`fl-glow-${seed}`}>
          <stop offset="0" stopColor="#fff8d8" stopOpacity="1" />
          <stop offset="1" stopColor="#ffe9a8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d={`M ${from[0]} ${from[1]} Q ${mx} ${my} ${to[0]} ${to[1]}`} fill="none" stroke="#8e7a6b" strokeWidth={1.2} opacity={0.6} />
      {pts.map((p, i) => (
        <g key={i} style={{ animation: `glow ${1.6 + p.d}s ease-in-out ${p.d}s infinite` }}>
          <circle cx={p.x} cy={p.y + 4} r={11} fill={`url(#fl-glow-${seed})`} />
          <circle cx={p.x} cy={p.y + 4} r={3.2} fill={p.c} />
        </g>
      ))}
    </svg>
  )
}

export function HeartShape({ size = 20, color = '#f78aa8', style, className = '' }: { size?: number; color?: string; style?: CSSProperties; className?: string }) {
  return (
    <svg viewBox="0 0 24 22" width={size} height={size} style={style} className={className} aria-hidden>
      <path
        d="M12 21s-8.5-5.3-10.6-10.2C-0.1 6.2 3 1.5 7.3 1.5c2.2 0 3.7 1.2 4.7 2.7 1-1.5 2.5-2.7 4.7-2.7 4.3 0 7.4 4.7 5.9 9.3C20.5 15.7 12 21 12 21z"
        fill={color}
        stroke="#fff"
        strokeWidth={1.2}
      />
      <ellipse cx={7} cy={6.5} rx={2.2} ry={1.4} fill="#fff" opacity={0.6} transform="rotate(-30 7 6.5)" />
    </svg>
  )
}

export function SparkleShape({ size = 18, color = '#ffe08a', style, className = '' }: { size?: number; color?: string; style?: CSSProperties; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={style} className={className} aria-hidden>
      <path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0 Z" fill={color} />
    </svg>
  )
}

export function PetalShape({ size = 16, color = '#fbb6c8', style }: { size?: number; color?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 20 24" width={size} height={size * 1.2} style={style} aria-hidden>
      <path d="M10 1 C17 6 19 15 10 23 C1 15 3 6 10 1 Z" fill={color} />
      <path d="M10 4 C11 10 11 15 10 20" stroke="#fff" strokeWidth={1} opacity={0.5} fill="none" />
    </svg>
  )
}

export function ButterflyShape({ size = 34, hue = 'pink' }: { size?: number; hue?: 'pink' | 'blue' | 'gold' }) {
  const cols = { pink: ['#ffb3c8', '#f78aa8'], blue: ['#bcd3f2', '#7fa4dd'], gold: ['#fff1b8', '#f2cf72'] }[hue]
  return (
    <svg viewBox="0 0 40 32" width={size} height={size * 0.8} aria-hidden className="overflow-visible">
      <g style={{ transformOrigin: '20px 16px', animation: 'flap 0.32s ease-in-out infinite' }}>
        <path d="M20 16 C12 0 0 2 3 12 C5 18 14 18 20 16 Z" fill={cols[0]} stroke={cols[1]} strokeWidth={1.2} />
        <path d="M20 16 C28 0 40 2 37 12 C35 18 26 18 20 16 Z" fill={cols[0]} stroke={cols[1]} strokeWidth={1.2} />
        <path d="M20 17 C14 20 7 28 11 30 C15 32 19 24 20 17 Z" fill={cols[0]} stroke={cols[1]} strokeWidth={1.2} />
        <path d="M20 17 C26 20 33 28 29 30 C25 32 21 24 20 17 Z" fill={cols[0]} stroke={cols[1]} strokeWidth={1.2} />
        <circle cx={9} cy={9} r={2.4} fill="#fff" opacity={0.7} />
        <circle cx={31} cy={9} r={2.4} fill="#fff" opacity={0.7} />
      </g>
      <rect x={19} y={9} width={2} height={15} rx={1} fill="#6b5a6e" />
      <path d="M20 9 Q17 3 15 2 M20 9 Q23 3 25 2" stroke="#6b5a6e" strokeWidth={0.8} fill="none" />
    </svg>
  )
}
