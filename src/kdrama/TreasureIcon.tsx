import type { CSSProperties, ReactNode } from 'react'
import type { TreasureId } from './data'

// Hand-drawn treasure icons in the game's pastel palette (64 x 64 design grid).
const INK = '#6b5a7e'
const GOLD = '#e8c56f'
const GOLD_D = '#c49a4d'

function Shine({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return <path d={`M${x} ${y - 5 * s}Q${x + 0.8 * s} ${y - 0.8 * s} ${x + 5 * s} ${y}Q${x + 0.8 * s} ${y + 0.8 * s} ${x} ${y + 5 * s}Q${x - 0.8 * s} ${y + 0.8 * s} ${x - 5 * s} ${y}Q${x - 0.8 * s} ${y - 0.8 * s} ${x} ${y - 5 * s}Z`} fill="#fff" />
}

function Chain({ d }: { d: string }) {
  return <path d={d} fill="none" stroke={GOLD_D} strokeWidth={2} strokeDasharray="2.5 2" strokeLinecap="round" />
}

const HEART = 'M32 52C14 40 9 31 9 23c0-7 5-12 11.5-12 5 0 9 3 11.5 7 2.5-4 6.5-7 11.5-7C50 11 55 16 55 23c0 8-5 17-23 29Z'

const ICONS: Record<TreasureId | 'trophy', ReactNode> = {
  letter: (
    <>
      <rect x={8} y={17} width={48} height={34} rx={5} fill="#fff8ef" stroke={INK} strokeWidth={2.2} />
      <path d="M9 19l23 17 23-17" fill="#ffeef3" stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
      <path d="M9 50l17-14M55 50L38 36" stroke={INK} strokeWidth={1.6} opacity={0.5} />
      <path d="M32 44c-7-4.5-9-8-9-11 0-2.6 2-4.5 4.4-4.5 2 0 3.6 1.2 4.6 2.8 1-1.6 2.6-2.8 4.6-2.8 2.4 0 4.4 1.9 4.4 4.5 0 3-2 6.5-9 11z" fill="#f2789c" stroke="#c94f74" strokeWidth={1.5} />
      <Shine x={47} y={12} s={0.9} />
    </>
  ),
  star: (
    <>
      <Chain d="M14 6Q20 30 32 30Q44 30 50 6" />
      <circle cx={32} cy={32} r={3} fill={GOLD} stroke={GOLD_D} strokeWidth={1.4} />
      <path d="M32 33l5.4 10.6 11.8 1.7-8.6 8.3 2 11.6L32 59.8l-10.6 5.6 2-11.6-8.6-8.3 11.8-1.7z" transform="translate(0 -4)" fill="#ffe08a" stroke={GOLD_D} strokeWidth={2} strokeLinejoin="round" />
      <circle cx={32} cy={48} r={3.6} fill="#c9b4ff" stroke="#8d72d6" strokeWidth={1.3} />
      <Shine x={46} y={36} s={0.8} />
    </>
  ),
  brooch: (
    <>
      {[0, 72, 144, 216, 288].map((r) => (
        <ellipse key={r} cx={32} cy={19} rx={9} ry={13} transform={`rotate(${r} 32 32)`} fill="#ffd9a8" stroke={GOLD_D} strokeWidth={2} />
      ))}
      {[36, 108, 180, 252, 324].map((r) => (
        <ellipse key={r} cx={32} cy={22} rx={5} ry={8} transform={`rotate(${r} 32 32)`} fill={GOLD} stroke={GOLD_D} strokeWidth={1.5} />
      ))}
      <circle cx={32} cy={32} r={7.5} fill="#f9a8bf" stroke="#d6668a" strokeWidth={2} />
      <circle cx={30} cy={30} r={2.2} fill="#fff" opacity={0.8} />
      <Shine x={50} y={12} s={0.9} />
    </>
  ),
  royalbox: (
    <>
      <path d="M20 18l4 8 8-10 8 10 4-8 2 12H18z" fill="#ffe08a" stroke={GOLD_D} strokeWidth={2} strokeLinejoin="round" />
      <circle cx={20} cy={17} r={2.4} fill="#f9a8bf" />
      <circle cx={32} cy={14} r={2.6} fill="#9fd0f2" />
      <circle cx={44} cy={17} r={2.4} fill="#f9a8bf" />
      <rect x={10} y={30} width={44} height={11} rx={3} fill="#cdb8f5" stroke={INK} strokeWidth={2} />
      <rect x={12} y={40} width={40} height={17} rx={3} fill="#b9a1ee" stroke={INK} strokeWidth={2} />
      <rect x={10} y={33} width={44} height={4} fill={GOLD} />
      <rect x={28} y={36} width={8} height={10} rx={2} fill={GOLD} stroke={GOLD_D} strokeWidth={1.5} />
      <circle cx={32} cy={41} r={1.5} fill={INK} />
      <Shine x={50} y={24} s={0.8} />
    </>
  ),
  crystal: (
    <>
      <Chain d="M12 6Q18 26 32 27Q46 26 52 6" />
      <circle cx={32} cy={28} r={2.6} fill={GOLD} stroke={GOLD_D} strokeWidth={1.3} />
      <path d="M32 31l11 12-11 17-11-17z" fill="#bfe3f7" stroke="#6fa7cf" strokeWidth={2} strokeLinejoin="round" />
      <path d="M21 43h22M32 31l-4 12 4 17 4-17z" fill="none" stroke="#6fa7cf" strokeWidth={1.2} />
      <path d="M28 43l4-12 4 12z" fill="#e6f5fd" />
      <Shine x={44} y={34} s={1} />
      <Shine x={19} y={52} s={0.6} />
    </>
  ),
  charm: (
    <>
      {/* a bokjumeoni: the Korean lucky pouch */}
      <path d="M22 22c-6 6-11 14-11 22 0 9 9 14 21 14s21-5 21-14c0-8-5-16-11-22z" fill="#ffe08a" stroke={GOLD_D} strokeWidth={2.2} strokeLinejoin="round" />
      <path d="M21 22c3-5 7-8 11-8s8 3 11 8c-3 2-7 3-11 3s-8-1-11-3z" fill="#f9a8bf" stroke="#d6668a" strokeWidth={2} />
      <path d="M22 25c6 2 14 2 20 0" stroke="#d6668a" strokeWidth={2.4} fill="none" strokeLinecap="round" />
      <path d="M38 26c3 3 3 9 1 13M41 26c4 2 5 9 4 13" stroke="#d6668a" strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <circle cx={32} cy={42} r={7} fill="#fff6d6" stroke={GOLD_D} strokeWidth={1.6} />
      <text x={32} y={45.5} textAnchor="middle" fontSize={10} fontWeight={800} fill="#d6668a" fontFamily="sans-serif">福</text>
      <Shine x={14} y={20} s={0.8} />
    </>
  ),
  keepsake: (
    <>
      <Chain d="M22 6Q27 12 32 12Q37 12 42 6" />
      <circle cx={32} cy={13} r={2.6} fill={GOLD} stroke={GOLD_D} strokeWidth={1.3} />
      <path d={HEART} transform="translate(32 34) scale(0.78) translate(-32 -32)" fill="#fdb0c4" stroke={GOLD_D} strokeWidth={3} />
      <path d={HEART} transform="translate(32 34) scale(0.52) translate(-32 -32)" fill="#f78aa8" />
      <circle cx={32} cy={33} r={2.6} fill={INK} />
      <path d="M31 34.5h2l1 5h-4z" fill={INK} />
      <Shine x={46} y={22} s={0.9} />
    </>
  ),
  sapphire: (
    <>
      <ellipse cx={32} cy={42} rx={17} ry={14} fill="none" stroke={GOLD} strokeWidth={5} />
      <ellipse cx={32} cy={42} rx={17} ry={14} fill="none" stroke={GOLD_D} strokeWidth={1.2} />
      <path d="M24 26l8-12 8 12-8 6z" fill="#7fa8f0" stroke="#4a6fc0" strokeWidth={2} strokeLinejoin="round" />
      <path d="M24 26h16M28 20l4 12 4-12" fill="none" stroke="#4a6fc0" strokeWidth={1.1} />
      <path d="M26 25l6-9 3 9z" fill="#b8d0fb" />
      <path d="M22 27l3 3M42 27l-3 3" stroke={GOLD_D} strokeWidth={2} />
      <Shine x={46} y={14} s={1} />
      <Shine x={17} y={34} s={0.6} />
    </>
  ),
  trophy: (
    <>
      <path d="M18 12h28v10c0 10-6 17-14 17s-14-7-14-17z" fill="#ffe08a" stroke={GOLD_D} strokeWidth={2.2} />
      <path d="M18 15H10c0 8 4 13 10 13M46 15h8c0 8-4 13-10 13" fill="none" stroke={GOLD_D} strokeWidth={2.4} />
      <path d="M29 38h6v7h-6z" fill={GOLD} stroke={GOLD_D} strokeWidth={1.6} />
      <rect x={20} y={45} width={24} height={12} rx={2.5} fill="#b9a1ee" stroke={INK} strokeWidth={2} />
      <path d="M32 17l2.2 4.4 4.8.7-3.5 3.4.8 4.8-4.3-2.3-4.3 2.3.8-4.8-3.5-3.4 4.8-.7z" fill="#fff" />
      <path d="M25 51h14" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
      <path d="M20 22c0 5 2 9 5 11" stroke="#fff" strokeWidth={2} fill="none" opacity={0.6} strokeLinecap="round" />
      <Shine x={52} y={8} s={1} />
    </>
  ),
}

export function TreasureIcon({ id, size = 48, className = '', style }: { id: TreasureId | 'trophy'; size?: number; className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} style={style} aria-hidden>
      {ICONS[id]}
    </svg>
  )
}

/** A treasure chest whose lid swings open when `open` is set. */
export function Chest({ open, size = 150 }: { open: boolean; size?: number }) {
  return (
    <svg viewBox="0 0 120 100" width={size} height={(size * 100) / 120} aria-hidden style={{ overflow: 'visible' }}>
      <ellipse cx={60} cy={94} rx={46} ry={6} fill="rgba(107,90,126,0.18)" />
      {/* body */}
      <rect x={14} y={46} width={92} height={46} rx={8} fill="#cdb8f5" stroke={INK} strokeWidth={3} />
      <rect x={14} y={58} width={92} height={7} fill={GOLD} />
      <rect x={24} y={46} width={8} height={46} fill={GOLD} opacity={0.85} />
      <rect x={88} y={46} width={8} height={46} fill={GOLD} opacity={0.85} />
      <rect x={52} y={54} width={16} height={18} rx={4} fill="#ffe08a" stroke={GOLD_D} strokeWidth={2} />
      <path d={HEART} transform="translate(60 62) scale(0.16) translate(-32 -32)" fill="#f78aa8" />
      {/* glow from inside */}
      <ellipse cx={60} cy={47} rx={40} ry={7} fill="#fff6d6" style={{ opacity: open ? 1 : 0, transition: 'opacity .4s .25s' }} />
      {/* lid */}
      <g style={{ transformOrigin: '14px 46px', transformBox: 'view-box', transform: open ? 'rotate(-28deg) translate(-6px,-10px)' : 'none', transition: 'transform .55s cubic-bezier(.3,1.6,.5,1)' }}>
        <path d="M14 46V34c0-14 20-22 46-22s46 8 46 22v12z" fill="#b9a1ee" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        <path d="M24 46V22M96 46V22" stroke={GOLD} strokeWidth={8} />
        <path d="M14 40h92" stroke={GOLD} strokeWidth={6} />
        <path d="M30 22c8-5 18-6 26-6" stroke="#fff" strokeWidth={3} strokeLinecap="round" opacity={0.55} fill="none" />
      </g>
    </svg>
  )
}
