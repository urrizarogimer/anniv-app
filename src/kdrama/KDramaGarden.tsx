import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { audio } from '../audio'
import { img, KD_GROUP, S } from '../assets'
import { Ambient } from '../components/Ambient'
import { DPad } from '../components/DPad'
import { HeartShape } from '../components/Decor'
import { MuteButton } from '../components/MuteButton'
import { DIRS } from '../game/controls'
import { drawHeart, drawLights, drawStar } from '../game/world'
import { ActorChat } from './ActorChat'
import { ACTORS, TREASURES, TROPHY_NAME, actorById, type ActorId, type TreasureId } from './data'
import { KFinale } from './KFinale'
import { K_LIGHTS, K_OBSTACLES, K_PROPS, K_START, K_WALK_TOP, KH, KW, renderKGround, renderKProp } from './kworld'
import { useKProgress } from './progress'
import { TreasureIcon } from './TreasureIcon'

const BRIDE_H_PX = 262 // native pixel height of bride_idle; all poses share this scale
const BRIDE_WORLD_H = 132
const ACTOR_WORLD_H = 140
const SPEED = 260
const NEAR = 110

interface Flyer {
  key: number
  id: TreasureId | 'trophy'
  from: { x: number; y: number }
  to: { x: number; y: number }
}

function hitActor(x: number, y: number) {
  return ACTORS.find((a) => Math.abs(x - a.spot[0]) < 40 && y < a.spot[1] + 10 && y > a.spot[1] - ACTOR_WORLD_H - 10)
}

/**
 * The K-Drama Celebrity Treasure Hunt: a cherry-blossom garden where eight chibi K-drama actors
 * wait. Walk up to one, hear their line, guess their name and win their treasure.
 */
export function KDramaGarden({ onClose, dressOn = false }: { onClose: () => void; dressOn?: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const slotRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const keys = useRef(new Set<string>())
  const { progress, markFound, awardTrophy } = useKProgress()
  const [intro, setIntro] = useState(true)
  const [near, setNear] = useState<ActorId | null>(null)
  const [talking, setTalking] = useState<ActorId | null>(null)
  const [finale, setFinale] = useState(false)
  const [flyers, setFlyers] = useState<Flyer[]>([])
  const [toast, setToast] = useState<{ key: number; text: string; icon: TreasureId | 'trophy' } | null>(null)
  const isTouch = useMemo(() => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches, [])
  // while a treasure is on its way (chat open, then flying), its slot stays empty until it lands
  const [arriving, setArriving] = useState<ActorId | null>(null)
  const found = progress.found
  const shown = arriving ? found.filter((id) => id !== arriving) : found
  const foundRef = useRef(found)
  foundRef.current = found

  const game = useRef({
    x: K_START[0],
    y: K_START[1],
    facing: 1,
    moving: false,
    animT: 0,
    target: null as null | { x: number; y: number; born: number },
    pendingTalk: null as ActorId | null,
    cam: { x: 0, y: 0 },
    scale: 1,
    cw: 0,
    ch: 0,
    paused: true,
    happyUntil: 0,
    particles: [] as { x: number; y: number; vx: number; vy: number; life: number; max: number; kind: 'star' | 'heart'; size: number; color: string }[],
  })
  const nearRef = useRef(near)
  nearRef.current = near
  game.current.paused = intro || !!talking || finale

  // music: the garden's own drama ballad, back to the wedding tune on the way out
  useEffect(() => {
    audio.playMusic('kdrama')
    new Image().src = KD_GROUP // warm the cache for the finale
    return () => audio.playMusic('garden')
  }, [])

  const openTalk = useCallback((id: ActorId) => {
    const g = game.current
    g.target = null
    g.pendingTalk = null
    keys.current.clear()
    audio.sfx('pop')
    setToast(null)
    setArriving(foundRef.current.includes(id) ? null : id)
    setTalking(id)
  }, [])

  // keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (game.current.paused) return
      if (DIRS[e.code]) {
        e.preventDefault()
        keys.current.add(e.code)
        return
      }
      if ((e.code === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter') && (e.target as HTMLElement)?.tagName !== 'BUTTON') {
        e.preventDefault()
        if (nearRef.current) openTalk(nearRef.current)
      }
      if (e.code === 'Escape') onClose()
    }
    const up = (e: KeyboardEvent) => keys.current.delete(e.code)
    const blur = () => keys.current.clear()
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [onClose, openTalk])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 2600)
    return () => window.clearTimeout(t)
  }, [toast])

  // main loop
  useEffect(() => {
    const canvas = canvasRef.current!
    const wrap = wrapRef.current!
    const ctx = canvas.getContext('2d')!
    const g = game.current
    let ground: HTMLCanvasElement | null = null
    let res = 0
    let raf = 0
    let last = performance.now()

    const camTarget = () => {
      const vw = g.cw / g.scale
      const vh = g.ch / g.scale
      let cx = g.x - vw / 2
      let cy = g.y - 70 - vh / 2
      cx = vw >= KW ? (KW - vw) / 2 : Math.max(0, Math.min(KW - vw, cx))
      const extra = 90 / g.scale
      cy = vh >= KH + extra ? (KH - vh) / 2 : Math.max(0, Math.min(KH + extra - vh, cy))
      return { cx, cy }
    }
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5)
      const cw = wrap.clientWidth
      const ch = wrap.clientHeight
      if (!cw || !ch) return
      g.cw = cw
      g.ch = ch
      canvas.width = Math.round(cw * dpr)
      canvas.height = Math.round(ch * dpr)
      canvas.style.width = `${cw}px`
      canvas.style.height = `${ch}px`
      const visibleH = cw < 600 ? 1000 : 820
      g.scale = Math.min(1.35, Math.max(ch / visibleH, cw / KW))
      const want = Math.min(2, dpr * g.scale)
      if (Math.abs(want - res) > 0.15 || !ground) {
        res = want
        ground = renderKGround(res)
        K_PROPS.forEach((p) => renderKProp(p, res))
      }
      const { cx, cy } = camTarget()
      g.cam.x = cx
      g.cam.y = cy
    }
    resize()
    document.fonts?.load('800 15px Quicksand').then(() => {
      ground = null
      resize()
    })
    if (import.meta.env.DEV) (window as unknown as { __kgarden: unknown }).__kgarden = g
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)

    const update = (dt: number) => {
      let dx = 0
      let dy = 0
      if (!g.paused) {
        keys.current.forEach((k) => {
          const d = DIRS[k]
          if (d) {
            dx += d[0]
            dy += d[1]
          }
        })
        if (dx || dy) {
          g.target = null
          g.pendingTalk = null
        } else if (g.target) {
          const tx = g.target.x - g.x
          const ty = g.target.y - g.y
          const dist = Math.hypot(tx, ty)
          if (dist < 6) g.target = null
          else {
            dx = tx / dist
            dy = ty / dist
          }
        }
      }
      const len = Math.hypot(dx, dy)
      g.moving = len > 0
      if (g.moving) {
        const px = g.x
        const py = g.y
        g.x += (dx / len) * SPEED * dt
        g.y += (dy / len) * SPEED * dt * 0.92
        if (dx !== 0) g.facing = dx > 0 ? 1 : -1
        for (const o of K_OBSTACLES) {
          const sy = o.r > 80 ? 0.5 : 0.7
          const ox = g.x - o.x
          const oy = (g.y - o.y) / sy
          const d = Math.hypot(ox, oy)
          const min = o.r + 16
          if (d < min && d > 0.001) {
            g.x = o.x + (ox / d) * min
            g.y = o.y + (oy / d) * min * sy
          }
        }
        g.x = Math.max(40, Math.min(KW - 40, g.x))
        g.y = Math.max(K_WALK_TOP + 40, Math.min(KH - 12, g.y))
        if (g.target && Math.hypot(g.x - px, g.y - py) < SPEED * dt * 0.15) g.target = null
        g.animT += dt
      } else g.animT = 0

      // who is close enough to talk to?
      let best: ActorId | null = null
      let bd = NEAR
      if (!g.paused) {
        for (const a of ACTORS) {
          const d = Math.hypot(g.x - a.spot[0], (g.y - a.spot[1]) * 1.4)
          if (d < bd) {
            bd = d
            best = a.id
          }
        }
      }
      if (best !== nearRef.current) {
        nearRef.current = best
        setNear(best)
      }
      // walked up to the actor that was tapped: start talking
      if (best && g.pendingTalk === best && !g.paused) {
        g.pendingTalk = null
        openTalk(best)
      }
      const { cx, cy } = camTarget()
      const k = 1 - Math.pow(0.0015, dt)
      g.cam.x += (cx - g.cam.x) * k
      g.cam.y += (cy - g.cam.y) * k
      g.particles = g.particles.filter((p) => {
        p.life += dt
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.vx *= 0.96
        p.vy = p.vy * 0.96 + (p.kind === 'heart' ? -20 : 40) * dt
        return p.life < p.max
      })
    }

    const drawBride = (t: number, now: number) => {
      const prefix = dressOn ? 'bride_' : 'bridec_'
      let pose = 'idle'
      if (now < g.happyUntil) pose = 'happy'
      else if (g.moving) pose = ['walk1', 'walk2', 'walk3', 'walk2'][Math.floor(g.animT * 8) % 4]
      const im = img(prefix + pose)
      if (!im) return
      const k = BRIDE_WORLD_H / BRIDE_H_PX
      const w = im.width * k
      const h = im.height * k
      const bob = g.moving ? -Math.abs(Math.sin(g.animT * 12)) * 4 : Math.sin(t * 2.2) * 1.2
      ctx.fillStyle = 'rgba(90,120,70,0.25)'
      ctx.beginPath()
      ctx.ellipse(g.x, g.y, 30, 9, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.save()
      ctx.translate(g.x, g.y + bob)
      ctx.scale(g.facing, 1)
      ctx.drawImage(im, -w / 2, -h, w, h)
      ctx.restore()
    }

    const drawActor = (id: ActorId, t: number) => {
      const a = actorById(id)
      const [x, y] = a.spot
      const got = foundRef.current.includes(id)
      const isNear = nearRef.current === id
      const im = img(`kd_${id}_idle`)
      // glow ring under whoever is close
      if (isNear) {
        ctx.strokeStyle = `rgba(163,131,230,${0.55 + 0.35 * Math.sin(t * 5)})`
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.ellipse(x, y, 40 + Math.sin(t * 5) * 3, 13, 0, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.fillStyle = 'rgba(90,120,70,0.25)'
      ctx.beginPath()
      ctx.ellipse(x, y, 28, 8, 0, 0, Math.PI * 2)
      ctx.fill()
      if (im) {
        const h = ACTOR_WORLD_H
        const w = (im.width / im.height) * h
        const breathe = 1 + Math.sin(t * 2 + x) * 0.012
        ctx.save()
        ctx.translate(x, y)
        ctx.scale(1, breathe)
        ctx.drawImage(im, -w / 2, -h, w, h)
        ctx.restore()
      }
      const top = y - ACTOR_WORLD_H - 18 + Math.sin(t * 2.4 + x) * 4
      if (got) {
        drawHeart(ctx, x, top + 4, 26, '#ec6a90')
        // name tag
        ctx.font = '800 13px Quicksand, ui-rounded, sans-serif'
        const tw = ctx.measureText(a.name).width + 18
        ctx.fillStyle = 'rgba(255,255,255,0.95)'
        ctx.strokeStyle = '#f6b7c9'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.roundRect(x - tw / 2, y + 8, tw, 22, 11)
        ctx.fill()
        ctx.stroke()
        ctx.fillStyle = '#d64d77'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(a.name, x, y + 19.5)
      } else {
        ctx.fillStyle = '#fff'
        ctx.strokeStyle = '#a383e6'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(x, top, 16, 0, Math.PI * 2)
        ctx.moveTo(x - 6, top + 14)
        ctx.lineTo(x, top + 24)
        ctx.lineTo(x + 6, top + 14)
        ctx.fill()
        ctx.stroke()
        ctx.fillStyle = '#7d55d6'
        ctx.font = '800 20px Quicksand, ui-rounded, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('?', x, top + 1)
        drawStar(ctx, x + 20, top - 12, 4 + 2 * Math.sin(t * 5 + x), '#ffe08a')
      }
    }

    const drawPointer = (t: number) => {
      // nudge toward the nearest actor still to meet, when they are off screen
      if (g.paused) return
      let best: [number, number] | null = null
      let bd = Infinity
      for (const a of ACTORS) {
        if (foundRef.current.includes(a.id)) continue
        const d = Math.hypot(a.spot[0] - g.x, a.spot[1] - g.y)
        if (d < bd) {
          bd = d
          best = [a.spot[0], a.spot[1] - 80]
        }
      }
      if (!best) return
      const sx = (best[0] - g.cam.x) * g.scale
      const sy = (best[1] - g.cam.y) * g.scale
      const m = 40
      const top = 110
      const bottom = g.ch - (isTouch ? 210 : 120)
      if (sx > m && sx < g.cw - m && sy > top && sy < bottom) return
      const cx = g.cw / 2
      const cy = (top + bottom) / 2
      const ang = Math.atan2(sy - cy, sx - cx)
      const px = Math.max(m, Math.min(g.cw - m, sx))
      const py = Math.max(top, Math.min(bottom, sy))
      const wob = Math.sin(t * 5) * 4
      ctx.save()
      ctx.translate(px + Math.cos(ang) * wob, py + Math.sin(ang) * wob)
      ctx.globalAlpha = 0.92
      ctx.fillStyle = '#fff'
      ctx.strokeStyle = '#a383e6'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(0, 0, 19, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.rotate(ang)
      ctx.fillStyle = '#a383e6'
      ctx.beginPath()
      ctx.moveTo(30, 0)
      ctx.lineTo(19, -9)
      ctx.lineTo(19, 9)
      ctx.closePath()
      ctx.fill()
      ctx.rotate(-ang)
      ctx.fillStyle = '#7d55d6'
      ctx.font = '800 18px Quicksand, ui-rounded, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('?', 0, 1)
      ctx.restore()
    }

    const draw = (t: number, now: number) => {
      if (!g.cw || !ground) return
      const dpr = canvas.width / g.cw
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.fillStyle = '#d6ebc4'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      const s = g.scale * dpr
      ctx.setTransform(s, 0, 0, s, -g.cam.x * s, -g.cam.y * s)
      ctx.drawImage(ground, 0, 0, KW, KH)

      if (g.target) {
        const age = (now - g.target.born) / 1000
        ctx.strokeStyle = `rgba(163,131,230,${Math.max(0, 0.8 - age * 0.6)})`
        ctx.lineWidth = 2.5
        ctx.beginPath()
        ctx.ellipse(g.target.x, g.target.y, 16 + Math.sin(t * 6) * 3, 6, 0, 0, Math.PI * 2)
        ctx.stroke()
        drawHeart(ctx, g.target.x, g.target.y - 14 - Math.abs(Math.sin(t * 5)) * 6, 14, '#c9a7ff')
      }

      const list: { y: number; draw: () => void }[] = []
      for (const p of K_PROPS) {
        if (!p.canvas) continue
        const c = p.canvas
        list.push({ y: p.y, draw: () => ctx.drawImage(c, p.x + p.ox!, p.y + p.oy!, c.width / res, c.height / res) })
      }
      for (const a of ACTORS) list.push({ y: a.spot[1], draw: () => drawActor(a.id, t) })
      list.push({ y: g.y, draw: () => drawBride(t, now) })
      list.sort((a, b) => a.y - b.y)
      list.forEach((d) => d.draw())

      drawLights(ctx, t, K_LIGHTS)
      // twinkles over the garden
      for (let i = 0; i < 18; i++) {
        const x = (i * 397) % KW
        const y = 430 + ((i * 263) % (KH - 470))
        const a = Math.max(0, Math.sin(t * 1.7 + i * 2.1))
        if (a < 0.05) continue
        ctx.globalAlpha = a
        drawStar(ctx, x, y - 30, 3 + a * 4, i % 2 ? '#fff' : '#ffe08a')
      }
      ctx.globalAlpha = 1
      for (const p of g.particles) {
        const a = 1 - p.life / p.max
        ctx.globalAlpha = a
        if (p.kind === 'star') drawStar(ctx, p.x, p.y, p.size * (0.6 + a * 0.4), p.color)
        else drawHeart(ctx, p.x, p.y, p.size * 1.6, p.color)
      }
      ctx.globalAlpha = 1
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      drawPointer(t)
    }

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      update(dt)
      draw(now / 1000, now)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [dressOn, isTouch, openTalk])

  // tap to move, or tap an actor to walk over and talk
  const pointerDown = useRef(false)
  const toWorld = (e: React.PointerEvent) => {
    const g = game.current
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    return { x: (e.clientX - r.left) / g.scale + g.cam.x, y: (e.clientY - r.top) / g.scale + g.cam.y }
  }
  const setTarget = (x: number, y: number) => {
    game.current.target = { x: Math.max(40, Math.min(KW - 40, x)), y: Math.max(K_WALK_TOP + 40, Math.min(KH - 12, y)), born: performance.now() }
  }

  const celebrate = (x: number, y: number) => {
    const g = game.current
    g.happyUntil = performance.now() + 1200
    for (let i = 0; i < 24; i++) {
      const a = Math.random() * Math.PI * 2
      const sp = 60 + Math.random() * 170
      g.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 90, life: 0, max: 0.8 + Math.random() * 0.7, kind: i % 2 ? 'heart' : 'star', size: 7 + Math.random() * 9, color: ['#ffe08a', '#fff', '#c9a7ff', '#fdb0c4'][i % 4] })
    }
  }

  const endTalk = (gift?: { id: TreasureId; x: number; y: number }) => {
    const who = talking
    setTalking(null)
    // all eight found? time for the big finish
    if (foundRef.current.length >= ACTORS.length && !progress.trophy) {
      window.setTimeout(() => {
        audio.sfx('fanfare')
        setFinale(true)
      }, gift ? 1100 : 300)
    }
    if (!gift || !who) {
      setArriving(null)
      return
    }
    window.setTimeout(() => setArriving(null), 900)
    const wrap = wrapRef.current?.getBoundingClientRect()
    const slot = slotRefs.current[gift.id]?.getBoundingClientRect()
    if (wrap && slot) {
      setFlyers((f) => [...f, { key: Date.now(), id: gift.id, from: { x: gift.x - wrap.left, y: gift.y - wrap.top }, to: { x: slot.left - wrap.left + slot.width / 2, y: slot.top - wrap.top + slot.height / 2 } }])
    }
    audio.sfx('pickup')
    const a = actorById(who)
    celebrate(a.spot[0], a.spot[1] - 80)
    setToast({ key: Date.now(), text: `${TREASURES[gift.id].name} added to your treasures!`, icon: gift.id })
  }

  const count = shown.length
  const lavBtn: CSSProperties = { background: 'linear-gradient(180deg, #c9a7ff 0%, #9b72e8 55%, #7d55d6 100%)', boxShadow: '0 6px 0 #5f3fb0, 0 12px 24px rgba(95,63,176,0.35)' }
  const nearActor = near ? actorById(near) : null

  return (
    <div
      ref={wrapRef}
      className="absolute inset-0 z-30 overflow-hidden bg-[#d6ebc4]"
      onPointerDownCapture={() => {
        audio.unlock()
        // the app's first-tap listener starts the wedding tune; switch back to ours after it
        window.setTimeout(() => audio.playMusic('kdrama'), 0)
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 touch-none"
        aria-label="K-Drama Garden. Walk the bride to each K-drama star to talk to them."
        onPointerDown={(e) => {
          const g = game.current
          if (g.paused) return
          const p = toWorld(e)
          const a = hitActor(p.x, p.y)
          if (a) {
            if (nearRef.current === a.id) openTalk(a.id)
            else {
              g.pendingTalk = a.id
              setTarget(a.spot[0] + (g.x < a.spot[0] ? -50 : 50), a.spot[1] + 30)
            }
            return
          }
          pointerDown.current = true
          try {
            e.currentTarget.setPointerCapture(e.pointerId)
          } catch {
            /* ignore */
          }
          g.pendingTalk = null
          setTarget(p.x, p.y)
        }}
        onPointerMove={(e) => {
          if (pointerDown.current && !game.current.paused) {
            const p = toWorld(e)
            setTarget(p.x, p.y)
          }
        }}
        onPointerUp={() => (pointerDown.current = false)}
        onPointerCancel={() => (pointerDown.current = false)}
      />
      <Ambient petals={16} hearts={6} sparkles={0} seed={88} />

      {/* top HUD */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-center px-14" style={{ paddingTop: 'max(10px, env(safe-area-inset-top))' }}>
        <div className="soft-card flex flex-col items-center gap-1 px-4 py-2" role="status" aria-live="polite" style={{ borderColor: '#d9cbf5' }}>
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#7d55d6] sm:text-xs">K-Drama Treasures: {count}/8</div>
          <div className="flex gap-[3px] sm:gap-1">
            {ACTORS.map((a, i) => (
              <div key={a.id} className={i < count ? 'anim-pop' : ''}>
                <HeartShape size={20} color={i < count ? '#a383e6' : '#e6dcf7'} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute left-3 z-20" style={{ top: 'max(12px, env(safe-area-inset-top))' }}>
        <button type="button" onClick={onClose} className="round-btn !h-auto !w-auto gap-1 !rounded-full px-3 py-2 text-xs font-extrabold text-blush-600 sm:text-sm" aria-label="Back to the wedding garden">
          <svg viewBox="0 0 24 24" width={14} height={14} aria-hidden>
            <path d="M15 5l-7 7 7 7" stroke="#ec6a90" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="hidden sm:inline">Wedding garden</span>
        </button>
      </div>
      <div className="absolute right-3 z-20" style={{ top: 'max(12px, env(safe-area-inset-top))' }}>
        <MuteButton />
      </div>

      {toast && (
        <div key={toast.key} className="pointer-events-none absolute inset-x-0 top-[86px] z-20 flex justify-center px-3 sm:top-[96px]">
          <div className="soft-card anim-rise flex max-w-[92vw] items-center gap-2 py-2 pl-2 pr-4">
            <TreasureIcon id={toast.icon} size={40} />
            <div className="text-sm font-bold text-dusty-800 sm:text-base">{toast.text}</div>
          </div>
        </div>
      )}

      {/* treasure bar */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center px-2" style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}>
        <div className="soft-card pointer-events-auto flex gap-1 p-1.5 sm:gap-2 sm:p-2" aria-label="K-drama treasures" style={{ borderColor: '#d9cbf5' }}>
          {ACTORS.map((a) => {
            const t = TREASURES[a.treasure]
            const got = shown.includes(a.id)
            return (
              <div key={a.id} ref={(el) => (slotRefs.current[t.id] = el)}>
                <button
                  type="button"
                  title={got ? `${t.name} · from ${a.name}` : 'Not found yet'}
                  aria-label={got ? `${t.name}, from ${a.name}` : 'Treasure not found yet'}
                  onClick={() => got && setToast({ key: Date.now(), text: `${t.name} · from ${a.name}`, icon: t.id })}
                  className={`flex h-9 w-9 items-center justify-center rounded-2xl border-2 sm:h-12 sm:w-12 ${got ? 'anim-pop border-[#c9a7ff] bg-lavender-200/60' : 'border-dashed border-lavender-300 bg-white/70'}`}
                >
                  <TreasureIcon id={t.id} size={30} className="sm:!h-10 sm:!w-10" style={got ? undefined : { filter: 'grayscale(1) brightness(1.2)', opacity: 0.25 }} />
                </button>
              </div>
            )
          })}
          {progress.trophy && (
            <div ref={(el) => (slotRefs.current.trophy = el)}>
              <button type="button" title={TROPHY_NAME} aria-label={`${TROPHY_NAME}. Show the celebration again`} onClick={() => setFinale(true)} className="anim-pop flex h-9 w-9 items-center justify-center rounded-2xl border-2 border-champagne-400 bg-champagne-200 sm:h-12 sm:w-12">
                <TreasureIcon id="trophy" size={30} className="sm:!h-10 sm:!w-10" />
              </button>
            </div>
          )}
        </div>
      </div>

      {isTouch && !intro && !talking && !finale && <DPad keys={keys} color="#9b72e8" style={{ bottom: 'calc(max(10px, env(safe-area-inset-bottom)) + 62px)' }} />}

      {/* talk button */}
      {nearActor && !talking && !intro && !finale && (
        <div className="absolute inset-x-0 z-10 flex justify-center" style={{ bottom: 'calc(max(10px, env(safe-area-inset-bottom)) + 74px)' }}>
          <button type="button" className="pill-btn anim-pop text-sm uppercase sm:text-base" style={lavBtn} onClick={() => openTalk(nearActor.id)}>
            {found.includes(nearActor.id) ? `Talk to ${nearActor.name}` : 'Talk to actor'}
            <span className="play-dot">💬</span>
          </button>
        </div>
      )}

      {talking && <ActorChat key={talking} actor={actorById(talking)} found={found.includes(talking)} onFound={() => markFound(talking)} onClose={endTalk} />}

      {flyers.map((f) => (
        <KFlyer key={f.key} f={f} onDone={() => setFlyers((l) => l.filter((x) => x.key !== f.key))} />
      ))}

      {/* welcome */}
      {intro && (
        <div className="absolute inset-0 z-30 flex items-end justify-center bg-white/20 px-3 pb-24 sm:items-center sm:pb-0">
          <div className="soft-card anim-rise flex w-full max-w-lg items-center gap-3 p-4 sm:gap-4 sm:p-5" style={{ borderColor: '#d9cbf5' }}>
            <img src={S('kd_clapper')} alt="" className="h-20 w-20 shrink-0 object-contain sm:h-24 sm:w-24" />
            <div className="flex-1">
              <h2 className="font-script text-3xl font-bold text-[#8f5fc4]">K-Drama Treasure Hunt</h2>
              <p className="mt-1 text-[15px] font-bold leading-snug text-dusty-800 sm:text-base">
                {count === 0
                  ? 'Eight K-drama stars are waiting among the cherry blossoms! Walk up to each one, listen to their famous line, and guess who they are to win their treasure.'
                  : count < 8
                    ? `Welcome back! You’ve found ${count} of 8 stars. The others are still waiting for you!`
                    : 'Welcome back, K-Drama Queen! Visit the stars again to hear their wishes.'}
              </p>
              <p className="mt-1 text-xs text-dusty-600 sm:text-sm">{isTouch ? 'Tap a star to walk over, or use the arrows.' : 'Arrow keys / WASD or click to move. Click a star to walk over.'}</p>
              <button
                type="button"
                autoFocus
                className="pill-btn mt-3 text-sm"
                style={lavBtn}
                onClick={() => {
                  audio.sfx('click')
                  setIntro(false)
                }}
              >
                {count === 0 ? 'Let’s find them!' : 'Let’s go!'}
                <span className="play-dot">
                  <HeartShape size={14} color="#7d55d6" />
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {finale && (
        <KFinale
          onMount={awardTrophy}
          onReturn={onClose}
          onStay={() => setFinale(false)}
        />
      )}
    </div>
  )
}

function KFlyer({ f, onDone }: { f: Flyer; onDone: () => void }) {
  const [go, setGo] = useState(false)
  const done = useRef(onDone)
  done.current = onDone
  useEffect(() => {
    const r = requestAnimationFrame(() => requestAnimationFrame(() => setGo(true)))
    const t = window.setTimeout(() => done.current(), 950)
    return () => {
      cancelAnimationFrame(r)
      window.clearTimeout(t)
    }
  }, [])
  const pos = go ? f.to : f.from
  return (
    <div
      className="pointer-events-none absolute z-50"
      style={{
        left: pos.x,
        top: pos.y,
        transform: `translate(-50%, -50%) scale(${go ? 0.5 : 1.3})`,
        transition: 'left 0.85s cubic-bezier(.5,-0.3,.6,1), top 0.85s cubic-bezier(.3,-0.6,.6,1), transform 0.85s ease',
      }}
    >
      <TreasureIcon id={f.id} size={72} className="drop-shadow-[0_0_10px_rgba(255,224,138,0.95)]" />
    </div>
  )
}
