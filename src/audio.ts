// All music and sound effects are synthesized with WebAudio, so the game needs no audio files.

export type Track = 'opening' | 'garden' | 'ceremony' | 'ending'
export type Sfx = 'click' | 'pickup' | 'sparkle' | 'complete' | 'whoosh' | 'pop' | 'chime' | 'kiss'

type Note = [beat: number, midi: number, len: number, vel?: number]
interface Bar {
  chord: number[]
  melody: Note[]
}
interface TrackDef {
  bpm: number
  beatsPerBar: number
  bars: Bar[]
  arp: 'waltz' | 'flow' | 'harp'
  intro?: Bar[]
}

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12)

// MIDI helpers
const G4 = 67, A4 = 69, B4 = 71
const C5 = 72, D5 = 74, E5 = 76, F5 = 77, G5 = 79, A5 = 81, B5 = 83, C6 = 84, D6 = 86
const Bb4 = 70, Fs5 = 78, Cs5 = 73, Fs4 = 66

// Chords (low voicing)
const Fmaj = [53, 57, 60], Cmaj = [48, 52, 55], Dm = [50, 53, 57], Bb = [46, 50, 53], Am = [45, 48, 52], Gm = [43, 46, 50]
const Dmaj = [50, 54, 57], Amaj = [45, 49, 52], Bm = [47, 50, 54], Fsm = [42, 45, 49], Gmaj = [43, 47, 50], Gmaj2 = [55, 59, 62]
const Cmaj2 = [48, 52, 55], Fmaj2 = [53, 57, 60], Am2 = [57, 60, 64]

const TRACKS: Record<Track, TrackDef> = {
  // Soft, hopeful music-box waltz
  opening: {
    bpm: 84,
    beatsPerBar: 3,
    arp: 'waltz',
    bars: [
      { chord: Fmaj, melody: [[0, C5, 1.5], [1.5, A4, 0.5], [2, C5, 1]] },
      { chord: Cmaj, melody: [[0, E5, 2], [2, D5, 1]] },
      { chord: Dm, melody: [[0, D5, 1.5], [1.5, C5, 0.5], [2, A4, 1]] },
      { chord: Bb, melody: [[0, Bb4, 2], [2, C5, 1]] },
      { chord: Fmaj, melody: [[0, A4, 1], [1, C5, 1], [2, F5, 1]] },
      { chord: Am, melody: [[0, E5, 2], [2, C5, 1]] },
      { chord: Bb, melody: [[0, D5, 1], [1, C5, 1], [2, Bb4, 1]] },
      { chord: Cmaj, melody: [[0, C5, 3]] },
    ],
  },
  // Playful garden exploration tune
  garden: {
    bpm: 112,
    beatsPerBar: 4,
    arp: 'flow',
    bars: [
      { chord: Cmaj2, melody: [[0, E5, 0.5], [0.5, G5, 0.5], [1, C6, 1], [2, B5, 0.5], [2.5, A5, 0.5], [3, G5, 1]] },
      { chord: Am2.map((n) => n - 12), melody: [[0, A5, 0.5], [0.5, G5, 0.5], [1, E5, 1], [2, C5, 1], [3, D5, 1]] },
      { chord: Fmaj2, melody: [[0, F5, 0.5], [0.5, A5, 0.5], [1, C6, 1], [2, A5, 0.5], [2.5, F5, 0.5], [3, A5, 1]] },
      { chord: Gmaj2.map((n) => n - 12), melody: [[0, G5, 1.5], [1.5, F5, 0.5], [2, E5, 0.5], [2.5, D5, 0.5], [3, G5, 1]] },
      { chord: Cmaj2, melody: [[0, E5, 0.5], [0.5, G5, 0.5], [1, C6, 1], [2, D6, 0.5], [2.5, C6, 0.5], [3, B5, 1]] },
      { chord: Am2.map((n) => n - 12), melody: [[0, A5, 1], [1, E5, 1], [2, A5, 0.5], [2.5, B5, 0.5], [3, C6, 1]] },
      { chord: Fmaj2, melody: [[0, A5, 0.5], [0.5, G5, 0.5], [1, F5, 1], [2, D5, 1], [3, B4, 1]] },
      { chord: Gmaj2.map((n) => n - 12), melody: [[0, C5, 2], [2, G4, 1], [3, C5, 1]] },
    ],
  },
  // Bridal chorus opening (Wagner, public domain) then a Canon-style progression (Pachelbel, public domain)
  ceremony: {
    bpm: 72,
    beatsPerBar: 4,
    arp: 'harp',
    intro: [
      { chord: [48, 52, 55], melody: [[0, G4, 1], [1, C5, 0.75], [1.75, C5, 0.25], [2, C5, 2]] },
      { chord: [43, 47, 50], melody: [[0, G4, 1], [1, D5, 0.75], [1.75, B4, 0.25], [2, C5, 2]] },
      { chord: [48, 52, 55], melody: [[0, G4, 1], [1, C5, 0.75], [1.75, F5, 0.25], [2, F5, 1], [3, E5, 0.75], [3.75, D5, 0.25]] },
      { chord: [43, 47, 50], melody: [[0, C5, 1], [1, B4, 0.75], [1.75, C5, 0.25], [2, D5, 2]] },
    ],
    bars: [
      { chord: Dmaj, melody: [[0, Fs5, 2], [2, E5, 2]] },
      { chord: Amaj, melody: [[0, D5, 2], [2, Cs5, 2]] },
      { chord: Bm, melody: [[0, B4, 2], [2, A4, 2]] },
      { chord: Fsm, melody: [[0, B4, 2], [2, Cs5, 2]] },
      { chord: Gmaj, melody: [[0, D5, 1], [1, Cs5, 1], [2, B4, 1], [3, Cs5, 1]] },
      { chord: Dmaj, melody: [[0, A4, 1], [1, Fs4, 1], [2, A4, 1], [3, D5, 1]] },
      { chord: Gmaj, melody: [[0, B4, 1], [1, D5, 1], [2, G5, 1], [3, Fs5, 1]] },
      { chord: Amaj, melody: [[0, E5, 2], [2, Cs5, 2]] },
    ],
  },
  // Dreamy, slow ending
  ending: {
    bpm: 66,
    beatsPerBar: 4,
    arp: 'harp',
    bars: [
      { chord: Fmaj, melody: [[0, A5, 2], [2, G5, 1], [3, F5, 1]] },
      { chord: Cmaj, melody: [[0, E5, 2], [2, G5, 2]] },
      { chord: Dm, melody: [[0, F5, 1.5], [1.5, E5, 0.5], [2, D5, 2]] },
      { chord: Am, melody: [[0, C5, 2], [2, E5, 2]] },
      { chord: Bb, melody: [[0, D5, 1], [1, F5, 1], [2, Bb4 + 12, 2]] },
      { chord: Fmaj, melody: [[0, A5, 2], [2, C6, 2]] },
      { chord: Gm, melody: [[0, Bb4 + 12, 1.5], [1.5, A5, 0.5], [2, G5, 2]] },
      { chord: Cmaj, melody: [[0, E5, 1], [1, G5, 1], [2, C6, 2]] },
    ],
  },
}

const LS_KEY = 'chibi-wedding-muted'

class AudioEngine {
  private ctx: AudioContext | null = null
  private master!: GainNode
  private musicBus!: GainNode
  private sfxBus!: GainNode
  private reverb!: ConvolverNode
  private reverbSend!: GainNode
  private timer: number | null = null
  private track: Track | null = null
  private nextBarTime = 0
  private barIndex = 0
  private inIntro = false
  muted = false
  private listeners = new Set<(m: boolean) => void>()

  constructor() {
    try {
      this.muted = localStorage.getItem(LS_KEY) === '1'
    } catch {
      this.muted = false
    }
  }

  /** Must be called from a user gesture (click / key / touch). */
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AC) return
      this.ctx = new AC()
      this.master = this.ctx.createGain()
      this.master.gain.value = this.muted ? 0 : 0.9
      this.master.connect(this.ctx.destination)
      this.musicBus = this.ctx.createGain()
      this.musicBus.gain.value = 0.32
      this.sfxBus = this.ctx.createGain()
      this.sfxBus.gain.value = 0.55
      this.reverb = this.ctx.createConvolver()
      this.reverb.buffer = this.makeImpulse(2.6)
      this.reverbSend = this.ctx.createGain()
      this.reverbSend.gain.value = 0.38
      this.musicBus.connect(this.master)
      this.sfxBus.connect(this.master)
      this.reverbSend.connect(this.reverb)
      this.reverb.connect(this.master)
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
  }

  subscribe(fn: (m: boolean) => void) {
    this.listeners.add(fn)
    return () => {
      this.listeners.delete(fn)
    }
  }

  setMuted(m: boolean) {
    this.muted = m
    try {
      localStorage.setItem(LS_KEY, m ? '1' : '0')
    } catch {
      /* private mode */
    }
    if (this.ctx) {
      const t = this.ctx.currentTime
      this.master.gain.cancelScheduledValues(t)
      this.master.gain.setTargetAtTime(m ? 0 : 0.9, t, 0.08)
    }
    this.listeners.forEach((fn) => fn(m))
  }

  private makeImpulse(seconds: number) {
    const ctx = this.ctx!
    const len = Math.floor(ctx.sampleRate * seconds)
    const buf = ctx.createBuffer(2, len, ctx.sampleRate)
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c)
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2)
    }
    return buf
  }

  // ---------- instruments ----------
  private musicBox(midi: number, t: number, len: number, vel = 0.5, bus?: AudioNode) {
    const ctx = this.ctx!
    const out = bus ?? this.musicBus
    const f = mtof(midi)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(vel * 0.42, t + 0.008)
    g.gain.exponentialRampToValueAtTime(0.0008, t + Math.max(0.6, len * 1.6))
    const o1 = ctx.createOscillator()
    o1.type = 'sine'
    o1.frequency.value = f
    const o2 = ctx.createOscillator()
    o2.type = 'sine'
    o2.frequency.value = f * 3.01
    const g2 = ctx.createGain()
    g2.gain.value = 0.18
    const o3 = ctx.createOscillator()
    o3.type = 'triangle'
    o3.frequency.value = f * 2
    const g3 = ctx.createGain()
    g3.gain.value = 0.12
    o1.connect(g)
    o2.connect(g2).connect(g)
    o3.connect(g3).connect(g)
    g.connect(out)
    g.connect(this.reverbSend)
    const end = t + Math.max(0.7, len * 1.7)
    for (const o of [o1, o2, o3]) {
      o.start(t)
      o.stop(end)
    }
  }

  private pluck(midi: number, t: number, vel = 0.3) {
    const ctx = this.ctx!
    const f = mtof(midi)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(vel * 0.3, t + 0.005)
    g.gain.exponentialRampToValueAtTime(0.0008, t + 1.4)
    const o = ctx.createOscillator()
    o.type = 'triangle'
    o.frequency.value = f
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.setValueAtTime(f * 6, t)
    lp.frequency.exponentialRampToValueAtTime(f * 1.5, t + 0.6)
    o.connect(lp).connect(g)
    g.connect(this.musicBus)
    g.connect(this.reverbSend)
    o.start(t)
    o.stop(t + 1.5)
  }

  private pad(chord: number[], t: number, dur: number, vel = 0.08) {
    const ctx = this.ctx!
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(vel, t + dur * 0.3)
    g.gain.linearRampToValueAtTime(vel * 0.8, t + dur * 0.8)
    g.gain.linearRampToValueAtTime(0, t + dur + 0.4)
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 900
    lp.connect(g)
    g.connect(this.musicBus)
    g.connect(this.reverbSend)
    for (const m of chord) {
      for (const det of [-6, 6]) {
        const o = ctx.createOscillator()
        o.type = 'triangle'
        o.frequency.value = mtof(m + 12)
        o.detune.value = det
        o.connect(lp)
        o.start(t)
        o.stop(t + dur + 0.5)
      }
    }
  }

  // ---------- music scheduler ----------
  playMusic(track: Track) {
    if (!this.ctx) return
    if (this.track === track) return
    this.stopMusic()
    this.track = track
    const def = TRACKS[track]
    this.inIntro = !!def.intro
    this.barIndex = 0
    this.nextBarTime = this.ctx.currentTime + 0.15
    // fade the bus back in
    const t = this.ctx.currentTime
    this.musicBus.gain.cancelScheduledValues(t)
    this.musicBus.gain.setValueAtTime(0.0001, t)
    this.musicBus.gain.linearRampToValueAtTime(0.32, t + 1.2)
    const tick = () => {
      if (!this.ctx || this.track !== track) return
      while (this.nextBarTime < this.ctx.currentTime + 0.6) this.scheduleBar(def)
    }
    tick()
    this.timer = window.setInterval(tick, 120)
  }

  stopMusic() {
    if (this.timer !== null) window.clearInterval(this.timer)
    this.timer = null
    this.track = null
    if (this.ctx) {
      const t = this.ctx.currentTime
      this.musicBus.gain.cancelScheduledValues(t)
      this.musicBus.gain.setValueAtTime(this.musicBus.gain.value, t)
      this.musicBus.gain.linearRampToValueAtTime(0.0001, t + 0.6)
    }
  }

  private scheduleBar(def: TrackDef) {
    const beat = 60 / def.bpm
    const bars = this.inIntro && def.intro ? def.intro : def.bars
    const bar = bars[this.barIndex % bars.length]
    const t0 = this.nextBarTime
    const barDur = beat * def.beatsPerBar
    const [r, third, fifth] = bar.chord

    if (def.arp === 'waltz') {
      this.musicBox(r - 12 + 12, t0, beat, 0.35)
      this.musicBox(third + 12, t0 + beat, beat, 0.22)
      this.musicBox(fifth + 12, t0 + beat * 2, beat, 0.22)
      this.pad(bar.chord, t0, barDur, 0.05)
    } else if (def.arp === 'flow') {
      const seq = [r, fifth, third + 12, fifth, r + 12, fifth, third + 12, fifth]
      seq.forEach((m, i) => this.pluck(m, t0 + i * beat * 0.5, i % 2 === 0 ? 0.32 : 0.2))
    } else {
      const seq = [r, fifth, r + 12, third + 12, fifth + 12, third + 12, r + 12, fifth]
      seq.forEach((m, i) => this.pluck(m, t0 + i * beat * 0.5, 0.26))
      this.pad(bar.chord, t0, barDur, 0.06)
    }
    for (const [b, m, len, vel] of bar.melody) this.musicBox(m, t0 + b * beat, len * beat, vel ?? 0.5)

    this.nextBarTime += barDur
    this.barIndex++
    if (this.inIntro && def.intro && this.barIndex >= def.intro.length) {
      this.inIntro = false
      this.barIndex = 0
    }
  }

  // ---------- sound effects ----------
  sfx(name: Sfx) {
    if (!this.ctx) return
    const ctx = this.ctx
    const t = ctx.currentTime + 0.01
    const blip = (f0: number, f1: number, dur: number, type: OscillatorType, vol: number, at = t) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = type
      o.frequency.setValueAtTime(f0, at)
      o.frequency.exponentialRampToValueAtTime(f1, at + dur)
      g.gain.setValueAtTime(0, at)
      g.gain.linearRampToValueAtTime(vol, at + 0.01)
      g.gain.exponentialRampToValueAtTime(0.0008, at + dur)
      o.connect(g)
      g.connect(this.sfxBus)
      g.connect(this.reverbSend)
      o.start(at)
      o.stop(at + dur + 0.05)
    }
    const bell = (midi: number, at: number, vol = 0.5) => this.musicBox(midi, at, 0.5, vol, this.sfxBus)

    switch (name) {
      case 'click':
        blip(880, 1320, 0.09, 'sine', 0.25)
        break
      case 'pop':
        blip(500, 1100, 0.12, 'sine', 0.3)
        blip(1500, 2400, 0.08, 'triangle', 0.08, t + 0.04)
        break
      case 'kiss':
        blip(1200, 600, 0.12, 'sine', 0.22)
        blip(700, 1600, 0.14, 'sine', 0.2, t + 0.12)
        break
      case 'sparkle':
        ;[C6 + 7, C6 + 12, C6 + 16, C6 + 19].forEach((m, i) => bell(m, t + i * 0.05 + Math.random() * 0.02, 0.22))
        break
      case 'chime':
        bell(E5 + 12, t, 0.4)
        bell(B5 + 12, t + 0.08, 0.3)
        break
      case 'pickup':
        ;[C5, E5, G5, C6].forEach((m, i) => bell(m + 12, t + i * 0.07, 0.42))
        ;[C6 + 7, C6 + 12].forEach((m, i) => bell(m + 12, t + 0.32 + i * 0.05, 0.18))
        break
      case 'complete':
        ;[C5, E5, G5, C6, E5 + 12, G5 + 12].forEach((m, i) => bell(m, t + i * 0.1, 0.45))
        this.pad([60, 64, 67], t + 0.5, 1.6, 0.12)
        break
      case 'whoosh': {
        const len = Math.floor(ctx.sampleRate * 0.7)
        const buf = ctx.createBuffer(1, len, ctx.sampleRate)
        const d = buf.getChannelData(0)
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
        const src = ctx.createBufferSource()
        src.buffer = buf
        const bp = ctx.createBiquadFilter()
        bp.type = 'bandpass'
        bp.Q.value = 1.2
        bp.frequency.setValueAtTime(400, t)
        bp.frequency.exponentialRampToValueAtTime(3500, t + 0.6)
        const g = ctx.createGain()
        g.gain.setValueAtTime(0, t)
        g.gain.linearRampToValueAtTime(0.18, t + 0.2)
        g.gain.linearRampToValueAtTime(0, t + 0.7)
        src.connect(bp).connect(g)
        g.connect(this.sfxBus)
        g.connect(this.reverbSend)
        src.start(t)
        ;[G5, C6, E5 + 12].forEach((m, i) => bell(m + 12, t + 0.25 + i * 0.07, 0.18))
        break
      }
    }
  }
}

export const audio = new AudioEngine()


if (import.meta.env.DEV) (window as unknown as { __audio: AudioEngine }).__audio = audio
