import { useMemo, useState, type MouseEvent } from 'react'
import { GROOMSMEN, GUESTS, MAIDS, S, type ChairColor } from '../assets'
import { audio } from '../audio'

// Design space for the seating, drawn as one SVG. Scale 1 is the front row.
export const AUD_W = 2400
export const AUD_H = 600
const AISLE = AUD_W / 2
const CHAIR_W = 118
const CHAIR_H = CHAIR_W * 1.825 // chair sprite aspect (height / width)
const CHAR_H = 310
const SHOW = 0.68 // share of a character drawn above the chair back

interface Seat {
  key: string
  sprite: string
  chair: ChairColor
  x: number
  bottom: number
  s: number
  flip?: boolean
  delay: number
}

function guestChair(sprite: string, i: number): ChairColor {
  if (sprite.includes('green')) return 'green'
  if (sprite.includes('lav')) return 'lav'
  return i % 2 ? 'green' : 'lav'
}

function buildSeats(): Seat[] {
  const seats: Seat[] = []
  let d = 0
  const delay = () => -((d++ * 0.73) % 3.6)
  // Everyone faces the viewer, i.e. the couple. Back row: guests in sage green and lavender,
  // set between the front seats so they stay visible.
  let gi = 0
  const nextGuest = () => GUESTS[gi++ % GUESTS.length]
  const back = { bottom: 448, s: 0.8, gap: 124, start: 92 }
  for (let i = 0; i < 6; i++) {
    for (const side of [-1, 1]) {
      const sprite = nextGuest()
      seats.push({ key: `bg${side}${i}`, sprite, chair: guestChair(sprite, gi), x: AISLE + side * (back.start + i * back.gap), bottom: back.bottom, s: back.s, flip: (i + (side > 0 ? 1 : 0)) % 3 === 0, delay: delay() })
    }
  }
  // Front row (nearest the couple): bridesmaids in blue on the bride's side, groomsmen in barong on the groom's side.
  // The chairs run a little past the bottom edge, so the bows show and the outfits stay large.
  const front = { bottom: AUD_H + 70, s: 1, gap: 150, start: 156 }
  MAIDS.slice(0, 5).forEach((m, i) => seats.push({ key: `m${i}`, sprite: m, chair: 'blue', x: AISLE - front.start - i * front.gap, bottom: front.bottom, s: front.s, delay: delay() }))
  GROOMSMEN.slice(0, 5).forEach((g, i) => seats.push({ key: `g${i}`, sprite: g, chair: 'gold', x: AISLE + front.start + i * front.gap, bottom: front.bottom, s: front.s, flip: i % 2 === 1, delay: delay() }))
  return seats
}

function SeatView({ seat, onTap }: { seat: Seat; onTap: (e: MouseEvent<SVGGElement>) => void }) {
  const [hop, setHop] = useState(0)
  const { x, bottom, s } = seat
  const cw = CHAIR_W * s
  const chH = CHAIR_H * s
  const chairTop = bottom - chH
  const h = CHAR_H * s
  const w = h * 0.68
  const top = chairTop - h * SHOW
  return (
    <g
      role="button"
      aria-label={seat.key.startsWith('m') ? 'Bridesmaid' : seat.key.startsWith('g') ? 'Groomsman' : 'Guest'}
      className="cursor-pointer"
      onClick={(e) => {
        setHop((v) => v + 1)
        onTap(e)
      }}
    >
      <ellipse cx={x} cy={bottom - 4 * s} rx={cw * 0.62} ry={10 * s} fill="#5f7d4a" opacity={0.18} />
      <g key={hop} className={hop ? 'seat-hop' : ''} style={{ transformBox: 'fill-box' }}>
        <g className="seat-sway" style={{ transformBox: 'fill-box', animationDelay: `${seat.delay}s` }}>
          <image
            href={S(seat.sprite)}
            x={x - w / 2}
            y={top}
            width={w}
            height={h}
            preserveAspectRatio="xMidYMin meet"
            transform={seat.flip ? `translate(${2 * x} 0) scale(-1 1)` : undefined}
          />
        </g>
      </g>
      <image href={S(`chair_${seat.chair}`)} x={x - cw / 2} y={chairTop} width={cw} height={chH} preserveAspectRatio="xMidYMax meet" />
    </g>
  )
}

/**
 * Seated wedding party facing the couple: bridesmaids (blue) and groomsmen (beige barong)
 * in the row nearest the couple, guests in sage green and lavender in front. Tap anyone for a little hop.
 */
export function Audience({ onCheer }: { onCheer?: (x: number, y: number) => void }) {
  const seats = useMemo(buildSeats, [])
  const rows = [seats.filter((s) => s.s < 1), seats.filter((s) => s.s === 1)] // back row first
  const tap = (e: MouseEvent<SVGGElement>) => {
    audio.sfx(Math.random() < 0.5 ? 'pop' : 'kiss')
    const r = e.currentTarget.getBoundingClientRect()
    onCheer?.(r.left + r.width / 2, r.top + r.height * 0.15)
  }
  return (
    <svg viewBox={`0 0 ${AUD_W} ${AUD_H}`} className="h-full w-full overflow-visible" aria-label="The bridesmaids, groomsmen and guests in their seats">
      <defs>
        <linearGradient id="aud-lawn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d8ecc4" stopOpacity="0" />
          <stop offset="0.28" stopColor="#d8ecc4" stopOpacity="0.92" />
          <stop offset="1" stopColor="#b7d99c" />
        </linearGradient>
        <linearGradient id="aud-runner" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.25" stopColor="#fff4f6" stopOpacity="0.95" />
          <stop offset="1" stopColor="#ffe3ea" />
        </linearGradient>
      </defs>
      {/* lawn and petal aisle */}
      <rect x={-400} y={90} width={AUD_W + 800} height={AUD_H + 110} fill="url(#aud-lawn)" />
      <path d={`M ${AISLE - 60} 230 L ${AISLE + 60} 230 L ${AISLE + 120} ${AUD_H + 40} L ${AISLE - 120} ${AUD_H + 40} Z`} fill="url(#aud-runner)" />
      {Array.from({ length: 34 }, (_, i) => {
        const t = ((i * 37) % 34) / 34
        const y = 280 + t * (AUD_H - 280)
        const half = 60 + t * 60
        return <ellipse key={i} cx={AISLE + ((((i * 53) % 100) / 100) - 0.5) * half * 1.6} cy={y} rx={5 + t * 6} ry={3 + t * 3} fill={i % 3 ? '#f9a8bf' : '#fff'} opacity={0.9} />
      })}

      {/* party props at the far ends: lanterns, gifts and the cake */}
      <image href={S('prop_lantern')} x={200} y={330} width={130} height={240} preserveAspectRatio="xMidYMax meet" />
      <image href={S('prop_basket')} x={120} y={470} width={120} height={120} preserveAspectRatio="xMidYMax meet" />
      <image href={S('prop_gift')} x={300} y={480} width={100} height={100} preserveAspectRatio="xMidYMax meet" />
      <image href={S('prop_cakestand')} x={1985} y={130} width={240} height={440} preserveAspectRatio="xMidYMax meet" />
      <image href={S('prop_gift')} x={2140} y={490} width={96} height={96} preserveAspectRatio="xMidYMax meet" />
      <image href={S('prop_lantern')} x={2210} y={360} width={110} height={210} preserveAspectRatio="xMidYMax meet" />

      {rows.map((row) => row.map((seat) => <SeatView key={seat.key} seat={seat} onTap={tap} />))}
    </svg>
  )
}
