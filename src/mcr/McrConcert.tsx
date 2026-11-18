import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { audio } from '../audio'
import { MCR_FRAMES, S, type McrId } from '../assets'
import { HeartShape, rng } from '../components/Decor'
import { MuteButton } from '../components/MuteButton'

const BPM = 104
const BEAT_MS = 60000 / BPM
// Their greatest hit. The game plays your own copy of it from public/audio/ (black-parade.mp3 and friends;
// mcr.mp3 also works). Without it, the game's own original rock march plays. No lyrics are shown.
export const MCR_SONG = 'Welcome to the Black Parade'
const SONG_URLS = ['black-parade', 'mcr'].flatMap((name) => ['mp3', 'm4a', 'aac', 'ogg', 'wav'].map((ext) => `/audio/${name}.${ext}`))
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
      audio.stopMusic()
    }
  }, [])
  useEffect(() => {
    audio.stopMusic()
    if (!playing || source === 'checking') return
    if (source === 'synth') {
      audio.playMusic('mcr')
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
  return source
}

function useNarrow() {
  const [narrow, setNarrow] = useState(() => window.innerWidth < 640)
  useEffect(() => {
    const on = () => setNarrow(window.innerWidth < 640)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return narrow
}

// Where each member stands on the stage sprite: left %, bottom %, height % of the stage image.
const PLACES: Record<McrId, { left: number; bottom: number; h: number; z: number; flip?: boolean }> = {
  bob: { left: 50, bottom: 30, h: 28, z: 1 },
  frank: { left: 30, bottom: 21, h: 33, z: 3 },
  gerard: { left: 41, bottom: 18, h: 35, z: 4 },
  ray: { left: 60, bottom: 20, h: 33, z: 3, flip: true },
  mikey: { left: 71, bottom: 22, h: 33, z: 2, flip: true },
}
const ORDER: McrId[] = ['bob', 'frank', 'gerard', 'ray', 'mikey']
const NAMES: Record<McrId, string> = { gerard: 'GERARD', frank: 'FRANK', ray: 'RAY', mikey: 'MIKEY', bob: 'BOB' }

function Beams({ beat, playing }: { beat: number; playing: boolean }) {
  const beams = [
    { left: '18%', color: 'rgba(255,40,55,0.38)', from: '-30deg', to: '16deg', dur: 4.4 },
    { left: '38%', color: 'rgba(255,245,245,0.22)', from: '18deg', to: '-24deg', dur: 3.6 },
    { left: '62%', color: 'rgba(255,245,245,0.22)', from: '-16deg', to: '26deg', dur: 4.0 },
    { left: '82%', color: 'rgba(255,40,55,0.38)', from: '28deg', to: '-18deg', dur: 4.9 },
  ]
  // on every bar the beams flash
  const flash = playing && beat % 4 === 0
  return (
    <>
      {beams.map((b, i) => (
        <div
          key={i}
          className="pointer-events-none absolute top-[-4%] h-[100%] w-[24%] -translate-x-1/2"
          style={
            {
              left: b.left,
              transformOrigin: '50% 0%',
              background: `linear-gradient(to bottom, ${b.color}, rgba(255,255,255,0))`,
              clipPath: 'polygon(46% 0, 54% 0, 100% 100%, 0 100%)',
              mixBlendMode: 'screen',
              opacity: flash ? 1 : 0.75,
              transition: 'opacity 0.15s',
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

/** Fog rolling across the stage floor. */
function Smoke() {
  const puffs = useMemo(() => {
    const r = rng(17)
    return Array.from({ length: 7 }, (_, i) => ({ left: -10 + i * 17 + r() * 8, size: 34 + r() * 22, dur: 9 + r() * 7, delay: -r() * 10 }))
  }, [])
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[10%] h-[30%]" aria-hidden>
      {puffs.map((p, i) => (
        <div
          key={i}
          className="absolute bottom-0 rounded-full"
          style={{
            left: `${p.left}%`,
            width: `${p.size}vw`,
            height: `${p.size * 0.45}vw`,
            background: 'radial-gradient(ellipse, rgba(225,220,230,0.32), rgba(225,220,230,0) 68%)',
            filter: 'blur(6px)',
            animation: `mcr-smoke ${p.dur}s ease-in-out ${p.delay}s infinite alternate`,
          }}
        />
      ))}
    </div>
  )
}

/** Flame jets either side of the stage, fired on the big beats. */
function Pyro({ beat }: { beat: number }) {
  const n = Math.floor(beat / 8)
  if (beat % 8 > 1) return null
  return (
    <>
      {['8%', '92%'].map((left) => (
        <div
          key={`${n}-${left}`}
          className="pointer-events-none absolute bottom-[28%] h-[34%] w-[7%] -translate-x-1/2"
          style={{
            left,
            transformOrigin: '50% 100%',
            background: 'radial-gradient(ellipse at 50% 100%, #fff6d0 0%, #ffcf5a 18%, #ff6a2a 42%, rgba(200,20,30,0.6) 62%, rgba(200,20,30,0) 75%)',
            clipPath: 'polygon(50% 0, 75% 30%, 100% 100%, 0 100%, 25% 30%)',
            filter: 'blur(1px)',
            animation: `mcr-pyro ${(BEAT_MS * 2) / 1000}s ease-out both`,
          }}
        />
      ))}
    </>
  )
}

/** Red and silver confetti falling once the show is on. */
function Confetti() {
  const bits = useMemo(() => {
    const r = rng(42)
    return Array.from({ length: 36 }, () => ({ left: r() * 100, delay: -r() * 8, dur: 5 + r() * 5, size: 5 + r() * 7, color: ['#e2483f', '#c9c4d8', '#1b1720', '#ff8a92'][Math.floor(r() * 4)], spin: r() * 360 }))
  }, [])
  return (
    <>
      {bits.map((b, i) => (
        <span
          key={i}
          className="pointer-events-none absolute top-[-4%]"
          style={{ left: `${b.left}%`, width: b.size, height: b.size * 0.5, background: b.color, transform: `rotate(${b.spin}deg)`, animation: `mcr-confetti ${b.dur}s linear ${b.delay}s infinite` }}
          aria-hidden
        />
      ))}
    </>
  )
}

const GREETING = { from: 'A message from My Chemical Romance', line1: 'Happy 8th Anniversary', line2: 'AC & Giero 🖤' }

/**
 * Full-screen stage show for the MCR Concert Grounds. The band greets the couple, then "Play Black Parade"
 * plays the song (your own file if you add one, otherwise an original rock march) while they perform.
 */
export function McrConcert({ onClose, vip = false }: { onClose: () => void; vip?: boolean }) {
  const [beat, setBeat] = useState(0)
  const [playing, setPlaying] = useState(false)
  const source = useConcertMusic(playing)
  const narrow = useNarrow()

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

  // every 32 beats Gerard drops to his knees for a bar; the guitarists take turns in the spotlight
  const kneel = playing && beat % 32 >= 28
  const soloist: McrId = (['frank', 'ray', 'mikey'] as const)[Math.floor(beat / 16) % 3]
  const onBeat = beat % 2 === 0
  const frameOf = (id: McrId) => {
    if (!playing) return id === 'bob' ? 1 : 1 + (Math.floor(beat / 2) % 2)
    if (id === 'gerard') return kneel ? 5 : 1 + (Math.floor(beat / 2) % 4)
    return 1 + (beat % MCR_FRAMES[id])
  }

  const stars = useMemo(() => {
    const r = rng(9)
    return Array.from({ length: 40 }, () => ({ left: r() * 100, top: r() * 30, size: 1 + r() * 2, d: r() * 3 }))
  }, [])

  return (
    <div
      className="absolute inset-0 z-50 overflow-hidden"
      style={{ '--beat': `${BEAT_MS / 1000}s`, background: 'radial-gradient(ellipse at 50% 40%, #4a0d18 0%, #22070d 45%, #070306 100%)' } as CSSProperties}
      role="dialog"
      aria-label="My Chemical Romance on stage"
    >
      {stars.map((s, i) => (
        <div key={i} className="absolute rounded-full bg-white" style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, animation: `twinkle ${2 + s.d}s ease-in-out ${s.d}s infinite` }} />
      ))}

      {/* hanging banners */}
      <img src={S('mcr_banner_black')} alt="" className="pointer-events-none absolute left-[2%] top-[4%] hidden h-[26%] object-contain sm:block" style={{ transformOrigin: '50% 0', animation: 'sway 5s ease-in-out infinite' }} />
      <img src={S('mcr_banner_red')} alt="" className="pointer-events-none absolute right-[2%] top-[4%] hidden h-[23%] object-contain sm:block" style={{ transformOrigin: '50% 0', animation: 'sway 5.6s ease-in-out infinite' }} />

      {/* the message banner */}
      <div className="absolute left-1/2 top-[calc(max(12px,env(safe-area-inset-top))+52px)] z-20 flex w-[min(92vw,720px)] -translate-x-1/2 flex-col items-center rounded-3xl border-2 border-[#e2483f] px-4 py-3 text-center text-white sm:py-4" style={{ background: 'linear-gradient(180deg, rgba(24,18,28,0.95), rgba(10,8,12,0.95))', boxShadow: '0 0 40px rgba(226,72,63,0.45)' }}>
        <img src={S('mcr_logo')} alt="My Chemical Romance" className="h-[clamp(34px,7vw,64px)] object-contain" style={{ filter: 'invert(1) drop-shadow(0 0 6px rgba(226,72,63,0.95))' }} />
        <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.3em] text-[#ff8a92] sm:text-xs">{playing ? `♪ Now performing · ${MCR_SONG}` : GREETING.from}</div>
        <div key={playing ? Math.floor(beat / 4) : 'hello'} style={playing ? { animation: `neon-pulse ${(BEAT_MS * 4) / 1000}s ease-out` } : undefined}>
          <div className="font-black uppercase leading-[1.05] tracking-wide" style={{ fontSize: 'clamp(20px, 4.6vw, 42px)', textShadow: '0 0 10px rgba(255,80,90,0.8), 0 3px 0 #5c0d15' }}>
            {GREETING.line1}
          </div>
          <div className="font-script font-bold leading-[1.1] text-[#ffd9dc]" style={{ fontSize: 'clamp(22px, 5vw, 46px)', textShadow: '0 0 12px rgba(255,80,90,0.8)' }}>
            {GREETING.line2}
          </div>
        </div>
        {vip && <div className="mt-1 rounded-full bg-[#e2483f] px-3 py-0.5 text-[10px] font-black uppercase tracking-widest sm:text-xs">All-access VIP 🎟️</div>}
        {!playing && <div className="mt-1 text-xs font-bold text-white/75 sm:text-sm">Tonight’s greatest hit: “{MCR_SONG}”</div>}
        {playing && import.meta.env.DEV && source === 'synth' && (
          <div className="mt-1 text-[10px] text-white/50 sm:text-xs">Playing the game’s own tune. Add your copy as public/audio/black-parade.mp3 to hear the song.</div>
        )}
        {!playing && (
          <button type="button" autoFocus className="pill-btn anim-pop mt-3 text-base sm:text-lg" style={{ background: 'linear-gradient(180deg, #e2483f 0%, #b3202a 55%, #8a1520 100%)', boxShadow: '0 6px 0 #5c0d15, 0 12px 24px rgba(92,13,21,0.45)', color: '#fff' }} onClick={play}>
            Play Black Parade
            <span className="play-dot">
              <svg viewBox="0 0 24 24" width={16} height={16} aria-hidden>
                <path d="M8 5l11 7-11 7z" fill="#b3202a" />
              </svg>
            </span>
          </button>
        )}
      </div>

      <Beams beat={beat} playing={playing} />

      {/* the stage with the band on it */}
      <div className="absolute bottom-[9%] left-1/2 -translate-x-1/2" style={{ width: narrow ? '175vw' : 'min(100vw, 125vh)' }}>
        <img src={S('mcrg_stage')} alt="" className="block w-full select-none" draggable={false} style={{ filter: 'brightness(0.85)' }} />
        {ORDER.map((id) => {
          const p = PLACES[id]
          const spot = id === 'gerard' || (playing && id === soloist)
          return (
            <div key={id} className="absolute" style={{ left: `${p.left}%`, bottom: `${p.bottom}%`, height: `${p.h}%`, zIndex: p.z, transform: 'translateX(-50%)' }}>
              {/* spotlight cone on the singer and the soloist */}
              <div
                className="pointer-events-none absolute bottom-0 left-1/2 h-[260%] w-[160%] -translate-x-1/2 transition-opacity duration-300"
                style={{ background: 'linear-gradient(to top, rgba(255,245,235,0.32), rgba(255,245,235,0))', clipPath: 'polygon(42% 0, 58% 0, 100% 100%, 0 100%)', opacity: spot ? 1 : 0, mixBlendMode: 'screen' }}
              />
              <div className={`h-full ${playing && id !== 'bob' && !(id === 'gerard' && kneel) ? 'dancer move-bounce' : ''}`}>
                <img
                  src={S(`mcr_${id}_a${frameOf(id)}`)}
                  alt=""
                  draggable={false}
                  className="h-full w-auto max-w-none object-contain object-bottom"
                  style={{ transform: p.flip ? 'scaleX(-1)' : undefined, filter: spot ? 'drop-shadow(0 0 10px rgba(255,220,200,0.75))' : 'drop-shadow(0 4px 6px rgba(0,0,0,0.6))' }}
                />
              </div>
              {playing && spot && beat % 4 < 2 && (
                <img src={S('mcr_note')} alt="" className="pointer-events-none absolute left-1/2 top-[-6%] h-[16%] object-contain" style={{ filter: 'invert(1) drop-shadow(0 0 6px #ff4d5e)', animation: 'note-rise 1.2s ease-out both' }} aria-hidden key={beat} />
              )}
              <div className="absolute bottom-[-10%] left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-black tracking-widest text-white sm:block sm:text-[11px]" style={{ background: spot ? '#e2483f' : 'rgba(20,16,24,0.85)' }}>
                {NAMES[id]}
              </div>
            </div>
          )
        })}
      </div>

      <Smoke />
      {playing && <Pyro beat={beat} />}
      {playing && <Confetti />}

      {/* the crowd and the bride up front */}
      <div className="pointer-events-none absolute inset-x-[-4%] bottom-[-2%] flex h-[16%] items-end justify-center" style={{ transform: `translateY(${playing && onBeat ? '-6%' : '0'})`, transition: 'transform 0.1s ease-out' }}>
        {Array.from({ length: narrow ? 3 : 5 }, (_, i) => (
          <img key={i} src={S('mcrg_crowd_fence')} alt="" className="h-full object-contain" style={{ filter: 'brightness(0.55)' }} />
        ))}
      </div>
      <div className="pointer-events-none absolute bottom-0 left-[1%] h-[min(28%,44vw)] sm:h-[min(28%,24vw)]" style={{ zIndex: 20 }}>
        <div className="relative h-full" style={{ transform: `translateY(${onBeat ? '0' : '-4%'})`, transition: 'transform 0.12s ease-out' }}>
          <img src={S(beat % 4 < 2 ? 'bridec_celebrate' : 'bridec_excited')} alt="The bride cheering" className="h-full object-contain" />
          <span className="absolute right-[-2%] top-[2%] anim-pulse-soft">
            <HeartShape size={26} color="#e2483f" />
          </span>
          <span className="absolute left-[8%] top-[-8%] anim-pulse-soft">
            <HeartShape size={22} color="#e2483f" />
          </span>
        </div>
      </div>

      {/* controls */}
      <div className="absolute inset-x-0 top-0 z-30 flex items-start justify-between p-3" style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
        <button type="button" className="pill-btn !px-4 !py-2 text-xs sm:text-sm" onClick={onClose}>
          Back to the grounds
          <span className="play-dot">
            <HeartShape size={12} color="#e2483f" />
          </span>
        </button>
        <MuteButton />
      </div>
    </div>
  )
}
