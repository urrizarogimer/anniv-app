import { useEffect, useRef, useState } from 'react'
import { audio } from '../audio'
import { S, img } from '../assets'
import { Ambient, useBursts } from '../components/Ambient'
import { Backdrop } from '../components/Backdrop'
import { FairyLights, FlowerArch, HeartShape, RoseBush } from '../components/Decor'
import { MuteButton } from '../components/MuteButton'

const BRIDE_POSES = ['happy', 'excited', 'shy', 'blush', 'love', 'celebrate', 'jump', 'surprised']
const GROOM_POSES = ['happy', 'love', 'shy', 'blush', 'surprised', 'run', 'thinking', 'idle']
// Native pixel height of the reference poses; every pose is drawn at the same pixel scale.
const BRIDE_REF = 262
const GROOM_REF = 310

function Character({
  who,
  pose,
  hopKey,
  onTap,
  flip,
}: {
  who: 'bride' | 'groom'
  pose: string
  hopKey: number
  onTap: (el: HTMLElement) => void
  flip?: boolean
}) {
  const name = `${who}_${pose}`
  const im = img(name)
  const ref = who === 'bride' ? BRIDE_REF : GROOM_REF
  // height relative to the character's base height, so poses don't jump in size
  const rel = im ? im.height / ref : 1
  return (
    <button
      type="button"
      aria-label={`Tap the ${who} for a new pose`}
      className="group relative h-full outline-none focus-visible:rounded-3xl focus-visible:ring-4 focus-visible:ring-blush-300"
      onClick={(e) => onTap(e.currentTarget)}
    >
      <div key={hopKey} className="anim-hop flex h-full items-end" style={{ transformOrigin: '50% 100%' }}>
        <img
          src={S(name)}
          alt=""
          draggable={false}
          className="object-contain transition-transform group-hover:scale-[1.03]"
          style={{ height: `${rel * 100}%`, transform: flip ? 'scaleX(-1)' : undefined, filter: 'drop-shadow(0 8px 8px rgba(120,80,90,0.22))' }}
        />
      </div>
    </button>
  )
}

export function Celebration({ onDone }: { onDone: () => void }) {
  const [b, setB] = useState(0)
  const [g, setG] = useState(0)
  const [hops, setHops] = useState({ b: 0, g: 0 })
  const [taps, setTaps] = useState(0)
  const [canGo, setCanGo] = useState(false)
  const [bursts, fire] = useBursts()
  const stageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = window.setTimeout(() => setCanGo(true), 6000)
    return () => window.clearTimeout(t)
  }, [])
  useEffect(() => {
    if (taps >= 3) setCanGo(true)
  }, [taps])

  const tap = (who: 'b' | 'g', el?: HTMLElement) => {
    if (who === 'b') setB((v) => (v + 1) % BRIDE_POSES.length)
    else setG((v) => (v + 1) % GROOM_POSES.length)
    setHops((h) => ({ ...h, [who]: h[who] + 1 }))
    setTaps((t) => t + 1)
    audio.sfx(Math.random() < 0.5 ? 'pop' : 'kiss')
    const s = stageRef.current?.getBoundingClientRect()
    const r = el?.getBoundingClientRect()
    if (s && r) fire(r.left - s.left + r.width / 2, r.top - s.top + r.height * 0.3, { count: 12, kinds: ['heart', 'sparkle'], spread: 120 })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'BUTTON') return
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') tap('b')
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') tap('g')
      else if ((e.code === 'Enter' || e.code === 'Space') && canGo) {
        e.preventDefault()
        onDone()
      } else if (e.code === 'Space') {
        e.preventDefault()
        tap('b')
        tap('g')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div ref={stageRef} className="absolute inset-0 overflow-hidden">
      <Backdrop mood="dusk" horizon={0.58} seed={21} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 70%, rgba(255,240,210,0.55), rgba(255,255,255,0) 60%)' }} />
      <FairyLights from={[-20, 30]} to={[1020, 30]} sag={60} count={26} viewBox="0 0 1000 400" className="h-[45%]" seed={1} />
      <FairyLights from={[-20, 90]} to={[1020, 110]} sag={80} count={22} viewBox="0 0 1000 400" className="h-[45%]" seed={9} />
      <FairyLights from={[-20, 170]} to={[1020, 150]} sag={50} count={20} viewBox="0 0 1000 400" className="h-[45%]" seed={12} />
      <Ambient petals={20} hearts={10} sparkles={20} butterflies={4} seed={41} />
      <div className="absolute right-3 z-40" style={{ top: 'max(12px, env(safe-area-inset-top))' }}>
        <MuteButton />
      </div>

      <div className="absolute inset-x-0 top-[9%] px-4 text-center sm:top-[8%]">
        <p className="anim-rise font-script text-4xl font-bold text-blush-600 drop-shadow-[0_2px_0_#fff] sm:text-6xl">Almost married!</p>
        <p className="mt-1 text-sm font-bold text-dusty-800/80 sm:text-base">Tap the couple ♡</p>
      </div>

      <div className="absolute bottom-[14%] left-1/2 aspect-[220/260] h-[64%] max-w-[110vw] -translate-x-1/2 opacity-95">
        <FlowerArch seed={9} />
      </div>
      {/* lanterns by the arch and the wedding cake, behind the couple */}
      <img src={S('prop_lantern')} alt="" draggable={false} className="absolute bottom-[19%] left-[calc(50%-min(36vh,52vw))] h-[16%]" />
      <img src={S('prop_lantern')} alt="" draggable={false} className="absolute bottom-[19%] left-[calc(50%+min(36vh,52vw)-6vh)] h-[16%] -scale-x-100" />
      <img
        src={S('prop_cakestand')}
        alt="The wedding cake on a stand"
        draggable={false}
        className="absolute bottom-[11%] right-[3%] h-[min(40%,62vw)] sm:right-[9%]"
        style={{ filter: 'drop-shadow(0 8px 8px rgba(120,80,90,0.2))' }}
      />
      <svg viewBox="0 0 100 40" preserveAspectRatio="xMidYMax meet" className="absolute bottom-[8%] left-0 h-[16%] w-[34%]" aria-hidden>
        <RoseBush x={45} y={40} w={70} seed={12} />
      </svg>
      <svg viewBox="0 0 100 40" preserveAspectRatio="xMidYMax meet" className="absolute bottom-[8%] right-0 h-[16%] w-[34%]" aria-hidden>
        <RoseBush x={55} y={40} w={70} seed={15} />
      </svg>

      <div className="absolute bottom-[15%] left-1/2 flex w-max -translate-x-1/2 items-end" style={{ height: 'min(48%, 78vw)' }}>
        <div className="h-[86%]" style={{ marginRight: '-3%' }}>
          <Character who="bride" pose={BRIDE_POSES[b]} hopKey={hops.b} onTap={(el) => tap('b', el)} />
        </div>
        <div className="h-full" style={{ marginLeft: '-3%' }}>
          <Character who="groom" pose={GROOM_POSES[g]} hopKey={hops.g} onTap={(el) => tap('g', el)} flip />
        </div>
      </div>

      <div className="absolute inset-x-0 flex justify-center" style={{ bottom: 'max(16px, env(safe-area-inset-bottom))' }}>
        {canGo && (
          <button
            type="button"
            className="pill-btn anim-pop text-base sm:text-lg"
            onClick={() => {
              audio.sfx('click')
              onDone()
            }}
          >
            Continue
            <span className="play-dot">
              <HeartShape size={15} color="#ec6a90" />
            </span>
          </button>
        )}
      </div>
      {bursts}
    </div>
  )
}
