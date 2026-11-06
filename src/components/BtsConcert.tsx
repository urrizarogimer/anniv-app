import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { audio } from '../audio'
import { BTS_MEMBERS, S, btsPose } from '../assets'
import { HeartShape, SparkleShape, rng } from './Decor'
import { MuteButton } from './MuteButton'

const BPM = 114
const BEAT_MS = 60000 / BPM
// The song: your own copy in public/audio/ if you add one, otherwise the game's own disco groove.
// No video is shown.
const SONG_URLS = ['mp3', 'm4a', 'aac', 'ogg', 'wav'].map((ext) => `/audio/dynamite.${ext}`)
type Source = 'checking' | 'synth' | { file: string }

/** First song file that exists. The dev server answers missing files with the web page, so check the type. */
async function findSong() {
  for (const url of SONG_URLS) {
    try {
      const r = await fetch(url, { method: 'HEAD' })
      if (r.ok && (r.headers.get('content-type') ?? '').startsWith('audio')) return url
    } catch {
      /* offline or blocked: try the next one */
    }
  }
  return null
}

const MOVES = ['bounce', 'groove', 'step', 'sway', 'jump', 'spin'] as const

// Formations: [left %, depth] per slot. Depth 0 is the front of the stage, 1 the back.
const FORMATIONS: [number, number][][] = [
  [[10, 0], [23, 0], [36.5, 0], [50, 0], [63.5, 0], [77, 0], [90, 0]],
  [[14, 1], [26, 0.7], [38, 0.35], [50, 0], [62, 0.35], [74, 0.7], [86, 1]],
  [[20, 1], [35, 1], [50, 1], [65, 1], [80, 1], [36, 0], [64, 0]],
  [[14, 0], [26, 0.7], [38, 0.35], [50, 1], [62, 0.35], [74, 0.7], [86, 0]],
]

// On narrow (phone) screens the members dance in two rows so they stay big enough to see.
const NARROW_FORMATIONS: [number, number][][] = [
  [[14, 1], [38, 1], [62, 1], [86, 1], [26, 0], [50, 0], [74, 0]],
  [[26, 1], [50, 1], [74, 1], [14, 0], [38, 0], [62, 0], [86, 0]],
]

function useNarrow() {
  const [narrow, setNarrow] = useState(() => window.innerWidth < 640)
  useEffect(() => {
    const on = () => setNarrow(window.innerWidth < 640)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return narrow
}

/** Picks the song source and plays it once the show starts. */
function useConcertMusic(playing: boolean) {
  const [source, setSource] = useState<Source>('checking')

  useEffect(() => {
    let cancelled = false
    audio.stopMusic()
    findSong().then((url) => {
      if (!cancelled) setSource(url ? { file: url } : 'synth')
    })
    return () => {
      cancelled = true
      audio.playMusic('garden')
    }
  }, [])

  useEffect(() => {
    // quiet during the greeting; also catches the garden music being restarted by the page's first tap
    audio.stopMusic()
    if (!playing || source === 'checking') return
    if (source === 'synth') {
      audio.playMusic('concert')
      return () => audio.stopMusic()
    }
    const el = new Audio(source.file)
    el.loop = true
    el.volume = audio.muted ? 0 : 0.9
    const unsub = audio.subscribe((m) => (el.volume = m ? 0 : 0.9))
    el.play().catch(() => setSource('synth'))
    return () => {
      unsub()
      el.pause()
    }
  }, [source, playing])
}

/** Lit marquee sign hung on top of the LED screen. Its bulbs blink in turn on the beat. */
function Marquee({ beat }: { beat: number }) {
  const bulbs = Array.from({ length: 22 }, (_, i) => i)
  const row = (edge: 'top' | 'bottom') => (
    <div className={`absolute inset-x-4 flex justify-between ${edge === 'top' ? '-top-[5px]' : '-bottom-[5px]'}`} aria-hidden>
      {bulbs.map((i) => {
        const lit = (i + beat) % 2 === 0
        return (
          <span
            key={i}
            className="h-2 w-2 rounded-full"
            style={{ background: lit ? '#fff6c8' : '#f3b6d2', boxShadow: lit ? '0 0 8px 2px rgba(255,236,160,0.95)' : 'none' }}
          />
        )
      })}
    </div>
  )
  return (
    <div className="absolute left-1/2 top-[12%] z-20 -translate-x-1/2 -translate-y-1/2">
      <div
        className="relative whitespace-nowrap rounded-full border-2 border-[#ffe9a8] px-5 py-1.5 text-center sm:px-8 sm:py-2"
        style={{
          background: 'linear-gradient(180deg, #ff9cc9 0%, #e0609f 55%, #b8457f 100%)',
          boxShadow: '0 0 22px rgba(255,140,200,0.75), 0 4px 0 #8c2f63, inset 0 1px 0 rgba(255,255,255,0.65)',
        }}
      >
        {row('top')}
        <span className="text-[11px] font-black uppercase tracking-[0.14em] text-white sm:text-base" style={{ textShadow: '0 1px 0 #8c2f63, 0 0 8px rgba(255,255,255,0.7)' }}>
          ✦ Exclusive Concert
        </span>{' '}
        <span className="font-script text-[15px] font-bold text-[#fff3b0] sm:text-2xl" style={{ textShadow: '0 1px 0 #8c2f63, 0 0 10px rgba(255,236,160,0.8)' }}>
          for your Anniversary ✦
        </span>
        {row('bottom')}
      </div>
    </div>
  )
}

function Fireworks({ beat }: { beat: number }) {
  // a new burst every 4 beats, at a seeded spot on the screen
  const n = Math.floor(beat / 4)
  const bursts = useMemo(() => {
    const r = rng(n * 31 + 7)
    return Array.from({ length: 3 }, (_, i) => ({
      key: `${n}-${i}`,
      left: 12 + r() * 76,
      top: 8 + r() * 30,
      size: 90 + r() * 90,
      color: ['#ffd36e', '#ff9ed2', '#c9a7ff', '#9fe3ff'][Math.floor(r() * 4)],
      delay: i * 0.18,
    }))
  }, [n])
  return (
    <>
      {bursts.map((b) => (
        <div
          key={b.key}
          className="pointer-events-none absolute rounded-full"
          style={{
            left: `${b.left}%`,
            top: `${b.top}%`,
            width: b.size,
            height: b.size,
            background: `radial-gradient(circle, transparent 38%, ${b.color} 40%, transparent 46%), repeating-conic-gradient(${b.color} 0deg 4deg, transparent 4deg 22deg)`,
            WebkitMaskImage: 'radial-gradient(circle, transparent 20%, #000 30%, #000 60%, transparent 70%)',
            maskImage: 'radial-gradient(circle, transparent 20%, #000 30%, #000 60%, transparent 70%)',
            animation: `firework 1.3s ease-out ${b.delay}s both`,
          }}
        />
      ))}
    </>
  )
}

function Beams() {
  const beams = [
    { left: '12%', color: 'rgba(201,167,255,0.32)', from: '-28deg', to: '18deg', dur: 5.2 },
    { left: '36%', color: 'rgba(255,170,215,0.28)', from: '20deg', to: '-22deg', dur: 4.1 },
    { left: '64%', color: 'rgba(255,236,170,0.26)', from: '-18deg', to: '24deg', dur: 4.6 },
    { left: '88%', color: 'rgba(160,210,255,0.3)', from: '26deg', to: '-20deg', dur: 5.6 },
  ]
  return (
    <>
      {beams.map((b, i) => (
        <div
          key={i}
          className="pointer-events-none absolute top-[-6%] h-[95%] w-[22%] -translate-x-1/2"
          style={
            {
              left: b.left,
              transformOrigin: '50% 0%',
              background: `linear-gradient(to bottom, ${b.color}, rgba(255,255,255,0))`,
              clipPath: 'polygon(45% 0, 55% 0, 100% 100%, 0 100%)',
              mixBlendMode: 'screen',
              '--from': b.from,
              '--to': b.to,
              animation: `beam-sweep ${b.dur}s ease-in-out infinite`,
            } as CSSProperties
          }
        />
      ))}
    </>
  )
}

// The greeting BTS give before they perform.
const GREETING = { from: 'A message from BTS', line1: 'Happy 8th Anniversary', line2: 'to you, AC and Giero!' }

/**
 * Full-screen stage show for the garden. BTS greet the couple on the big screen; "Play Dynamite"
 * then starts the song (no video) and they sing and dance while the bride cheers with a lightstick.
 * Moves change every 8 beats and the formation every 16.
 */
export function BtsConcert({ onClose }: { onClose: () => void }) {
  const [beat, setBeat] = useState(0)
  const [playing, setPlaying] = useState(false)
  useConcertMusic(playing)
  const narrow = useNarrow()

  // restart the beat count when the song starts, so the dance lines up with it
  useEffect(() => {
    const start = performance.now()
    setBeat(0)
    const id = window.setInterval(() => setBeat(Math.floor((performance.now() - start) / BEAT_MS)), BEAT_MS / 4)
    return () => window.clearInterval(id)
  }, [playing])

  useEffect(() => {
    audio.sfx('chime')
  }, [])

  const play = () => {
    if (playing) return
    audio.unlock()
    audio.sfx('pop')
    setPlaying(true)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') onClose()
      else if (!playing && (e.code === 'Enter' || e.code === 'Space') && (e.target as HTMLElement)?.tagName !== 'BUTTON') {
        e.preventDefault()
        play()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const phrase = Math.floor(beat / 8)
  // during the greeting they stand in a line and sway; the full routine starts with the song
  const move = playing ? MOVES[phrase % MOVES.length] : 'sway'
  const forms = narrow ? NARROW_FORMATIONS : FORMATIONS
  const formation = playing ? forms[Math.floor(beat / 16) % forms.length] : forms[0]
  const shift = playing ? Math.floor(beat / 32) % 7 : 0
  const pose = Math.floor(beat / (playing ? 2 : 4)) % 2
  const singer = playing ? Math.floor(beat / 4) % 7 : -1
  const onBeat = beat % 2 === 0

  const stars = useMemo(() => {
    const r = rng(5)
    return Array.from({ length: 50 }, () => ({ left: r() * 100, top: r() * 45, size: 1 + r() * 2.5, d: r() * 3 }))
  }, [])

  return (
    <div
      className="absolute inset-0 z-50 overflow-hidden"
      style={{ '--beat': `${BEAT_MS / 1000}s`, background: 'radial-gradient(ellipse at 50% 35%, #4a2d8f 0%, #2a1858 45%, #140b2e 100%)' } as CSSProperties}
      role="dialog"
      aria-label="BTS on stage in the garden"
    >
      {/* night sky */}
      {stars.map((s, i) => (
        <div key={i} className="absolute rounded-full bg-white" style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, animation: `twinkle ${2 + s.d}s ease-in-out ${s.d}s infinite` }} />
      ))}

      {/* LED screen: BTS's anniversary message, shown for the whole show */}
      <div
        className="absolute left-1/2 top-[12%] flex h-[min(34%,44vw)] w-[min(86vw,760px)] -translate-x-1/2 items-center justify-center gap-[3%] overflow-hidden rounded-3xl border-4 border-[#2a1b52] px-[4%] pt-[min(2%,3vw)]"
        style={{ background: 'linear-gradient(135deg, #6a3fc4 0%, #b05bd6 50%, #5a7bea 100%)', boxShadow: '0 0 40px rgba(180,120,255,0.55)' }}
      >
        <div className="absolute inset-0 opacity-30" style={{ background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.25) 0 2px, transparent 2px 6px)' }} />
        <img src={S('bts_logo')} alt="BTS" className="relative h-[64%] shrink-0 object-contain drop-shadow-[0_0_14px_rgba(255,255,255,0.8)]" />
        <div className="anim-rise relative min-w-0 text-center text-white" role="status">
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/85 sm:text-sm">
            {playing ? '♪ Now performing · Dynamite' : GREETING.from} <span aria-hidden>💜</span>
          </div>
          {/* once the song is on, the message glows on every bar */}
          <div key={playing ? Math.floor(beat / 4) : 'hello'} style={playing ? { animation: `neon-pulse ${(BEAT_MS * 4) / 1000}s ease-out` } : undefined}>
            <div
              className="mt-1 font-script font-bold leading-[1.05]"
              style={{ fontSize: 'clamp(24px, 6vw, 58px)', textShadow: '0 0 8px rgba(255,255,255,0.9), 0 0 22px #ff9ed2, 0 3px 0 #6a2a8f' }}
            >
              {GREETING.line1}
            </div>
            <div
              className="font-script font-bold leading-[1.1]"
              style={{ fontSize: 'clamp(20px, 4.6vw, 44px)', textShadow: '0 0 8px rgba(255,255,255,0.9), 0 0 18px #c9a7ff, 0 3px 0 #6a2a8f' }}
            >
              {GREETING.line2}
            </div>
          </div>
        </div>
      </div>
      {!playing && (
        <div className="absolute inset-x-0 z-30 flex justify-center" style={{ top: 'calc(12% + min(34%, 44vw) + 14px)' }}>
          <button
            type="button"
            autoFocus
            className="pill-btn anim-pop text-base sm:text-lg"
            style={{ background: 'linear-gradient(180deg, #c9a7ff 0%, #9b72e8 55%, #7d55d6 100%)', boxShadow: '0 6px 0 #5f3fb0, 0 12px 24px rgba(95,63,176,0.45)' }}
            onClick={play}
          >
            Play Dynamite
            <span className="play-dot">
              <svg viewBox="0 0 24 24" width={16} height={16} aria-hidden>
                <path d="M8 5l11 7-11 7z" fill="#7d55d6" />
              </svg>
            </span>
          </button>
        </div>
      )}
      <Marquee beat={beat} />
      {playing && <Fireworks beat={beat} />}
      <Beams />

      {/* stage floor */}
      <div
        className="absolute inset-x-[-10%] bottom-0 h-[38%]"
        style={{ background: 'linear-gradient(to bottom, #9b7be6 0%, #5f3fb0 30%, #2b1a5c 100%)', clipPath: 'polygon(14% 0, 86% 0, 100% 100%, 0 100%)' }}
      >
        <div className="absolute inset-x-[14%] top-0 h-1.5 bg-white/60" />
        <div className="absolute inset-x-[14%] top-2 flex justify-between px-2">
          {Array.from({ length: 18 }, (_, i) => (
            <span key={i} className="h-2 w-2 rounded-full" style={{ background: (i + beat) % 2 ? '#fff1b8' : '#ffb3d1', boxShadow: '0 0 8px #ffd6ea' }} />
          ))}
        </div>
      </div>

      {/* the members */}
      <div className={`absolute -translate-x-1/2 ${narrow ? 'left-[54%] w-[84vw] bottom-[17%] h-[44%]' : 'left-[58%] w-[min(78vw,920px)] bottom-[19%] h-[min(40%,62vw)]'}`}>
        {BTS_MEMBERS.map((m, i) => {
          const [left, depth] = formation[(i + shift) % 7]
          const { sprite, mirror } = btsPose(m.id, pose)
          const scale = 1 - depth * (narrow ? 0.1 : 0.16)
          const singing = singer === i
          return (
            <div
              key={m.id}
              className={`absolute bottom-0 ${narrow ? 'h-[58%]' : 'h-full'}`}
              style={{
                left: `${left}%`,
                width: narrow ? '25%' : '15%',
                transform: `translate(-50%, ${-depth * (narrow ? 66 : 16)}%) scale(${scale})`,
                transformOrigin: '50% 100%',
                transition: 'left 0.9s ease-in-out, transform 0.9s ease-in-out',
                zIndex: Math.round(10 - depth * 5),
              }}
            >
              {/* spotlight on the floor under whoever is singing */}
              <div
                className="absolute bottom-[-4%] left-1/2 h-[14%] w-[130%] -translate-x-1/2 rounded-[50%] transition-opacity duration-300"
                style={{ background: 'radial-gradient(ellipse, rgba(255,246,200,0.85), rgba(255,246,200,0) 70%)', opacity: singing ? 1 : 0.25 }}
              />
              <div
                className={`dancer move-${move} h-full`}
                style={{ animationDirection: move === 'step' || move === 'sway' || move === 'groove' ? (i % 2 ? 'reverse' : 'normal') : 'normal' }}
              >
                <img
                  src={S(sprite)}
                  alt=""
                  draggable={false}
                  className="h-full w-full object-contain object-bottom"
                  style={{ transform: mirror ? 'scaleX(-1)' : undefined, filter: singing ? 'drop-shadow(0 0 12px rgba(255,230,160,0.9))' : 'drop-shadow(0 6px 6px rgba(20,10,50,0.45))' }}
                />
              </div>
              {singing && (
                <>
                  {[0, 1, 2].map((k) => (
                    <span
                      key={`${beat}-${k}`}
                      className="pointer-events-none absolute left-1/2 top-[8%] text-2xl font-bold text-[#ffe9a8] sm:text-3xl"
                      style={{ '--dx': `${(k - 1) * 26}px`, animation: `note-rise 1.4s ease-out ${k * 0.15}s both`, textShadow: '0 0 8px #ff9ed2' } as CSSProperties}
                      aria-hidden
                    >
                      {k % 2 ? '♫' : '♪'}
                    </span>
                  ))}
                </>
              )}
              <div
                className="absolute bottom-[-12%] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white sm:px-2 sm:text-xs"
                style={{ background: singing ? '#ec6a90' : 'rgba(124,92,214,0.9)' }}
              >
                {m.name}
              </div>
            </div>
          )
        })}
      </div>

      {/* crowd: lightsticks and the bride cheering */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-[16%] items-end justify-around px-[14%]">
        {Array.from({ length: 9 }, (_, i) => (
          <img
            key={i}
            src={S('bts_lightstick')}
            alt=""
            className="object-contain"
            style={{ height: 'min(85%, 15vw)', transformOrigin: '50% 100%', animation: `lightstick-wave ${(BEAT_MS * 2) / 1000}s ease-in-out ${i % 2 ? -BEAT_MS / 1000 : 0}s infinite`, filter: 'drop-shadow(0 0 10px rgba(190,150,255,0.9))' }}
          />
        ))}
      </div>
      <div className="pointer-events-none absolute bottom-0 left-[1%] h-[min(30%,44vw)] sm:h-[min(30%,26vw)]" style={{ zIndex: 20 }}>
        <div className="relative h-full" style={{ transform: `translateY(${onBeat ? '0' : '-4%'})`, transition: 'transform 0.12s ease-out' }}>
          <img src={S(pose ? 'bridec_celebrate' : 'bridec_excited')} alt="The bride cheering" className="h-full object-contain" />
          <img
            src={S('bts_lightstick')}
            alt=""
            className="absolute right-[-6%] top-[2%] h-[34%] object-contain"
            style={{ transformOrigin: '50% 100%', animation: `lightstick-wave ${(BEAT_MS * 2) / 1000}s ease-in-out infinite`, filter: 'drop-shadow(0 0 10px rgba(190,150,255,0.95))' }}
          />
          <span className="absolute left-[10%] top-[-8%] anim-pulse-soft">
            <HeartShape size={24} color="#b28cff" />
          </span>
        </div>
      </div>

      {/* controls */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3" style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
        <button type="button" className="pill-btn !px-4 !py-2 text-xs sm:text-sm" onClick={onClose}>
          Back to the garden
          <span className="play-dot">
            <HeartShape size={12} color="#ec6a90" />
          </span>
        </button>
        <div className="relative z-10">
          <MuteButton />
        </div>
      </div>
      <span className="pointer-events-none absolute right-[8%] top-[46%] anim-twinkle" aria-hidden>
        <SparkleShape size={22} />
      </span>
    </div>
  )
}
