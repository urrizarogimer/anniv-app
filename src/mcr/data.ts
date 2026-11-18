import type { McrId } from '../assets'

export interface BandMember {
  id: McrId
  name: string
  role: string
  /** where they hang out on the grounds: their feet, in world units */
  spot: [number, number]
  /** height on the grounds, in world units (Bob is sat behind his kit, so he is drawn wider) */
  h: number
  /** an original anniversary wish (not a lyric) */
  line: string
  gift: string
  giftIcon: string
}

export const BAND: BandMember[] = [
  {
    id: 'gerard',
    name: 'Gerard Way',
    role: 'Vocals',
    spot: [520, 600],
    h: 150,
    line: 'Eight years together? That is a story worth singing out loud. Happy anniversary, AC and Giero. Tonight’s show is for you two!',
    gift: 'a signed setlist',
    giftIcon: '📜',
  },
  {
    id: 'frank',
    name: 'Frank Iero',
    role: 'Guitar',
    spot: [430, 860],
    h: 146,
    line: 'Real love is like a great riff: you play it again and again and it never gets old. Happy 8th, you two!',
    gift: 'a guitar pick',
    giftIcon: '🎸',
  },
  {
    id: 'ray',
    name: 'Ray Toro',
    role: 'Lead guitar',
    spot: [1380, 820],
    h: 150,
    line: 'I tuned every string tonight just for the two of you. Here’s to eight years, and a lifetime of encores!',
    gift: 'a backstage wristband',
    giftIcon: '🎫',
  },
  {
    id: 'mikey',
    name: 'Mikey Way',
    role: 'Bass',
    spot: [1250, 600],
    h: 148,
    line: 'The bass keeps a band together. You two keep each other together. Happy anniversary, AC and Giero!',
    gift: 'a band pin',
    giftIcon: '🖤',
  },
  {
    id: 'bob',
    name: 'Bob Bryar',
    role: 'Drums',
    spot: [700, 1010],
    h: 132,
    line: 'Eight years, steady as a heartbeat. Count it in with me: one, two, three, four… forever!',
    gift: 'a drumstick',
    giftIcon: '🥁',
  },
]

export const memberById = (id: McrId) => BAND.find((m) => m.id === id)!

/** Booths you can visit. (x, y) is the middle of the counter's front edge. */
export interface Booth {
  id: 'merch' | 'food' | 'drinks'
  label: string
  x: number
  y: number
  toast: string
  icon: string
}

export const BOOTHS: Booth[] = [
  { id: 'merch', label: 'Browse merch', x: 230, y: 712, toast: 'You picked up a matching pair of band tees!', icon: '👕' },
  { id: 'food', label: 'Grab a snack', x: 1490, y: 722, toast: 'Fries and a churro to share. Date night!', icon: '🍟' },
  { id: 'drinks', label: 'Get a drink', x: 1700, y: 912, toast: 'Two sodas: cheers to eight years!', icon: '🥤' },
]

const LS_KEY = 'chibi-wedding-mcr-v1'

export function loadMet(): McrId[] {
  try {
    const v = JSON.parse(localStorage.getItem(LS_KEY) ?? '[]')
    return Array.isArray(v) ? v.filter((id) => BAND.some((m) => m.id === id)) : []
  } catch {
    return []
  }
}

export function saveMet(met: McrId[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(met))
  } catch {
    /* private mode: progress just isn't kept */
  }
}
