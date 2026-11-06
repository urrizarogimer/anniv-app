import { useEffect, useRef, useState } from 'react'
import { audio } from '../audio'
import { S } from '../assets'
import { Ambient, useBursts } from '../components/Ambient'
import { Backdrop } from '../components/Backdrop'
import { Chair, FairyLights, FlowerArch } from '../components/Decor'
import { MuteButton } from '../components/MuteButton'

/** The ceremony venue in the distance: arch, petal aisle and two rows of chairs. */
function Venue() {
  const rows = [
    { y: 64, s: 0.55 },
    { y: 74, s: 0.68 },
    { y: 86, s: 0.82 },
  ]
  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <linearGradient id="aisle" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffe3ea" />
            <stop offset="1" stopColor="#fff6f8" />
          </linearGradient>
        </defs>
        <path d="M44 58 L56 58 L72 100 L28 100 Z" fill="url(#aisle)" stroke="#f6c9d6" strokeWidth={0.4} />
        {Array.from({ length: 26 }, (_, i) => (
          <ellipse key={i} cx={36 + ((i * 37) % 28)} cy={62 + ((i * 53) % 37)} rx={0.9} ry={0.55} fill={i % 2 ? '#f9a8bf' : '#fff'} />
        ))}
      </svg>
      <div className="absolute left-1/2 top-0 h-[62%] w-[52%] -translate-x-1/2">
        <FlowerArch />
      </div>
      {rows.map((r, i) => (
        <div key={i}>
          {[0, 1].map((k) => (
            <div key={k} className="absolute" style={{ top: `${r.y}%`, left: `${(k === 0 ? 30 - i * 7 : 70 + i * 7) - r.s * 6}%`, width: `${r.s * 12}%`, height: `${r.s * 18}%` }}>
              <Chair flip={k === 1} />
            </div>
          ))}
          {[0, 1].map((k) => (
            <div key={`b${k}`} className="absolute" style={{ top: `${r.y}%`, left: `${(k === 0 ? 14 - i * 9 : 86 + i * 9) - r.s * 6}%`, width: `${r.s * 12}%`, height: `${r.s * 18}%` }}>
              <Chair flip={k === 1} />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export function Opening({ onBegin }: { onBegin: () => void }) {
  const [leaving, setLeaving] = useState(false)
  const [bursts, fire] = useBursts()
  const btnRef = useRef<HTMLButtonElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  const begin = () => {
    if (leaving) return
    audio.unlock()
    audio.sfx('whoosh')
    setLeaving(true)
    const b = btnRef.current?.getBoundingClientRect()
    const w = wrapRef.current?.getBoundingClientRect()
    if (b && w) {
      const x = b.left - w.left + b.width / 2
      const y = b.top - w.top + b.height / 2
      fire(x, y, { count: 22, kinds: ['heart', 'sparkle', 'petal'], spread: 220 })
      window.setTimeout(() => fire(x, y - 80, { count: 16, kinds: ['heart', 'sparkle'], spread: 280 }), 180)
    }
    window.setTimeout(onBegin, 650)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.code === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter') && (e.target as HTMLElement)?.tagName !== 'BUTTON') {
        e.preventDefault()
        begin()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div ref={wrapRef} className="absolute inset-0 overflow-hidden">
      <Backdrop mood="day" horizon={0.56} />
      <FairyLights from={[-20, 30]} to={[1020, 40]} sag={60} count={22} viewBox="0 0 1000 400" className="h-[40%]" />
      <Ambient petals={18} butterflies={4} sparkles={10} seed={3} />

      <div className="absolute right-3 z-40" style={{ top: 'max(12px, env(safe-area-inset-top))' }}>
        <MuteButton />
      </div>

      <div className="relative flex h-full flex-col items-center px-4" style={{ paddingTop: 'max(14px, env(safe-area-inset-top))', paddingBottom: 'max(18px, env(safe-area-inset-bottom))' }}>
        {/* title banner (from the user's style sheet) */}
        <h1 className="anim-bob mt-2 w-[min(84vw,460px)] shrink-0 sm:mt-4">
          <img src={S('ui_banner')} alt="Our Wedding Day 11.28.26" className="w-full drop-shadow-[0_8px_16px_rgba(214,77,119,0.25)]" />
        </h1>

        {/* stage: venue in the distance, bride from behind looking at it */}
        <div className="relative w-full max-w-5xl flex-1">
          <div className="absolute bottom-[30%] right-[0%] aspect-[1/0.9] h-[58%] max-w-[72%] sm:bottom-[14%] sm:right-[8%] sm:h-[74%]">
            <Venue />
          </div>
          <img
            src={S('anim_veil')}
            alt="The bride, seen from behind, looking at the wedding venue"
            className="absolute bottom-0 left-[1%] h-[min(66%,330px)] object-contain sm:left-[10%] sm:h-[min(100%,440px)]"
            style={{ filter: 'drop-shadow(0 10px 10px rgba(90,120,70,0.25))' }}
          />
        </div>

        <div className="soft-card anim-rise flex w-full max-w-md shrink-0 items-center gap-3 px-4 py-3">
          <img src={S('face_0')} alt="" className="h-14 w-14 shrink-0 rounded-full bg-blush-100 object-cover" />
          <p className="text-[15px] font-bold leading-snug text-dusty-800 sm:text-base">
            Every love story leads to a beautiful beginning. Today, your forever starts.
          </p>
        </div>

        <button
          ref={btnRef}
          type="button"
          onClick={begin}
          className="pill-btn anim-pulse-soft mt-4 shrink-0 text-lg sm:text-xl"
          style={{ animationPlayState: leaving ? 'paused' : 'running' }}
        >
          Begin our forever
          <span className="play-dot">
            <svg viewBox="0 0 24 24" width={16} height={16} aria-hidden>
              <path d="M8 5l11 7-11 7z" fill="#ec6a90" />
            </svg>
          </span>
        </button>
      </div>
      {bursts}
    </div>
  )
}
