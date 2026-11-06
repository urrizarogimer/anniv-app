import { useMemo } from 'react'
import { RoseBush, rng } from './Decor'

type Mood = 'day' | 'golden' | 'dusk'

const SKIES: Record<Mood, [string, string, string]> = {
  day: ['#bfe1f7', '#e6f2fb', '#fff4f2'],
  golden: ['#ffd9c2', '#ffe9d6', '#fff6e8'],
  dusk: ['#c9b6e8', '#f2c4d6', '#ffe3d6'],
}

/**
 * Full-bleed garden backdrop: sky, clouds, hills, blossom trees and grass.
 * Uses `slice` so it always covers; keep important props outside of it.
 */
export function Backdrop({ mood = 'day', horizon = 0.55, seed = 5 }: { mood?: Mood; horizon?: number; seed?: number }) {
  const H = 1000
  const W = 1600
  const hy = H * horizon
  const trees = useMemo(() => {
    const r = rng(seed)
    return Array.from({ length: 16 }, (_, i) => ({
      x: (i / 15) * W + (r() - 0.5) * 80,
      s: 0.7 + r() * 0.6,
      pink: r() < 0.55,
      seed: Math.floor(r() * 1000),
    }))
  }, [seed])
  const bushes = useMemo(() => {
    const r = rng(seed + 2)
    return Array.from({ length: 9 }, (_, i) => ({ x: (i / 8) * W + (r() - 0.5) * 120, w: 120 + r() * 120, seed: Math.floor(r() * 999) }))
  }, [seed])
  const [s0, s1, s2] = SKIES[mood]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <linearGradient id={`sky-${mood}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={s0} />
          <stop offset="0.6" stopColor={s1} />
          <stop offset="1" stopColor={s2} />
        </linearGradient>
        <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#cfe6b8" />
          <stop offset="1" stopColor="#a8d08f" />
        </linearGradient>
        <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fffbe6" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fff2c2" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#sky-${mood})`} />
      <circle cx={W * 0.78} cy={hy * 0.35} r={mood === 'day' ? 160 : 260} fill="url(#sun)" />
      {/* clouds */}
      {[
        [220, 120, 1],
        [760, 80, 0.8],
        [1260, 150, 1.1],
      ].map(([x, y, s], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`} opacity={mood === 'dusk' ? 0.6 : 0.9}>
          <ellipse cx={0} cy={0} rx={70} ry={26} fill="#fff" />
          <ellipse cx={-40} cy={8} rx={44} ry={20} fill="#fff" />
          <ellipse cx={45} cy={6} rx={50} ry={22} fill="#fff" />
          <ellipse cx={10} cy={-16} rx={40} ry={24} fill="#fff" />
        </g>
      ))}
      {/* far hills */}
      <path d={`M0 ${hy - 40} Q 300 ${hy - 140} 620 ${hy - 60} T 1200 ${hy - 90} T 1600 ${hy - 50} V ${H} H 0 Z`} fill="#d7ebc8" />
      {/* blossom tree line */}
      {trees.map((t, i) => (
        <g key={i} transform={`translate(${t.x} ${hy - 10}) scale(${t.s})`}>
          <rect x={-7} y={-70} width={14} height={72} rx={6} fill="#b48a6a" />
          <circle cx={0} cy={-100} r={58} fill={t.pink ? '#f9c6d4' : '#b9d99f'} />
          <circle cx={-38} cy={-78} r={40} fill={t.pink ? '#fbd5e0' : '#c6e2ad'} />
          <circle cx={40} cy={-80} r={42} fill={t.pink ? '#f6b7c9' : '#acd193'} />
          <circle cx={-12} cy={-128} r={30} fill="#fff" opacity={0.35} />
          {t.pink &&
            [0, 1, 2, 3, 4].map((k) => <circle key={k} cx={-40 + k * 20} cy={-100 + ((k * 37) % 50) - 20} r={6} fill="#fff" opacity={0.75} />)}
        </g>
      ))}
      {/* lawn */}
      <path d={`M0 ${hy} Q 400 ${hy - 30} 800 ${hy} T 1600 ${hy} V ${H} H 0 Z`} fill="url(#grass)" />
      {bushes.map((b, i) => (
        <RoseBush key={i} x={b.x} y={hy + 26} w={b.w} seed={b.seed} />
      ))}
      {mood !== 'day' && <rect width={W} height={H} fill={mood === 'golden' ? '#ffcf8a' : '#b38bd6'} opacity={0.08} />}
    </svg>
  )
}
