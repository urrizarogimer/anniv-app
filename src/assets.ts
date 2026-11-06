// Sprites were cut from the user's own style sheet (public/ref/3.webp, via tools/extract.py) into public/sprites.
export const S = (name: string) => `/sprites/${name}.png`

export const BRIDE_POSES = ['idle', 'walk1', 'walk2', 'walk3', 'run', 'jump', 'happy', 'excited', 'sad', 'surprised', 'thinking', 'shy', 'blush', 'crying', 'celebrate', 'love'] as const
export const CASUAL_POSES = ['idle', 'walk1', 'walk2', 'walk3', 'run', 'jump', 'happy', 'excited', 'surprised', 'thinking', 'love', 'celebrate'] as const
export const GROOM_POSES = ['idle', 'walk1', 'walk2', 'run', 'happy', 'surprised', 'thinking', 'shy', 'blush', 'love'] as const

export const ALL_SPRITES = [
  ...BRIDE_POSES.map((p) => `bride_${p}`),
  ...CASUAL_POSES.map((p) => `bridec_${p}`),
  ...GROOM_POSES.map((p) => `groom_${p}`),
  'bride_main',
  'groom_main',
  'anim_veil',
  'anim_bouquet',
  'ui_banner',
  'item_dress',
  'item_veil',
  'item_shoes',
  'item_bouquet',
  'item_tiara',
  'item_rings',
  'item_earrings',
  'item_perfume',
  'face_0',
  'face_1',
  'face_2',
  'face_4',
  'face_6',
  'face_10',
]

const cache = new Map<string, HTMLImageElement>()

export function img(name: string) {
  return cache.get(name)
}

export function preloadAll(onProgress?: (done: number, total: number) => void) {
  let done = 0
  const total = ALL_SPRITES.length + 1
  const load = (src: string, key: string) =>
    new Promise<void>((resolve) => {
      const im = new Image()
      im.decoding = 'async'
      im.onload = im.onerror = () => {
        cache.set(key, im)
        done++
        onProgress?.(done, total)
        resolve()
      }
      im.src = src
    })
  return Promise.all([...ALL_SPRITES.map((n) => load(S(n), n)), load('/ref/2.webp', 'ending')])
}
