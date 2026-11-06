import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { audio } from '../audio'
import { S } from '../assets'
import { ITEMS, type ItemId } from '../items'
import { Ambient, useBursts } from '../components/Ambient'
import { Backdrop } from '../components/Backdrop'
import { FairyLights, HeartShape } from '../components/Decor'
import { MuteButton } from '../components/MuteButton'

// Dress first, then veil, accessories, bouquet; then the complete look.
const ORDER: { id: ItemId; caption: string }[] = [
  { id: 'dress', caption: 'First, the dress…' },
  { id: 'shoes', caption: 'Bridal shoes, a perfect fit' },
  { id: 'veil', caption: 'The veil, soft as a cloud' },
  { id: 'tiara', caption: 'A sparkling tiara' },
  { id: 'earrings', caption: 'Pearl earrings' },
  { id: 'perfume', caption: 'A spritz of perfume' },
  { id: 'rings', caption: 'The rings, kept safe' },
  { id: 'bouquet', caption: 'And the bouquet…' },
]

/** A sheer veil flowing behind the bride, wider than her silhouette. Box is relative to the bride image. */
function Veil({ style }: { style: CSSProperties }) {
  return (
    <svg
      viewBox="0 0 100 160"
      preserveAspectRatio="none"
      className="pointer-events-none absolute anim-fade"
      style={{ ...style, filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.9))' }}
      aria-hidden
    >
      <defs>
        <linearGradient id="veil-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="0.6" stopColor="#fbfcff" stopOpacity="0.8" />
          <stop offset="1" stopColor="#eef2ff" stopOpacity="0.62" />
        </linearGradient>
      </defs>
      <path
        d="M40 3 Q50 -1 60 3 Q78 30 86 70 Q94 112 100 150 Q90 158 75 154 Q62 159 50 155 Q38 159 25 154 Q10 158 0 150 Q6 112 14 70 Q22 30 40 3 Z"
        fill="url(#veil-g)"
        stroke="#dfe3f5"
        strokeWidth={0.7}
      />
      <path d="M2 149 Q12 155 25 152 Q38 157 50 153 Q62 157 75 152 Q88 155 98 149" fill="none" stroke="#e6d9ef" strokeWidth={1.4} strokeDasharray="1.5 1.5" />
      {Array.from({ length: 16 }, (_, i) => (
        <circle key={i} cx={12 + ((i * 41) % 76)} cy={50 + ((i * 29) % 95)} r={0.9} fill="#fff" />
      ))}
    </svg>
  )
}

export function Prep({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(-1) // -1: intro, 0..7 items applied, 8: complete look
  const [flying, setFlying] = useState<ItemId | null>(null)
  const [bursts, fire] = useBursts()
  const stageRef = useRef<HTMLDivElement>(null)
  const brideRef = useRef<HTMLDivElement>(null)
  const done = step >= ORDER.length

  const applied = new Set(ORDER.slice(0, Math.max(0, step + 1)).map((o) => o.id))
  const hasDress = applied.has('dress')
  const complete = done
  const brideSrc = complete ? 'bride_main' : hasDress ? 'bride_idle' : 'bridec_idle'

  // advance through the steps
  useEffect(() => {
    if (done) return
    const delay = step === -1 ? 1300 : 1500
    const t = window.setTimeout(() => {
      const next = step + 1
      if (next < ORDER.length) {
        setFlying(ORDER[next].id)
        window.setTimeout(() => {
          setFlying(null)
          setStep(next)
          audio.sfx(next === 0 ? 'pickup' : 'sparkle')
          burstOnBride(next === 0 ? 30 : 14)
        }, 650)
      } else {
        setStep(next)
        audio.sfx('complete')
        burstOnBride(36)
      }
    }, delay)
    return () => window.clearTimeout(t)
  }, [step, done])

  const burstOnBride = (count: number) => {
    const b = brideRef.current?.getBoundingClientRect()
    const s = stageRef.current?.getBoundingClientRect()
    if (!b || !s) return
    fire(b.left - s.left + b.width / 2, b.top - s.top + b.height * 0.4, { count, kinds: ['sparkle', 'heart', 'sparkle'], spread: Math.max(140, b.width) })
  }

  useEffect(() => {
    if (!done) return
    const onKey = (e: KeyboardEvent) => {
      if ((e.code === 'Enter' || e.code === 'Space') && (e.target as HTMLElement)?.tagName !== 'BUTTON') {
        e.preventDefault()
        audio.sfx('click')
        onDone()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [done, onDone])

  const caption = step === -1 ? 'Let’s get you ready…' : done ? null : ORDER[step].caption

  return (
    <div ref={stageRef} className="absolute inset-0 overflow-hidden">
      <Backdrop mood="golden" horizon={0.6} seed={9} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 55%, rgba(255,255,255,0.75) 0%, rgba(255,240,245,0.35) 45%, rgba(255,214,226,0.25) 100%)' }} />
      <FairyLights from={[-20, 20]} to={[1020, 20]} sag={50} count={20} viewBox="0 0 1000 300" className="h-[34%]" seed={4} />
      <Ambient petals={12} sparkles={16} butterflies={2} seed={8} />
      <div className="absolute right-3 z-40" style={{ top: 'max(12px, env(safe-area-inset-top))' }}>
        <MuteButton />
      </div>

      <div className="relative flex h-full flex-col items-center px-4" style={{ paddingTop: 'max(16px, env(safe-area-inset-top))', paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}>
        <div className="mt-2 min-h-14 px-11 text-center sm:mt-4 sm:min-h-16 sm:px-0">
          {caption && (
            <p key={caption} className="anim-rise font-script text-3xl font-bold text-blush-600 drop-shadow-[0_2px_0_#fff] sm:text-4xl">
              {caption}
            </p>
          )}
          {done && (
            <h2 className="anim-pop font-script text-[34px] font-bold leading-tight text-blush-600 drop-shadow-[0_2px_0_#fff] sm:text-5xl">You’re ready for your special day!</h2>
          )}
        </div>

        {/* stage with item ring around the bride */}
        <div className="relative w-full flex-1">
          <div className="absolute left-1/2 top-1/2 aspect-square h-[min(96%,96vw)] -translate-x-1/2 -translate-y-1/2">
            {/* platform */}
            <div className="absolute bottom-[4%] left-1/2 h-[12%] w-[62%] -translate-x-1/2 rounded-[50%] bg-white/70 shadow-[0_8px_24px_rgba(214,77,119,0.2)] ring-4 ring-blush-200" />
            {/* item ring */}
            {ORDER.map((o, i) => {
              const def = ITEMS.find((d) => d.id === o.id)!
              const a = -Math.PI / 2 + (i / ORDER.length) * Math.PI * 2
              const isApplied = applied.has(o.id)
              const isFlying = flying === o.id
              const left = isFlying ? 50 : 50 + Math.cos(a) * 44
              const top = isFlying ? 42 : 50 + Math.sin(a) * 44
              return (
                <div
                  key={o.id}
                  className="absolute flex h-[15%] w-[15%] items-center justify-center rounded-full border-[3px] border-blush-200 bg-white/85 shadow-md"
                  style={{
                    left: `${left}%`,
                    top: `${top}%`,
                    transform: `translate(-50%, -50%) scale(${isFlying ? 0.4 : isApplied ? 0.82 : 1})`,
                    opacity: isApplied ? 0.35 : 1,
                    transition: 'left .6s cubic-bezier(.5,0,.5,1), top .6s cubic-bezier(.5,0,.5,1), transform .6s ease, opacity .4s ease',
                    zIndex: isFlying ? 20 : 1,
                  }}
                >
                  <img src={S(def.sprite)} alt={def.name} className="max-h-[70%] max-w-[72%] object-contain" />
                  {isApplied && (
                    <div className="absolute -right-1 -top-1">
                      <HeartShape size={18} color="#ec6a90" />
                    </div>
                  )}
                </div>
              )
            })}
            {/* bride */}
            <div ref={brideRef} className="absolute bottom-[8%] left-1/2 h-[74%] -translate-x-1/2" style={{ aspectRatio: complete ? '398/576' : '176/262' }}>
              {applied.has('veil') && (
                <Veil style={complete ? { left: '-14%', top: '4%', width: '128%', height: '92%' } : { left: '-18%', top: '3%', width: '136%', height: '95%' }} />
              )}
              <img
                key={brideSrc}
                src={S(brideSrc)}
                alt={complete ? 'The bride in her complete wedding look' : 'The bride getting ready'}
                className={`relative h-full w-full object-contain ${complete ? 'anim-pop' : 'anim-fade'}`}
                style={{ filter: 'drop-shadow(0 6px 10px rgba(214,77,119,0.18))' }}
              />
              {applied.has('tiara') && (
                <img
                  src={S('item_tiara')}
                  alt=""
                  className="anim-pop absolute"
                  style={complete ? { left: '33%', top: '0.5%', width: '30%' } : { left: '30%', top: '0%', width: '38%' }}
                />
              )}
            </div>
          </div>
        </div>

        <div className="h-16 shrink-0">
          {done && (
            <button
              type="button"
              autoFocus
              className="pill-btn anim-pop text-lg sm:text-xl"
              onClick={() => {
                audio.sfx('click')
                onDone()
              }}
            >
              Let’s get married!
              <span className="play-dot">
                <HeartShape size={15} color="#ec6a90" />
              </span>
            </button>
          )}
        </div>
      </div>
      {bursts}
    </div>
  )
}
