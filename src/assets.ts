// Sprites were cut from the user's own style sheets into public/sprites:
// public/ref/3.webp via tools/extract.py, and the entourage sheet public/ref/4.webp via tools/extract_entourage.py.
export const S = (name: string) => `/sprites/${name}.png`

/** Bridesmaids wear blue, groomsmen wear beige barong, guests wear sage green or lavender. */
export const MAIDS = ['maid_blue1', 'maid_lblue1', 'maid_blue2', 'maid_blue3', 'maid_lblue2', 'maid_blue4'] as const
// man_11, man_12 and man_14 wear glasses like the groom, so they are left out.
export const GROOMSMEN = ['man_1', 'man_4', 'man_2', 'man_7', 'man_5', 'man_13', 'man_3', 'man_17'] as const
export const GUESTS = ['guest_green1', 'guest_man_lav', 'guest_lav1', 'guest_green3', 'guest_man_green', 'guest_lav2', 'guest_green2', 'man_16'] as const
/** BTS, for the garden stage (public/ref/5.webp via tools/extract_bts.py). Two poses each; j-hope's second is his first, mirrored. */
export const BTS_MEMBERS = [
  { id: 'jin', name: 'JIN' },
  { id: 'suga', name: 'SUGA' },
  { id: 'jhope', name: 'j-hope' },
  { id: 'rm', name: 'RM' },
  { id: 'jimin', name: 'JIMIN' },
  { id: 'v', name: 'V' },
  { id: 'jk', name: 'JUNGKOOK' },
] as const
export function btsPose(id: string, pose: number): { sprite: string; mirror: boolean } {
  if (id === 'jhope') return { sprite: 'bts_jhope_2', mirror: pose === 0 }
  return { sprite: `bts_${id}_${pose === 0 ? 1 : 2}`, mirror: false }
}

export const CHAIR_COLORS = ['blue', 'gold', 'green', 'lav'] as const
export type ChairColor = (typeof CHAIR_COLORS)[number]

export const BRIDE_POSES = ['idle', 'walk1', 'walk2', 'walk3', 'run', 'jump', 'happy', 'excited', 'sad', 'surprised', 'thinking', 'shy', 'blush', 'crying', 'celebrate', 'love'] as const
export const CASUAL_POSES = ['idle', 'walk1', 'walk2', 'walk3', 'run', 'jump', 'happy', 'excited', 'surprised', 'thinking', 'love', 'celebrate'] as const
export const GROOM_POSES = ['idle', 'walk1', 'walk2', 'run', 'happy', 'surprised', 'thinking', 'shy', 'blush', 'love'] as const

/** The K-drama group photo, shown only at the end of the K-Drama Garden (loaded when it opens). */
export const KD_GROUP = '/sprites/kd_group.webp'

/** The eight K-drama actors, as named in their sprite files (see tools/extract_kdrama.py). */
export const KD_ACTOR_IDS = ['haein', 'jongsuk', 'haneul', 'soohyun', 'wooseok', 'changwook', 'seonho', 'joohyuk'] as const

/** The MCR band (public/ref/7.webp) and concert grounds (public/ref/8.webp), cut by tools/extract_mcr.py. */
export const MCR_BAND = ['gerard', 'frank', 'ray', 'mikey', 'bob'] as const
export type McrId = (typeof MCR_BAND)[number]
export const MCR_FRAMES: Record<McrId, number> = { gerard: 5, frank: 4, ray: 3, mikey: 3, bob: 3 }
/** The garden's gate to the grounds uses these, so they load with the rest of the garden. */
export const MCR_GATE_SPRITES = ['mcrg_flag_mcr', 'mcrg_pole_spider', 'mcrg_welcome'] as const
/** Everything else for the grounds and the show, loaded when the grounds open. */
export const MCR_SPRITES = [
  ...MCR_BAND.flatMap((id) => [`mcr_${id}`, ...Array.from({ length: MCR_FRAMES[id] }, (_, i) => `mcr_${id}_a${i + 1}`)]),
  'mcr_logo', 'mcr_spider', 'mcr_heart', 'mcr_note', 'mcr_banner_black', 'mcr_banner_red', 'mcr_barricade',
  'mcrg_stage', 'mcrg_tent_black', 'mcrg_tent_stripe', 'mcrg_tent_white', 'mcrg_merch', 'mcrg_food', 'mcrg_drinks',
  'mcrg_barrier', 'mcrg_barrier_spider', 'mcrg_flag_heart', 'mcrg_flag_spider', 'mcrg_banner_big',
  'mcrg_tower', 'mcrg_tower_warm', 'mcrg_speakers', 'mcrg_cases', 'mcrg_spider', 'mcrg_crowd_fence',
  'mcrg_tree1', 'mcrg_tree2', 'mcrg_tree3', 'mcrg_potty', 'mcrg_potty2', 'mcrg_crates', 'mcrg_lamp', 'mcrg_bench',
  'mcrg_case_yellow', 'mcrg_trash', 'mcrg_generator', 'mcrg_screen', 'mcrg_pole_red', 'mcrg_wheel',
]
/** The band's portraits are framed cards (JPEG), shown in their chat. */
export const mcrPortrait = (id: McrId) => `/sprites/mcr_p_${id}.jpg`

export const ALL_SPRITES = [
  ...BRIDE_POSES.map((p) => `bride_${p}`),
  ...CASUAL_POSES.map((p) => `bridec_${p}`),
  ...GROOM_POSES.map((p) => `groom_${p}`),
  'bride_main',
  'groom_main',
  'anim_veil',
  'anim_bouquet',
  'prop_gift',
  'prop_basket',
  'prop_rings',
  'prop_cakestand',
  'prop_lantern',
  ...MAIDS,
  ...GROOMSMEN,
  ...GUESTS,
  ...CHAIR_COLORS.map((c) => `chair_${c}`),
  ...BTS_MEMBERS.flatMap((m) => (m.id === 'jhope' ? ['bts_jhope_2'] : [`bts_${m.id}_1`, `bts_${m.id}_2`])),
  'bts_logo',
  'bts_lightstick',
  ...KD_ACTOR_IDS.flatMap((id) => [`kd_${id}_idle`, `kd_${id}_happy`, `kd_${id}_oops`]),
  'kd_clapper',
  ...MCR_GATE_SPRITES,
  'bow_blue',
  'bow_lav',
  'bow_green',
  'bow_gold',
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

/** Load extra sprites into the cache on demand (for areas that open later, like the MCR grounds). */
export function loadSprites(names: readonly string[]) {
  return Promise.all(
    names.map(
      (n) =>
        new Promise<void>((resolve) => {
          if (cache.has(n)) return resolve()
          const im = new Image()
          im.decoding = 'async'
          im.onload = im.onerror = () => {
            cache.set(n, im)
            resolve()
          }
          im.src = S(n)
        }),
    ),
  )
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
