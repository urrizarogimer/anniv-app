import { useEffect, useMemo, useRef, useState } from 'react'
import { audio } from '../audio'
import { img, S } from '../assets'
import { useBursts } from '../components/Ambient'
import { HeartShape, SparkleShape } from '../components/Decor'
import { RIGHT_TEXT, TREASURES, WRONG_TEXT, hintFor, quizChoices, type Actor, type TreasureId } from './data'
import { Chest, TreasureIcon } from './TreasureIcon'

type Step = 'greet' | 'line' | 'quiz' | 'right' | 'chest' | 'revisit' | 'replay'
type Mood = 'idle' | 'happy' | 'oops'

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Types text out letter by letter. Returns the visible part, whether it's done, and a skip function. */
function useTypewriter(text: string, cps = 38) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (reduced()) {
      setN(text.length)
      return
    }
    setN(0)
    let i = 0
    const id = window.setInterval(() => {
      i += 1
      setN(i)
      if (i >= text.length) window.clearInterval(id)
    }, 1000 / cps)
    return () => window.clearInterval(id)
  }, [text, cps])
  return { shown: text.slice(0, n), done: n >= text.length, skip: () => setN(text.length) }
}

function Bubble({ text, tone = 'white', onSkip }: { text: string; tone?: 'white' | 'pink' | 'lav'; onSkip?: () => void }) {
  const bg = tone === 'pink' ? '#fff0f4' : tone === 'lav' ? '#f4efff' : '#fff'
  const border = tone === 'pink' ? '#f6b7c9' : '#d9cbf5'
  return (
    <div
      className="relative rounded-3xl border-2 px-4 py-3 text-[15px] font-bold leading-snug text-dusty-800 shadow-sm sm:text-base"
      style={{ background: bg, borderColor: border }}
      onClick={onSkip}
    >
      {text}
      <span aria-hidden className="absolute -left-2 top-6 hidden h-4 w-4 rotate-45 border-b-2 border-l-2 sm:block" style={{ background: bg, borderColor: border }} />
    </div>
  )
}

function LineCard({ actor, typed, credit, compact }: { actor: Actor; typed: string; credit: boolean; compact?: boolean }) {
  return (
    <figure
      className={`relative overflow-hidden rounded-3xl text-white shadow-lg ${compact ? 'px-4 py-2.5' : 'px-5 py-4'}`}
      style={{ background: 'linear-gradient(135deg, #5b4a8f 0%, #8a64c9 55%, #d784b0 100%)' }}
    >
      <div className="mb-1 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/80 sm:text-[11px]">
        <img src={S('kd_clapper')} alt="" className="h-5 w-5 object-contain" />A line inspired by my drama
      </div>
      <blockquote className={`font-bold italic leading-snug ${compact ? 'text-sm sm:text-[15px]' : 'text-base sm:text-lg'}`}>
        “{typed}”
      </blockquote>
      {credit && (
        <figcaption className="mt-1.5 text-xs font-bold text-white/85 sm:text-sm">
          {actor.name} · “{actor.drama}” ({actor.year})
        </figcaption>
      )}
      <span className="anim-twinkle absolute right-3 top-2" aria-hidden>
        <SparkleShape size={12} color="#fff3c4" />
      </span>
    </figure>
  )
}

/** The actor's figure, framed from the knees up. Expression changes with the mood. */
function ActorFigure({ actor, mood, talking, height }: { actor: Actor; mood: Mood; talking: boolean; height: number }) {
  const sprite = `kd_${actor.id}_${mood}`
  const nat = img(sprite)?.naturalHeight || 356
  const k = (height * 1.22) / 360
  return (
    <div className="relative overflow-hidden rounded-[28px]" style={{ height, background: `radial-gradient(ellipse at 50% 30%, #fff 0%, ${actor.tint} 70%)` }}>
      <span className="anim-twinkle absolute left-3 top-3" aria-hidden>
        <SparkleShape size={14} color="#fff" />
      </span>
      <span className="anim-twinkle absolute right-4 top-8" style={{ animationDelay: '0.7s' }} aria-hidden>
        <HeartShape size={14} color="#f9a8bf" />
      </span>
      <div className="absolute inset-x-0 top-[6%] flex justify-center">
        <img
          key={sprite}
          src={S(sprite)}
          alt=""
          draggable={false}
          className={`${talking ? 'kd-talk' : mood === 'happy' ? 'kd-cheer' : mood === 'oops' ? 'kd-oops' : 'kd-breathe'}`}
          style={{ height: nat * k, transformOrigin: '50% 100%' }}
        />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10" style={{ background: `linear-gradient(to top, ${actor.tint}, transparent)` }} />
    </div>
  )
}

export function ActorChat({
  actor,
  found,
  onFound,
  onClose,
}: {
  actor: Actor
  found: boolean
  onFound: () => void
  /** `treasure` is set when the chest was just opened, with where its icon is on screen. */
  onClose: (gift?: { id: TreasureId; x: number; y: number }) => void
}) {
  const [step, setStep] = useState<Step>(found ? 'revisit' : 'greet')
  const [wrong, setWrong] = useState<string[]>([])
  const [mood, setMood] = useState<Mood>(found ? 'happy' : 'idle')
  const [chestOpen, setChestOpen] = useState(false)
  const choices = useMemo(() => quizChoices(actor), [actor])
  const [bursts, fire] = useBursts()
  const wrapRef = useRef<HTMLDivElement>(null)
  const giftRef = useRef<HTMLDivElement>(null)
  const treasure = TREASURES[actor.treasure]
  const narrow = typeof window !== 'undefined' && window.innerWidth < 640

  const bubbleText =
    step === 'greet'
      ? actor.greeting
      : step === 'quiz' && wrong.length
        ? `${actor.nudge} ${hintFor(actor, wrong.length)}`
        : step === 'right'
          ? actor.wish
          : step === 'revisit'
            ? `Welcome back, beautiful bride! ${actor.wish}`
            : step === 'replay'
              ? 'Here it is again, just for you!'
              : ''
  const bubble = useTypewriter(bubbleText)
  const line = useTypewriter(step === 'line' || step === 'replay' ? actor.line : '', 32)
  const talking = (!bubble.done && !!bubbleText) || (!line.done && (step === 'line' || step === 'replay'))

  const close = (gift?: boolean) => {
    audio.sfx('click')
    if (gift && giftRef.current) {
      const r = giftRef.current.getBoundingClientRect()
      onClose({ id: actor.treasure, x: r.left + r.width / 2, y: r.top + r.height / 2 })
    } else onClose()
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  useEffect(() => {
    if (step === 'line' || step === 'replay') audio.sfx('sting')
    if (step === 'chest') {
      const t1 = window.setTimeout(() => {
        setChestOpen(true)
        audio.sfx('chest')
        const r = giftRef.current?.getBoundingClientRect()
        const w = wrapRef.current?.getBoundingClientRect()
        if (r && w) fire(r.left - w.left + r.width / 2, r.top - w.top + r.height / 2, { count: 20, kinds: ['sparkle', 'heart'], spread: 200 })
      }, 700)
      return () => window.clearTimeout(t1)
    }
  }, [step]) // eslint-disable-line react-hooks/exhaustive-deps

  const answer = (id: string, el: HTMLElement) => {
    if (wrong.includes(id)) return
    if (id === actor.id) {
      audio.sfx('complete')
      setMood('happy')
      setStep('right')
      onFound()
      const r = el.getBoundingClientRect()
      const w = wrapRef.current!.getBoundingClientRect()
      fire(r.left - w.left + r.width / 2, r.top - w.top + r.height / 2, { count: 26, kinds: ['heart', 'sparkle', 'petal'], spread: 260 })
      window.setTimeout(() => fire(w.width / 2, w.height * 0.35, { count: 22, kinds: ['heart', 'sparkle'], spread: 320 }), 220)
    } else {
      audio.sfx('oops')
      setMood('oops')
      setWrong((w) => [...w, id])
    }
  }

  const figureH = narrow ? 168 : 330
  const nameKnown = found || step === 'right' || step === 'chest'

  const primary = 'pill-btn text-sm sm:text-base'
  const lav = { background: 'linear-gradient(180deg, #c9a7ff 0%, #9b72e8 55%, #7d55d6 100%)', boxShadow: '0 6px 0 #5f3fb0, 0 12px 24px rgba(95,63,176,0.35)' }
  const Play = ({ color = '#7d55d6' }: { color?: string }) => (
    <span className="play-dot">
      <svg viewBox="0 0 24 24" width={14} height={14} aria-hidden>
        <path d="M8 5l11 7-11 7z" fill={color} />
      </svg>
    </span>
  )

  return (
    <div ref={wrapRef} className="absolute inset-0 z-40 flex items-end justify-center overflow-hidden px-2 sm:items-center sm:px-4" style={{ background: 'rgba(70,50,110,0.28)', paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }} role="dialog" aria-modal="true" aria-label={nameKnown ? `Talking with ${actor.name}` : 'Talking with a K-drama star'}>
      <div className="soft-card anim-rise relative flex max-h-full w-full max-w-3xl flex-col gap-3 overflow-y-auto p-3 sm:flex-row sm:gap-5 sm:p-5" style={{ borderColor: '#d9cbf5' }}>
        <button type="button" onClick={() => close()} aria-label="Close" className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-lg font-bold text-dusty-600 shadow hover:bg-white">
          ×
        </button>
        {/* actor */}
        <div className="shrink-0 sm:w-[38%]">
          <div className={narrow ? 'mx-auto w-[150px]' : ''}>
            <ActorFigure actor={actor} mood={mood} talking={talking} height={figureH} />
          </div>
          <div className="mt-2 flex justify-center">
            <span key={String(nameKnown)} className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wider shadow-sm sm:text-sm ${nameKnown ? 'anim-pop bg-blush-500 text-white' : 'bg-lavender-200 text-dusty-600'}`}>
              {nameKnown ? actor.name : '??? · K-drama star'}
            </span>
          </div>
        </div>

        {/* talk */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-3" aria-live="polite">
          {(step === 'greet' || step === 'revisit' || step === 'replay' || (step === 'quiz' && wrong.length > 0) || step === 'right') && (
            <>
              {step === 'right' && (
                <div className="anim-pop rounded-2xl bg-gradient-to-r from-blush-100 to-lavender-200 px-3 py-2 text-center text-base font-extrabold text-blush-600 sm:text-lg">
                  🎉 {RIGHT_TEXT}
                </div>
              )}
              {step === 'quiz' && wrong.length > 0 && (
                <div key={wrong.length} className="anim-pop text-center text-base font-extrabold text-blush-600 sm:text-lg">
                  {WRONG_TEXT}
                </div>
              )}
              <Bubble text={bubble.shown} tone={step === 'quiz' ? 'pink' : step === 'right' ? 'lav' : 'white'} onSkip={bubble.skip} />
            </>
          )}

          {(step === 'line' || step === 'replay' || step === 'quiz') && (
            <LineCard actor={actor} typed={step === 'quiz' ? actor.line : line.shown} credit={step === 'replay'} compact={step === 'quiz'} />
          )}

          {step === 'quiz' && (
            <div>
              <h3 className="mb-2 text-center text-[15px] font-extrabold text-dusty-800 sm:text-lg">Who said this famous K-drama line?</h3>
              <div className="grid grid-cols-2 gap-2">
                {choices.map((c) => {
                  const no = wrong.includes(c.id)
                  return (
                    <button
                      key={c.id}
                      type="button"
                      disabled={no}
                      onClick={(e) => answer(c.id, e.currentTarget)}
                      className={`rounded-2xl border-2 px-2 py-2.5 text-sm font-extrabold transition sm:text-base ${no ? 'cursor-not-allowed border-blush-200 bg-blush-50 text-blush-300 line-through' : 'border-lavender-300 bg-white text-dusty-800 shadow-[0_4px_0_#d9cbf5] hover:-translate-y-0.5 hover:border-[#a383e6] active:translate-y-0.5 active:shadow-none'}`}
                    >
                      {no ? '✗ ' : ''}
                      {c.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {step === 'chest' && (
            <div className="flex flex-col items-center gap-2 py-1 text-center">
              <div className="relative flex h-44 w-56 items-end justify-center sm:h-52">
                {chestOpen && <div className="kd-rays absolute left-1/2 top-[38%] h-64 w-64 -translate-x-1/2 -translate-y-1/2" aria-hidden />}
                <div ref={giftRef} className={`absolute left-1/2 top-[30%] -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ${chestOpen ? 'scale-100 opacity-100' : 'translate-y-6 scale-50 opacity-0'}`} style={{ transitionTimingFunction: 'cubic-bezier(.3,1.6,.5,1)' }}>
                  <TreasureIcon id={actor.treasure} size={88} className="anim-bob drop-shadow-[0_0_12px_rgba(255,224,138,0.95)]" />
                </div>
                <div className={chestOpen ? '' : 'kd-shake'}>
                  <Chest open={chestOpen} size={150} />
                </div>
              </div>
              <p className="text-base font-extrabold text-dusty-800 sm:text-lg">{chestOpen ? <>You received the <span className="text-blush-600">{treasure.name}</span>!</> : 'Opening…'}</p>
            </div>
          )}

          {step === 'revisit' && (
            <div className="flex items-center gap-2 rounded-2xl bg-lavender-200/60 px-3 py-2 text-sm font-bold text-dusty-600">
              <TreasureIcon id={actor.treasure} size={34} />
              You already have my {treasure.name} 💜
            </div>
          )}

          {/* actions */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 sm:justify-start">
            {step === 'greet' && (
              <button type="button" autoFocus className={primary} style={lav} onClick={() => { audio.sfx('click'); setStep('line') }}>
                Hear my line <Play />
              </button>
            )}
            {step === 'line' && (
              <button type="button" autoFocus className={primary} style={lav} disabled={!line.done} onClick={() => { audio.sfx('click'); setStep('quiz') }}>
                Guess who I am! <Play />
              </button>
            )}
            {step === 'right' && (
              <button type="button" autoFocus className={primary} onClick={() => { audio.sfx('pop'); setStep('chest') }}>
                Open my treasure 🎁
              </button>
            )}
            {step === 'chest' && (
              <button type="button" autoFocus className={primary} disabled={!chestOpen} onClick={() => close(true)}>
                Add to my treasures ✓
              </button>
            )}
            {(step === 'revisit' || step === 'replay') && (
              <>
                {step === 'revisit' && (
                  <button type="button" className={primary} style={lav} onClick={() => { audio.sfx('click'); setStep('replay') }}>
                    Hear my line again <Play />
                  </button>
                )}
                <button type="button" autoFocus className={primary} onClick={() => close()}>
                  Bye for now 💕
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      {bursts}
    </div>
  )
}
