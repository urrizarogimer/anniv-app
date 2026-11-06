import { useEffect, useRef, useState } from 'react'
import { audio } from '../audio'
import { S } from '../assets'
import { Ambient, useBursts } from '../components/Ambient'
import { Backdrop } from '../components/Backdrop'
import { Chair, FairyLights, FlowerArch, HeartShape, RoseBush } from '../components/Decor'
import { MuteButton } from '../components/MuteButton'

// This game is an 8th-anniversary gift (Nov 22). The wedding itself is on Nov 28, 2026,
// so the bride reaches the start of the aisle and is gently stopped: not yet!
type Phase = 'walk' | 'wait' | 'card'

const WALK_MS = 3800
const WEDDING = new Date(2026, 10, 28) // local midnight, Nov 28 2026
// The aisle runs from the bottom of the screen up to the arch. Positions are % of the stage.
const AISLE_TOP = 47
const ROWS = [0, 1, 2, 3, 4]

function rowY(i: number) {
  // perspective spacing: rows get closer together toward the arch
  const t = (i + 1) / (ROWS.length + 0.6)
  return AISLE_TOP + 4 + Math.pow(t, 1.35) * (100 - AISLE_TOP)
}

function daysToWedding() {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((WEDDING.getTime() - today.getTime()) / 86400000)
}

function countdownLabel() {
  const d = daysToWedding()
  if (d > 1) return `${d} more days to go`
  if (d === 1) return 'Just one more day!'
  if (d === 0) return 'It’s today!'
  return null
}

/** Nov 22 → Nov 28 strip: anniversary ring on 22, heart on 28. */
function DateStrip() {
  const days = [22, 23, 24, 25, 26, 27, 28]
  return (
    <div className="flex items-end justify-center gap-1 sm:gap-1.5">
      {days.map((d) => {
        const first = d === 22
        const last = d === 28
        return (
          <div key={d} className="flex flex-col items-center gap-1">
            <div
              className={`relative flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold sm:h-10 sm:w-10 ${
                last ? 'bg-blush-500 text-white shadow-[0_4px_10px_rgba(236,106,144,0.45)]' : first ? 'bg-white text-blush-600 ring-2 ring-champagne-400' : 'bg-white/70 text-dusty-600'
              }`}
            >
              {d}
              {last && (
                <span className="absolute -right-1.5 -top-2 anim-pulse-soft">
                  <HeartShape size={14} color="#ec6a90" />
                </span>
              )}
            </div>
            <span className={`h-3 text-[10px] font-bold uppercase leading-none tracking-wide ${last ? 'text-blush-600' : 'text-dusty-600'}`}>
              {first ? 'Nov' : last ? 'Nov' : ''}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function Ceremony({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>('walk')
  const [progress, setProgress] = useState(0)
  const [bursts, fire] = useBursts()
  const stageRef = useRef<HTMLDivElement>(null)
  const brideRef = useRef<HTMLDivElement>(null)
  const countdown = countdownLabel()

  // the bride walks up to the start of the aisle
  useEffect(() => {
    if (phase !== 'walk') return
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / WALK_MS)
      setProgress(p)
      if (p < 1) raf = requestAnimationFrame(tick)
      else setPhase('wait')
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [phase])

  // "Wait!" — the music stops, then the note appears
  useEffect(() => {
    if (phase !== 'wait') return
    audio.stopMusic()
    audio.sfx('pop')
    const t = window.setTimeout(() => {
      setPhase('card')
      audio.playMusic('opening')
      audio.sfx('chime')
      const s = stageRef.current?.getBoundingClientRect()
      const b = brideRef.current?.getBoundingClientRect()
      if (s && b) fire(b.left - s.left + b.width / 2, b.top - s.top + b.height * 0.3, { count: 16, kinds: ['heart', 'sparkle'], spread: 160 })
    }, 1500)
    return () => window.clearTimeout(t)
  }, [phase])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.code === 'Enter' || e.code === 'Space') && (e.target as HTMLElement)?.tagName !== 'BUTTON') {
        e.preventDefault()
        if (phase === 'walk') {
          setProgress(1)
          setPhase('wait')
        } else if (phase === 'card') onDone()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, onDone])

  // bride path: from below the screen up to the first row of chairs
  const ease = 1 - Math.pow(1 - progress, 2)
  const brideBottom = -8 + ease * 14 // % from bottom
  const stepBob = phase === 'walk' && progress < 1 ? Math.abs(Math.sin(progress * Math.PI * 10)) * 6 : 0
  const stopped = phase !== 'walk'

  return (
    <div
      ref={stageRef}
      className="absolute inset-0 overflow-hidden"
      onClick={() => {
        if (phase === 'walk' && progress > 0.2) {
          setProgress(1)
          setPhase('wait')
        }
      }}
    >
      <Backdrop mood="golden" horizon={0.5} seed={13} />
      <FairyLights from={[-20, 40]} to={[1020, 40]} sag={70} count={24} viewBox="0 0 1000 400" className="h-[46%]" seed={2} />
      <FairyLights from={[-20, 110]} to={[1020, 100]} sag={60} count={20} viewBox="0 0 1000 400" className="h-[46%]" seed={6} />

      {/* aisle */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <linearGradient id="runner" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffe3ea" />
            <stop offset="1" stopColor="#fffaf6" />
          </linearGradient>
        </defs>
        <path d={`M46 ${AISLE_TOP} L54 ${AISLE_TOP} L78 100 L22 100 Z`} fill="url(#runner)" stroke="#f6c9d6" strokeWidth={0.3} />
        {Array.from({ length: 60 }, (_, i) => {
          const t = ((i * 37) % 60) / 60
          const y = AISLE_TOP + t * (100 - AISLE_TOP)
          const half = 4 + t * 24
          return <ellipse key={i} cx={50 + (((i * 53) % 100) / 100 - 0.5) * half * 1.7} cy={y} rx={0.3 + t * 0.7} ry={0.2 + t * 0.4} fill={i % 3 ? '#f9a8bf' : '#fff'} />
        })}
      </svg>
      {/* arch + groom waiting */}
      <div className="absolute left-1/2 aspect-[220/260] -translate-x-1/2" style={{ bottom: `${100 - AISLE_TOP - 1}%`, height: '34%' }}>
        <FlowerArch seed={5} />
        <img
          src={S(stopped ? 'groom_love' : 'groom_idle')}
          alt="The groom waiting at the altar"
          className="absolute bottom-[1%] left-1/2 h-[58%] -translate-x-1/2 object-contain"
        />
      </div>
      {/* chairs */}
      {ROWS.map((i) => {
        const y = rowY(i)
        const s = 0.4 + ((y - AISLE_TOP) / (100 - AISLE_TOP)) * 1.2
        const t = (y - AISLE_TOP) / (100 - AISLE_TOP)
        const edge = 4 + t * 24 // aisle half-width in %
        return (
          <div key={i}>
            {[-1, 1].map((side) =>
              [0, 1, 2].map((k) => (
                <div
                  key={`${side}${k}`}
                  className="absolute"
                  style={{
                    top: `${y - 7 * s}%`,
                    left: `calc(${50 + side * (edge + 2 + k * 6.5 * s)}% - ${side < 0 ? 4.8 * s : 0}vmin)`,
                    width: `${4.8 * s}vmin`,
                    height: `${7.4 * s}vmin`,
                    zIndex: Math.round(y),
                  }}
                >
                  <Chair flip={side > 0} color={side < 0 ? (i < 2 ? 'blue' : k % 2 ? 'lav' : 'green') : i < 2 ? 'gold' : k % 2 ? 'green' : 'lav'} />
                </div>
              )),
            )}
          </div>
        )
      })}
      {/* floral posts at the front */}
      <svg viewBox="0 0 100 40" preserveAspectRatio="xMidYMax meet" className="absolute bottom-0 left-0 h-[18%] w-[30%]" aria-hidden style={{ zIndex: 99 }}>
        <RoseBush x={40} y={40} w={60} seed={4} />
      </svg>
      <svg viewBox="0 0 100 40" preserveAspectRatio="xMidYMax meet" className="absolute bottom-0 right-0 h-[18%] w-[30%]" aria-hidden style={{ zIndex: 99 }}>
        <RoseBush x={60} y={40} w={60} seed={8} />
      </svg>
      {/* bride, seen from behind */}
      <div
        ref={brideRef}
        className="absolute"
        style={{
          left: '50%',
          bottom: `${brideBottom}%`,
          height: 'min(46%, 92vw)',
          aspectRatio: '244/320',
          transform: `translate(-50%, ${-stepBob}px)`,
          transformOrigin: '50% 100%',
          zIndex: 100,
        }}
      >
        <img src={S('anim_veil')} alt="The bride at the start of the aisle" className="h-full w-full object-contain" style={{ filter: 'drop-shadow(0 8px 8px rgba(120,90,60,0.25))' }} />
        {phase === 'wait' && (
          <div className="anim-pop absolute -top-[6%] left-[62%] flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-white bg-champagne-300 text-2xl font-bold text-white shadow-lg sm:h-14 sm:w-14">
            !
          </div>
        )}
      </div>

      <Ambient petals={22} butterflies={3} seed={17} />

      {/* "not yet" note */}
      {phase === 'card' && (
        <div className="absolute inset-0 z-[120] flex items-center justify-center bg-white/20 px-4">
          <div className="soft-card anim-pop flex w-full max-w-md flex-col items-center gap-3 px-5 py-5 text-center sm:px-7 sm:py-6">
            <div className="flex items-center gap-3">
              <img src={S('face_10')} alt="" className="h-16 w-16 shrink-0 rounded-full bg-blush-100 object-cover sm:h-20 sm:w-20" />
              <h2 className="font-script text-4xl font-bold leading-none text-blush-600 sm:text-5xl">Wait… not yet!</h2>
            </div>
            <p className="text-[15px] font-bold leading-snug text-dusty-800 sm:text-base">
              Today we celebrate our 8th anniversary. Our walk down this aisle is saved for November 28.
            </p>
            <DateStrip />
            {countdown && (
              <p className="rounded-full bg-blush-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blush-600 ring-1 ring-blush-200">{countdown}</p>
            )}
            <button
              type="button"
              autoFocus
              className="pill-btn anim-pulse-soft mt-1 text-base sm:text-lg"
              onClick={(e) => {
                e.stopPropagation()
                audio.sfx('click')
                onDone()
              }}
            >
              Until then…
              <span className="play-dot">
                <HeartShape size={15} color="#ec6a90" />
              </span>
            </button>
          </div>
        </div>
      )}

      <div className="absolute right-3 z-[130]" style={{ top: 'max(12px, env(safe-area-inset-top))' }}>
        <MuteButton />
      </div>
      {bursts}
    </div>
  )
}
