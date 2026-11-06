import { useEffect, useMemo, useState } from 'react'
import { audio } from '../audio'
import { KD_GROUP, S } from '../assets'
import { Ambient } from '../components/Ambient'
import { rng } from '../components/Decor'
import { TROPHY_NAME } from './data'
import { TreasureIcon } from './TreasureIcon'

const CONFETTI = ['#f78aa8', '#c9a7ff', '#9fd0f2', '#ffe08a', '#fff', '#fdb0c4', '#b8e0a8']

function Confetti({ n = 70 }: { n?: number }) {
  const bits = useMemo(() => {
    const r = rng(2024)
    return Array.from({ length: n }, (_, i) => ({
      left: r() * 100,
      delay: -r() * 4,
      dur: 3.2 + r() * 2.6,
      w: 6 + r() * 6,
      h: 9 + r() * 8,
      color: CONFETTI[i % CONFETTI.length],
      drift: (r() - 0.5) * 160,
      spin: (r() < 0.5 ? -1 : 1) * (360 + r() * 540),
      round: r() < 0.3,
    }))
  }, [n])
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {bits.map((b, i) => (
        <span
          key={i}
          className="kd-confetti absolute top-0"
          style={
            {
              left: `${b.left}%`,
              width: b.w,
              height: b.round ? b.w : b.h,
              borderRadius: b.round ? '50%' : 2,
              background: b.color,
              boxShadow: b.color === '#fff' ? '0 0 0 1px #f3d4dd' : undefined,
              animationDuration: `${b.dur}s`,
              animationDelay: `${b.delay}s`,
              '--drift': `${b.drift}px`,
              '--spin': `${b.spin}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}

/** All eight stars found: group photo, confetti, the K-Drama Queen title and the Super Fan Trophy. */
export function KFinale({ onMount, onReturn, onStay }: { onMount: () => void; onReturn: () => void; onStay: () => void }) {
  const [flash, setFlash] = useState(true)
  const [trophy, setTrophy] = useState(false)
  useEffect(() => {
    onMount()
    audio.sfx('chime')
    const t1 = window.setTimeout(() => setFlash(false), 450)
    const t2 = window.setTimeout(() => {
      setTrophy(true)
      audio.sfx('sparkle')
    }, 1300)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center overflow-y-auto px-3 py-4" style={{ background: 'radial-gradient(ellipse at 50% 35%, rgba(255,246,252,0.92), rgba(222,206,250,0.94))' }} role="dialog" aria-modal="true" aria-label="K-drama challenge completed">
      <Ambient petals={10} hearts={14} sparkles={16} seed={808} />
      <Confetti />
      <div className="relative flex w-full max-w-2xl flex-col items-center gap-2 text-center sm:gap-3">
        <div className="anim-pop rounded-full bg-gradient-to-r from-[#9b72e8] to-blush-500 px-4 py-1.5 text-sm font-extrabold uppercase tracking-wider text-white shadow-lg sm:text-lg">
          K-Drama Challenge Completed!
        </div>

        {/* the group photo */}
        <figure className="anim-rise relative w-full rotate-[-1.5deg] rounded-2xl bg-white p-2 pb-8 shadow-xl sm:p-3 sm:pb-10">
          <div className="relative overflow-hidden rounded-xl" style={{ background: 'linear-gradient(180deg, #fde7f0 0%, #ece4fb 60%, #dcebd2 100%)' }}>
            <div className="flex items-end justify-center gap-0 px-2 pt-4">
              <img src={KD_GROUP} alt="All eight K-drama stars posing together" className="kd-cheer-group relative z-0 w-[78%] object-contain" />
              <img src={S('bridec_celebrate')} alt="The bride celebrating with them" className="anim-bob relative z-10 -ml-[3%] w-[20%] object-contain" />
            </div>
            {flash && <div className="absolute inset-0 bg-white" style={{ animation: 'fade-in .45s ease reverse both' }} />}
          </div>
          <figcaption className="absolute inset-x-0 bottom-1.5 font-script text-xl font-bold text-[#8f5fc4] sm:bottom-2 sm:text-2xl">You’re officially our K-Drama Queen! 👑</figcaption>
        </figure>

        {/* the trophy */}
        <div className={`flex items-center gap-3 rounded-3xl bg-white/90 px-4 py-2 shadow-lg transition-all duration-700 ${trophy ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`} style={{ transitionTimingFunction: 'cubic-bezier(.3,1.6,.5,1)' }}>
          <div className="relative">
            <div className="kd-rays absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2" aria-hidden />
            <TreasureIcon id="trophy" size={64} className="anim-bob relative" />
          </div>
          <div className="text-left">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-blush-500 sm:text-xs">Final reward unlocked</div>
            <div className="text-base font-extrabold uppercase text-dusty-800 sm:text-lg">{TROPHY_NAME}</div>
            <div className="text-xs text-dusty-600 sm:text-sm">Added to your treasures 💜</div>
          </div>
        </div>

        <div className="mt-1 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            autoFocus
            className="pill-btn text-sm uppercase sm:text-base"
            onClick={() => {
              audio.sfx('click')
              onReturn()
            }}
          >
            Return to wedding garden
            <span className="play-dot">
              <svg viewBox="0 0 24 24" width={14} height={14} aria-hidden>
                <path d="M8 5l11 7-11 7z" fill="#ec6a90" />
              </svg>
            </span>
          </button>
          <button type="button" className="rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-[#7d55d6] shadow hover:bg-white" onClick={onStay}>
            Keep exploring
          </button>
        </div>
      </div>
    </div>
  )
}
