import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { audio } from '../audio'
import { img, loadSprites, MCR_SPRITES, mcrPortrait, S, type McrId } from '../assets'
import { DPad } from '../components/DPad'
import { HeartShape } from '../components/Decor'
import { MuteButton } from '../components/MuteButton'
import { DIRS } from '../game/controls'
import { drawHeart, drawLights, drawStar } from '../game/world'
import { BAND, BOOTHS, loadMet, memberById, saveMet, type Booth } from './data'
import { McrConcert } from './McrConcert'
import { M_LIGHTS, M_OBSTACLES, M_PROPS, M_STAGE, M_START, M_WALK_TOP, MH, MW, nearestBooth, propWidth, renderMGround } from './mworld'

const BRIDE_H_PX = 262 // native pixel height of bride_idle; all poses share this scale
const BRIDE_WORLD_H = 132
const SPEED = 260
const NEAR = 110

type Near = { kind: 'member'; id: McrId } | { kind: 'booth'; booth: Booth } | { kind: 'stage' } | null
const sameNear = (a: Near, b: Near) =>
  a === b || (!!a && !!b && a.kind === b.kind && (a.kind !== 'member' || a.id === (b as { id: McrId }).id) && (a.kind !== 'booth' || a.booth.id === (b as { booth: Booth }).booth.id))

function hitMember(x: number, y: number) {
  return BAND.find((m) => Math.abs(x - m.spot[0]) < (m.id === 'bob' ? 70 : 40) && y < m.spot[1] + 10 && y > m.spot[1] - m.h - 10)
}
function onStage(x: number, y: number) {
  return Math.abs(x - M_STAGE.x) < 340 && y > 60 && y < 520
}

const RED_BTN: CSSProperties = { background: 'linear-gradient(180deg, #e2483f 0%, #b3202a 55%, #8a1520 100%)', boxShadow: '0 6px 0 #5c0d15, 0 12px 24px rgba(92,13,21,0.45)', color: '#fff' }

/**
 * MCR Concert Grounds: a night festival field with the main stage, tents, a Ferris wheel and the band
 * hanging around. Meet all five, visit the booths, and walk up the aisle to watch the show.
 */
export function McrGrounds({ onClose, dressOn = false }: { onClose: () => void; dressOn?: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const keys = useRef(new Set<string>())
  const [ready, setReady] = useState(false)
  const [intro, setIntro] = useState(true)
  const [near, setNear] = useState<Near>(null)
  const [talking, setTalking] = useState<McrId | null>(null)
  const [show, setShow] = useState(false)
  const [met, setMet] = useState<McrId[]>(loadMet)
  const [toast, setToast] = useState<{ key: number; text: string; icon: string } | null>(null)
  const isTouch = useMemo(() => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches, [])
  const metRef = useRef(met)
  metRef.current = met

  const game = useRef({
    x: M_START[0],
    y: M_START[1],
    facing: 1,
    moving: false,
    animT: 0,
    target: null as null | { x: number; y: number; born: number },
    pending: null as Near,
    cam: { x: 0, y: 0 },
    scale: 1,
    cw: 0,
    ch: 0,
    paused: true,
    happyUntil: 0,
    particles: [] as { x: number; y: number; vx: number; vy: number; life: number; max: number; kind: 'star' | 'heart'; size: number; color: string }[],
  })
  const nearRef = useRef<Near>(near)
  nearRef.current = near
  game.current.paused = !ready || intro || !!talking || show

  useEffect(() => {
    let alive = true
    loadSprites(MCR_SPRITES).then(() => alive && setReady(true))
    BAND.forEach((m) => (new Image().src = mcrPortrait(m.id)))
    return () => {
      alive = false
    }
  }, [])

  // music: the grounds' night tune, back to the wedding tune on the way out
  useEffect(() => {
    if (!show) audio.playMusic('mcrgrounds')
  }, [show])
  useEffect(() => () => audio.playMusic('garden'), [])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 2800)
    return () => window.clearTimeout(t)
  }, [toast])

  const celebrate = useCallback((x: number, y: number, colors = ['#ff4d5e', '#fff', '#c9c4d8', '#ffd36e']) => {
    const g = game.current
    g.happyUntil = performance.now() + 1200
    for (let i = 0; i < 24; i++) {
      const a = Math.random() * Math.PI * 2
      const sp = 60 + Math.random() * 170
      g.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 90, life: 0, max: 0.8 + Math.random() * 0.7, kind: i % 2 ? 'heart' : 'star', size: 7 + Math.random() * 9, color: colors[i % colors.length] })
    }
  }, [])

  const act = useCallback(
    (n: Near) => {
      if (!n) return
      const g = game.current
      g.target = null
      g.pending = null
      keys.current.clear()
      if (n.kind === 'member') {
        audio.sfx('pop')
        setToast(null)
        setTalking(n.id)
      } else if (n.kind === 'booth') {
        audio.sfx('pickup')
        celebrate(n.booth.x, n.booth.y - 90)
        setToast({ key: Date.now(), text: n.booth.toast, icon: n.booth.icon })
      } else {
        audio.unlock()
        setShow(true)
      }
    },
    [celebrate],
  )

  // keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && !show && !talking) {
        onClose()
        return
      }
      if (game.current.paused) return
      if (DIRS[e.code]) {
        e.preventDefault()
        keys.current.add(e.code)
        return
      }
      if ((e.code === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter') && (e.target as HTMLElement)?.tagName !== 'BUTTON') {
        e.preventDefault()
        act(nearRef.current)
      }
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
  }, [onClose, act, show, talking])

  // main loop
  useEffect(() => {
    if (!ready) return
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
      let cy = g.y - 90 - vh / 2
      cx = vw >= MW ? (MW - vw) / 2 : Math.max(0, Math.min(MW - vw, cx))
      cy = vh >= MH ? (MH - vh) / 2 : Math.max(0, Math.min(MH - vh, cy))
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
      const visibleH = cw < 600 ? 1000 : 860
      g.scale = Math.min(1.35, Math.max(ch / visibleH, cw / MW))
      const want = Math.min(2, dpr * g.scale)
      if (Math.abs(want - res) > 0.15 || !ground) {
        res = want
        ground = renderMGround(res)
      }
      const { cx, cy } = camTarget()
      g.cam.x = cx
      g.cam.y = cy
    }
    resize()
    if (import.meta.env.DEV) (window as unknown as { __mcr: unknown }).__mcr = g
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)

    const findNear = (): Near => {
      if (g.paused) return null
      let best: Near = null
      let bd = NEAR
      for (const m of BAND) {
        const d = Math.hypot(g.x - m.spot[0], (g.y - m.spot[1]) * 1.4) - (m.id === 'bob' ? 40 : 0)
        if (d < bd) {
          bd = d
          best = { kind: 'member', id: m.id }
        }
      }
      if (!best) {
        const b = nearestBooth(g.x, g.y)
        if (b) best = { kind: 'booth', booth: b }
      }
      if (!best && Math.hypot(g.x - M_STAGE.x, (g.y - M_STAGE.y) * 1.3) < M_STAGE.near) best = { kind: 'stage' }
      return best
    }

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
          g.pending = null
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
        for (const o of M_OBSTACLES) {
          const sy = 0.7
          const ox = g.x - o.x
          const oy = (g.y - o.y) / sy
          const d = Math.hypot(ox, oy)
          const min = o.r + 16
          if (d < min && d > 0.001) {
            g.x = o.x + (ox / d) * min
            g.y = o.y + (oy / d) * min * sy
          }
        }
        g.x = Math.max(40, Math.min(MW - 40, g.x))
        g.y = Math.max(M_WALK_TOP + 40, Math.min(MH - 12, g.y))
        if (g.target && Math.hypot(g.x - px, g.y - py) < SPEED * dt * 0.15) g.target = null
        g.animT += dt
      } else g.animT = 0

      const n = findNear()
      if (!sameNear(n, nearRef.current)) {
        nearRef.current = n
        setNear(n)
      }
      // walked up to whatever was tapped: do it
      if (n && g.pending && sameNear(n, g.pending) && !g.paused) act(n)

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

    const drawSprite = (name: string, x: number, y: number, h: number, flip = false) => {
      const im = img(name)
      if (!im || !im.width) return
      const w = (im.width / im.height) * h
      if (flip) {
        ctx.save()
        ctx.translate(x, y)
        ctx.scale(-1, 1)
        ctx.drawImage(im, -w / 2, -h, w, h)
        ctx.restore()
      } else ctx.drawImage(im, x - w / 2, y - h, w, h)
    }

    const shadow = (x: number, y: number, rx: number, ry = rx * 0.3) => {
      ctx.fillStyle = 'rgba(0,0,0,0.35)'
      ctx.beginPath()
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
      ctx.fill()
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
      shadow(g.x, g.y, 30, 9)
      ctx.save()
      ctx.translate(g.x, g.y + bob)
      ctx.scale(g.facing, 1)
      ctx.drawImage(im, -w / 2, -h, w, h)
      ctx.restore()
    }

    const drawMember = (id: McrId, t: number) => {
      const m = memberById(id)
      const [x, y] = m.spot
      const got = metRef.current.includes(id)
      const n = nearRef.current
      const isNear = n?.kind === 'member' && n.id === id
      if (isNear) {
        ctx.strokeStyle = `rgba(255,77,94,${0.55 + 0.35 * Math.sin(t * 5)})`
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.ellipse(x, y, (id === 'bob' ? 70 : 40) + Math.sin(t * 5) * 3, 13, 0, 0, Math.PI * 2)
        ctx.stroke()
      }
      shadow(x, y, id === 'bob' ? 60 : 28, 8)
      // a little idle sway; Bob taps along on his kit
      const frame = id === 'bob' ? `mcr_bob_a${(Math.floor(t * 3.4) % 3) + 1}` : `mcr_${id}`
      const breathe = 1 + Math.sin(t * 2 + x) * 0.012
      ctx.save()
      ctx.translate(x, y)
      ctx.scale(1, breathe)
      drawSprite(frame, 0, 0, m.h, id === 'ray' || id === 'mikey')
      ctx.restore()
      const top = y - m.h - 18 + Math.sin(t * 2.4 + x) * 4
      // name tag once met, a "?" bubble before
      ctx.font = '800 13px Quicksand, ui-rounded, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      if (got) {
        drawHeart(ctx, x, top + 4, 26, '#e2483f')
        const label = m.name.split(' ')[0]
        const tw = ctx.measureText(label).width + 18
        ctx.fillStyle = 'rgba(20,16,24,0.92)'
        ctx.strokeStyle = '#e2483f'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.roundRect(x - tw / 2, y + 8, tw, 22, 11)
        ctx.fill()
        ctx.stroke()
        ctx.fillStyle = '#fff'
        ctx.fillText(label, x, y + 19.5)
      } else {
        ctx.fillStyle = '#16121c'
        ctx.strokeStyle = '#e2483f'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(x, top, 16, 0, Math.PI * 2)
        ctx.moveTo(x - 6, top + 14)
        ctx.lineTo(x, top + 24)
        ctx.lineTo(x + 6, top + 14)
        ctx.fill()
        ctx.stroke()
        ctx.fillStyle = '#ff6b75'
        ctx.font = '800 20px Quicksand, ui-rounded, sans-serif'
        ctx.fillText('♪', x, top + 1)
      }
    }

    const drawBubble = (x: number, y: number, label: string, t: number, phase = 0) => {
      const by = y + Math.sin(t * 3 + phase) * 5
      ctx.font = '800 15px Quicksand, ui-rounded, sans-serif'
      const w = ctx.measureText(label).width + 28
      ctx.fillStyle = 'rgba(18,14,22,0.94)'
      ctx.strokeStyle = '#e2483f'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.roundRect(x - w / 2, by - 17, w, 34, 17)
      ctx.moveTo(x - 8, by + 16)
      ctx.lineTo(x, by + 26)
      ctx.lineTo(x + 8, by + 16)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = '#fff'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(label, x, by + 1)
    }

    // stage lights: sweeping red and white beams over the stage
    const drawStageFx = (t: number) => {
      ctx.save()
      ctx.globalCompositeOperation = 'screen'
      const beams = [
        { x: 700, c: '255,60,70', p: 0 },
        { x: 820, c: '255,240,240', p: 1.3 },
        { x: 980, c: '255,240,240', p: 2.1 },
        { x: 1100, c: '255,60,70', p: 3.2 },
      ]
      for (const b of beams) {
        const a = Math.sin(t * 0.9 + b.p) * 0.45
        ctx.save()
        ctx.translate(b.x, 110)
        ctx.rotate(a)
        const grd = ctx.createLinearGradient(0, 0, 0, 420)
        grd.addColorStop(0, `rgba(${b.c},0.32)`)
        grd.addColorStop(1, `rgba(${b.c},0)`)
        ctx.fillStyle = grd
        ctx.beginPath()
        ctx.moveTo(-6, 0)
        ctx.lineTo(6, 0)
        ctx.lineTo(70, 420)
        ctx.lineTo(-70, 420)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
      }
      ctx.restore()
    }

    const draw = (t: number, now: number) => {
      if (!g.cw || !ground) return
      const dpr = canvas.width / g.cw
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.fillStyle = '#2a3323' // the field's colour, for any edge past the world
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      const s = g.scale * dpr
      ctx.setTransform(s, 0, 0, s, -g.cam.x * s, -g.cam.y * s)
      ctx.drawImage(ground, 0, 0, MW, MH)

      // the stage, the wheel and the big screen sit at the back
      for (const p of M_PROPS) if (p.back) drawSprite(p.sprite, p.x, p.y, p.h)
      drawStageFx(t)

      if (g.target) {
        const age = (now - g.target.born) / 1000
        ctx.strokeStyle = `rgba(255,77,94,${Math.max(0, 0.8 - age * 0.6)})`
        ctx.lineWidth = 2.5
        ctx.beginPath()
        ctx.ellipse(g.target.x, g.target.y, 16 + Math.sin(t * 6) * 3, 6, 0, 0, Math.PI * 2)
        ctx.stroke()
        drawHeart(ctx, g.target.x, g.target.y - 14 - Math.abs(Math.sin(t * 5)) * 6, 14, '#ff6b75')
      }

      const list: { y: number; draw: () => void }[] = []
      for (const p of M_PROPS) {
        if (p.back) continue
        list.push({
          y: p.y,
          draw: () => {
            if (p.h > 60) shadow(p.x, p.y - 2, propWidth(p) * 0.42, 10)
            // the crowd bounces to the show
            const hop = p.sprite === 'mcrg_crowd_fence' ? -Math.abs(Math.sin(t * 5.4 + p.x)) * 3 : 0
            drawSprite(p.sprite, p.x, p.y + hop, p.h)
          },
        })
      }
      for (const m of BAND) list.push({ y: m.spot[1], draw: () => drawMember(m.id, t) })
      list.push({ y: g.y, draw: () => drawBride(t, now) })
      list.sort((a, b) => a.y - b.y)
      list.forEach((d) => d.draw())

      drawLights(ctx, t, M_LIGHTS)
      // floating embers
      for (let i = 0; i < 22; i++) {
        const x = (i * 397) % MW
        const y = MH - ((i * 263 + t * 30 * (1 + (i % 3))) % (MH - M_WALK_TOP))
        const a = Math.max(0, Math.sin(t * 1.7 + i * 2.1))
        if (a < 0.05) continue
        ctx.globalAlpha = a * 0.8
        drawStar(ctx, x, y, 2 + a * 3, i % 3 ? '#ff6b75' : '#fff')
      }
      ctx.globalAlpha = 1
      for (const p of g.particles) {
        const a = 1 - p.life / p.max
        ctx.globalAlpha = a
        if (p.kind === 'star') drawStar(ctx, p.x, p.y, p.size * (0.6 + a * 0.4), p.color)
        else drawHeart(ctx, p.x, p.y, p.size * 1.6, p.color)
      }
      ctx.globalAlpha = 1
      if (!g.paused) {
        drawBubble(M_STAGE.x, 430, 'Tap the stage ♪', t)
        for (const b of BOOTHS) {
          const n = nearRef.current
          if (n?.kind === 'booth' && n.booth.id === b.id) drawBubble(b.x, b.y - 210, b.label, t, b.x)
        }
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
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
  }, [ready, dressOn, act])

  // tap to move; tap a band member, booth or the stage to walk over and do it
  const pointerDown = useRef(false)
  const toWorld = (e: React.PointerEvent) => {
    const g = game.current
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    return { x: (e.clientX - r.left) / g.scale + g.cam.x, y: (e.clientY - r.top) / g.scale + g.cam.y }
  }
  const setTarget = (x: number, y: number) => {
    game.current.target = { x: Math.max(40, Math.min(MW - 40, x)), y: Math.max(M_WALK_TOP + 40, Math.min(MH - 12, y)), born: performance.now() }
  }

  const endTalk = () => {
    const who = talking
    setTalking(null)
    if (!who) return
    const m = memberById(who)
    if (!metRef.current.includes(who)) {
      const next = [...metRef.current, who]
      setMet(next)
      saveMet(next)
      audio.sfx(next.length === BAND.length ? 'fanfare' : 'pickup')
      celebrate(m.spot[0], m.spot[1] - 80)
      setToast({
        key: Date.now(),
        text: next.length === BAND.length ? 'You met the whole band! All-access pass unlocked 🖤' : `${m.name.split(' ')[0]} gave you ${m.gift}!`,
        icon: next.length === BAND.length ? '🎟️' : m.giftIcon,
      })
    }
  }

  const n = near
  const actLabel = n?.kind === 'member' ? `Talk to ${memberById(n.id).name.split(' ')[0]}` : n?.kind === 'booth' ? n.booth.label : n?.kind === 'stage' ? 'Watch MCR perform' : ''
  const talker = talking ? memberById(talking) : null

  return (
    <div
      ref={wrapRef}
      className="absolute inset-0 z-40 overflow-hidden bg-[#0c0a10]"
      onPointerDownCapture={() => {
        audio.unlock()
        // the app's first-tap listener starts the wedding tune; switch back to ours after it
        window.setTimeout(() => !show && audio.playMusic('mcrgrounds'), 0)
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 touch-none"
        aria-label="MCR Concert Grounds. Walk the bride around the festival, meet the band, and walk up to the stage for the show."
        onPointerDown={(e) => {
          const g = game.current
          if (g.paused) return
          const p = toWorld(e)
          const m = hitMember(p.x, p.y)
          if (m) {
            const target: Near = { kind: 'member', id: m.id }
            if (sameNear(nearRef.current, target)) act(target)
            else {
              g.pending = target
              setTarget(m.spot[0] + (g.x < m.spot[0] ? -60 : 60), m.spot[1] + 30)
            }
            return
          }
          const b = nearestBooth(p.x, p.y + 80, 120)
          if (b && p.y < b.y + 10) {
            const target: Near = { kind: 'booth', booth: b }
            if (sameNear(nearRef.current, target)) act(target)
            else {
              g.pending = target
              setTarget(b.x, b.y + 20)
            }
            return
          }
          if (onStage(p.x, p.y)) {
            const target: Near = { kind: 'stage' }
            if (nearRef.current?.kind === 'stage') act(target)
            else {
              g.pending = target
              setTarget(M_STAGE.x, M_STAGE.y)
            }
            return
          }
          pointerDown.current = true
          try {
            e.currentTarget.setPointerCapture(e.pointerId)
          } catch {
            /* ignore */
          }
          g.pending = null
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

      {!ready && (
        <div className="absolute inset-0 z-30 flex items-center justify-center" role="status">
          <div className="text-sm font-extrabold uppercase tracking-[0.3em] text-white/80">Opening the gates…</div>
        </div>
      )}

      {/* top HUD: the band met so far */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-center px-14" style={{ paddingTop: 'max(10px, env(safe-area-inset-top))' }}>
        <div className="flex flex-col items-center gap-1 rounded-3xl border-2 border-[#e2483f]/70 bg-[#15111b]/90 px-4 py-2 shadow-lg" role="status" aria-live="polite">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#ff8a92] sm:text-xs">Band met: {met.length}/5</div>
          <div className="flex gap-1.5">
            {BAND.map((m) => (
              <img
                key={m.id}
                src={mcrPortrait(m.id)}
                alt={met.includes(m.id) ? m.name : 'Not met yet'}
                className={`h-7 w-7 rounded-full border-2 object-cover object-top sm:h-8 sm:w-8 ${met.includes(m.id) ? 'anim-pop border-[#e2483f]' : 'border-white/20'}`}
                style={met.includes(m.id) ? undefined : { filter: 'grayscale(1) brightness(0.45)' }}
              />
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
          <div className="anim-rise flex max-w-[92vw] items-center gap-2 rounded-3xl border-2 border-[#e2483f] bg-[#15111b]/95 py-2 pl-3 pr-4 shadow-lg">
            <span className="text-2xl" aria-hidden>
              {toast.icon}
            </span>
            <div className="text-sm font-bold text-white sm:text-base">{toast.text}</div>
          </div>
        </div>
      )}

      {isTouch && ready && !intro && !talking && !show && <DPad keys={keys} color="#e2483f" style={{ bottom: 'calc(max(10px, env(safe-area-inset-bottom)) + 20px)' }} />}

      {/* action button for whatever is close */}
      {n && !talking && !intro && !show && (
        <div className={`absolute inset-x-0 z-10 flex ${isTouch ? 'justify-end pr-4' : 'justify-center'}`} style={{ bottom: 'calc(max(10px, env(safe-area-inset-bottom)) + 24px)' }}>
          <button type="button" className="pill-btn anim-pop text-sm uppercase sm:text-base" style={RED_BTN} onClick={() => act(n)}>
            {actLabel}
            <span className="play-dot">{n.kind === 'member' ? '💬' : n.kind === 'stage' ? '🎸' : n.booth.icon}</span>
          </button>
        </div>
      )}

      {/* chatting with a band member */}
      {talker && (
        <div className="absolute inset-0 z-30 flex items-end justify-center bg-black/40 px-3 pb-6 sm:items-center sm:pb-0" role="dialog" aria-label={`Talking to ${talker.name}`}>
          <div className="anim-rise flex w-full max-w-xl gap-3 rounded-3xl border-2 border-[#e2483f] bg-[#15111b]/95 p-3 text-white shadow-2xl sm:gap-4 sm:p-4">
            <img src={mcrPortrait(talker.id)} alt={talker.name} className="h-32 w-24 shrink-0 rounded-2xl border-2 border-white/15 object-cover object-top sm:h-40 sm:w-28" />
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-baseline gap-2">
                <h2 className="text-xl font-black tracking-wide sm:text-2xl">{talker.name}</h2>
                <span className="text-xs font-bold uppercase tracking-widest text-[#ff8a92]">{talker.role}</span>
              </div>
              <p className="mt-1 text-[15px] font-semibold leading-snug text-white/90 sm:text-base">“{talker.line}”</p>
              <div className="mt-auto flex items-center gap-2 pt-3">
                <HeartShape size={22} color="#e2483f" />
                <button type="button" autoFocus className="pill-btn text-sm" style={RED_BTN} onClick={endTalk}>
                  {met.includes(talker.id) ? 'Rock on!' : `Thank you, ${talker.name.split(' ')[0]}!`}
                  <span className="play-dot">🤘</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* welcome */}
      {ready && intro && (
        <div className="absolute inset-0 z-30 flex items-end justify-center bg-black/30 px-3 pb-24 sm:items-center sm:pb-0">
          <div className="anim-rise flex w-full max-w-lg flex-col items-center gap-2 rounded-3xl border-2 border-[#e2483f] bg-[#15111b]/95 p-4 text-center text-white shadow-2xl sm:p-5">
            <img src={S('mcr_logo')} alt="My Chemical Romance" className="h-16 object-contain sm:h-20" style={{ filter: 'invert(1) drop-shadow(0 0 8px rgba(226,72,63,0.9))' }} />
            <h2 className="text-lg font-black uppercase tracking-[0.25em] text-[#ff8a92] sm:text-xl">Concert Grounds</h2>
            <p className="text-[15px] font-bold leading-snug text-white/90 sm:text-base">
              {met.length === 0
                ? 'Welcome to the night show! The band is hanging around the grounds. Say hi to all five, grab some merch and snacks, then walk up the aisle to the stage for a show just for you two.'
                : met.length < 5
                  ? `Welcome back! You’ve met ${met.length} of 5. The rest of the band is still out on the grounds.`
                  : 'Welcome back, VIP! The whole band knows you now. The stage is waiting.'}
            </p>
            <p className="text-xs text-white/60 sm:text-sm">{isTouch ? 'Tap where to walk, or use the arrows.' : 'Arrow keys / WASD or click to move. Enter to talk.'}</p>
            <button
              type="button"
              autoFocus
              className="pill-btn mt-1 text-sm"
              style={RED_BTN}
              onClick={() => {
                audio.sfx('click')
                setIntro(false)
              }}
            >
              Let’s rock!
              <span className="play-dot">
                <HeartShape size={14} color="#b3202a" />
              </span>
            </button>
          </div>
        </div>
      )}

      {show && <McrConcert onClose={() => setShow(false)} vip={met.length === BAND.length} />}
    </div>
  )
}
