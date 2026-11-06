import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { audio } from '../audio'
import { Ambient, useBursts } from '../components/Ambient'
import { AUD_H, AUD_W, Audience } from '../components/Audience'
import { rng } from '../components/Decor'
import { MuteButton } from '../components/MuteButton'

// The final illustration is the user's own artwork (public/ref/2.webp, 1672 x 941).
// It carries the only two lines of text on this screen:
//   "Happy 8th Anniversary!"  and  "See you on our Wedding Day!"
const SRC = '/ref/2.webp'
const IW = 1672
const IH = 941
const COUPLE = { x: 0, w: 960 } // left part: the couple
const SIGN = { x: 900, w: 772 } // right part: the anniversary sign

function useViewport() {
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight })
  useEffect(() => {
    const on = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return vp
}

function Crop({ part, width, mask }: { part: { x: number; w: number }; width: number; mask: string }) {
  const scale = width / part.w
  return (
    <div
      className="relative overflow-hidden"
      style={{ width, height: IH * scale, WebkitMaskImage: mask, maskImage: mask }}
    >
      <img src={SRC} alt="" draggable={false} className="absolute top-0 max-w-none" style={{ width: IW * scale, height: IH * scale, left: -part.x * scale }} />
    </div>
  )
}

function Bokeh() {
  const dots = useMemo(() => {
    const r = rng(77)
    return Array.from({ length: 26 }, () => ({
      left: r() * 100,
      top: r() * 38,
      size: 10 + r() * 26,
      dur: 2.5 + r() * 3,
      delay: -r() * 4,
      col: r() < 0.6 ? 'rgba(255,240,190,0.85)' : 'rgba(255,205,220,0.8)',
    }))
  }, [])
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {dots.map((d, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${d.left}%`,
            top: `${d.top}%`,
            width: d.size,
            height: d.size,
            background: `radial-gradient(circle, ${d.col} 0%, rgba(255,240,190,0) 70%)`,
            animation: `glow ${d.dur}s ease-in-out ${d.delay}s infinite`,
            filter: 'blur(1px)',
          }}
        />
      ))}
    </div>
  )
}

export function Ending({ onPlayAgain }: { onPlayAgain: () => void }) {
  const vp = useViewport()
  const [showReplay, setShowReplay] = useState(false)
  const [bursts, fire] = useBursts()
  const rootRef = useRef<HTMLDivElement>(null)
  const portrait = vp.w / vp.h < 0.95
  // The seated wedding party fills a band along the bottom; the picture sits above it.
  const bandH = portrait ? Math.min(vp.h * 0.34, vp.w * 0.62) : Math.min(vp.h * 0.46, vp.w * 0.28)
  const bandW = (bandH * AUD_W) / AUD_H
  const picH = vp.h - bandH * 0.7
  const cheer = (x: number, y: number) => {
    const r = rootRef.current?.getBoundingClientRect()
    if (r) fire(x - r.left, y - r.top, { count: 10, kinds: ['heart', 'sparkle'], spread: 110 })
  }

  useEffect(() => {
    const t1 = window.setTimeout(() => audio.sfx('chime'), 1200)
    const t2 = window.setTimeout(() => setShowReplay(true), 6000)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [])

  useEffect(() => {
    if (!showReplay) return
    const onKey = (e: KeyboardEvent) => {
      if ((e.code === 'Enter' || e.code === 'Space') && (e.target as HTMLElement)?.tagName !== 'BUTTON') {
        e.preventDefault()
        onPlayAgain()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showReplay, onPlayAgain])

  // Layout: whole picture on wide screens; couple above sign on tall screens.
  let content: JSX.Element
  if (portrait) {
    const overlap = 0.12
    const coupleH = (w: number) => (IH * w) / COUPLE.w
    const signH = (w: number) => (IH * w) / SIGN.w
    const avail = picH * 0.96
    const total = (w: number) => coupleH(w) + signH(w) * (1 - overlap)
    const w = Math.min(vp.w, avail / (total(1) || 1))
    content = (
      <div className="flex flex-col items-center" style={{ width: w }}>
        <Crop part={COUPLE} width={w} mask="linear-gradient(to bottom, #000 82%, transparent 100%)" />
        <div style={{ marginTop: -signH(w) * overlap }}>
          <Crop part={SIGN} width={w} mask="linear-gradient(to bottom, transparent 0%, #000 12%, #000 100%)" />
        </div>
      </div>
    )
  } else {
    const s = Math.min((vp.w * 0.98) / IW, (picH * 0.97) / IH)
    content = (
      // the outer fade melts the bottom edge into the lawn behind the seats
      <div style={{ WebkitMaskImage: 'linear-gradient(to bottom, #000 87%, transparent 100%)', maskImage: 'linear-gradient(to bottom, #000 87%, transparent 100%)' }}>
        <img
          src={SRC}
          alt="The groom kissing the bride's cheek in a rose garden, beside a floral sign"
          draggable={false}
          className="block"
          style={{ width: IW * s, height: IH * s, WebkitMaskImage: 'radial-gradient(ellipse 72% 76% at 50% 50%, #000 82%, transparent 100%)', maskImage: 'radial-gradient(ellipse 72% 76% at 50% 50%, #000 82%, transparent 100%)' }}
        />
      </div>
    )
  }

  return (
    <div ref={rootRef} className="absolute inset-0 overflow-hidden bg-[#fff4ec]">
      {/* soft blurred fill behind the picture */}
      <img src={SRC} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover opacity-80" style={{ filter: 'blur(22px) saturate(1.1)' }} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#fff8ea]/40 via-transparent to-[#ffe6ee]/40" />

      <div
        className="absolute inset-x-0 top-0 flex items-center justify-center"
        role="img"
        aria-label="Happy 8th Anniversary! See you on our Wedding Day!"
        style={{ height: picH, animation: 'ken-burns 24s ease-in-out infinite alternate' }}
      >
        {content}
      </div>

      {/* warm golden light */}
      <div
        className="pointer-events-none absolute -inset-[20%]"
        style={{
          background: 'conic-gradient(from 200deg at 15% -5%, rgba(255,236,170,0) 0deg, rgba(255,236,170,0.35) 12deg, rgba(255,236,170,0) 24deg, rgba(255,236,170,0.28) 40deg, rgba(255,236,170,0) 55deg, rgba(255,236,170,0.3) 72deg, rgba(255,236,170,0) 90deg)',
          mixBlendMode: 'screen',
          animation: 'rays 9s ease-in-out infinite',
        }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse at 20% 0%, rgba(255,226,160,0.35), rgba(255,226,160,0) 55%)', mixBlendMode: 'screen' } as CSSProperties} aria-hidden />
      <Bokeh />

      {/* bridesmaids, groomsmen and guests in their seats */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2" style={{ width: bandW, height: bandH }}>
        <Audience onCheer={cheer} />
      </div>

      <Ambient petals={26} hearts={12} sparkles={18} butterflies={5} seed={88} />

      <div className="absolute right-3 z-40" style={{ top: 'max(12px, env(safe-area-inset-top))' }}>
        <MuteButton />
      </div>

      <div className="absolute inset-x-0 flex justify-center" style={{ bottom: 'max(14px, env(safe-area-inset-bottom))' }}>
        {showReplay && (
          <button
            type="button"
            onClick={() => {
              audio.sfx('click')
              onPlayAgain()
            }}
            className="anim-fade rounded-full border-2 border-white/80 bg-white/55 px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] text-blush-600 shadow-[0_4px_14px_rgba(214,77,119,0.2)] backdrop-blur-sm transition hover:bg-white/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blush-400 sm:text-sm"
          >
            Play again
          </button>
        )}
      </div>
      {bursts}
    </div>
  )
}
