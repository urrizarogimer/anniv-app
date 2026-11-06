// The K-Drama Celebrity Treasure Hunt: eight actors, their drama lines, hints, wishes and treasures.
//
// The drama lines are original paraphrases inspired by each actor's well-known role (not verbatim
// quotes, which can't be verified or licensed here). Each drama, year and character is correctly
// credited to the actor who played it.

export type ActorId = 'haein' | 'jongsuk' | 'haneul' | 'soohyun' | 'wooseok' | 'changwook' | 'seonho' | 'joohyuk'
export type TreasureId = 'letter' | 'star' | 'brooch' | 'royalbox' | 'crystal' | 'charm' | 'keepsake' | 'sapphire'

export interface Actor {
  id: ActorId
  name: string
  /** world position of the actor's feet in the K-Drama Garden */
  spot: [number, number]
  greeting: string
  line: string
  drama: string
  year: number
  character: string
  /** extra hint once the drama and character have been given */
  more: string
  /** a little nudge when the bride picks the wrong name */
  nudge: string
  wish: string
  treasure: TreasureId
  /** tint behind the actor in the dialogue, matching their outfit */
  tint: string
}

export interface Treasure {
  id: TreasureId
  name: string
}

export const TREASURES: Record<TreasureId, Treasure> = {
  letter: { id: 'letter', name: 'Romantic Love Letter' },
  star: { id: 'star', name: 'Magical Star Pendant' },
  brooch: { id: 'brooch', name: 'Golden Flower Brooch' },
  royalbox: { id: 'royalbox', name: 'Royal Treasure Box' },
  crystal: { id: 'crystal', name: 'Shining Crystal Necklace' },
  charm: { id: 'charm', name: 'Golden Lucky Charm' },
  keepsake: { id: 'keepsake', name: 'Heart-shaped Keepsake' },
  sapphire: { id: 'sapphire', name: 'Dreamy Sapphire Ring' },
}

export const TROPHY_NAME = 'The K-Drama Super Fan Trophy'

export const ACTORS: Actor[] = [
  {
    id: 'haein',
    name: 'Jung Hae-in',
    spot: [330, 560],
    greeting: 'Hello there! Do you recognize me? I have a line from one of my dramas. Can you guess who I am?',
    line: 'It’s raining again… Good thing my umbrella is just big enough for two.',
    drama: 'Something in the Rain',
    year: 2018,
    character: 'Seo Joon-hee, who always shares his umbrella',
    more: 'I also played a soldier in “D.P.” and a childhood friend in “Love Next Door”.',
    nudge: 'Aww, close! But that’s not me.',
    wish: 'Congratulations, beautiful bride! May your love story always have a happy ending. Here’s a little treasure for you!',
    treasure: 'letter',
    tint: '#e9e4f5',
  },
  {
    id: 'jongsuk',
    name: 'Lee Jong-suk',
    spot: [760, 500],
    greeting: 'Annyeong! You look like a true K-drama fan. Listen to my line and tell me who I am!',
    line: 'My whole life was drawn in a comic… until you stepped right into my story.',
    drama: 'W: Two Worlds',
    year: 2016,
    character: 'Kang Chul, a webtoon hero who comes to life',
    more: 'I also starred in “Pinocchio” and “While You Were Sleeping”.',
    nudge: 'Hmm, not quite. Read my line one more time!',
    wish: 'Wishing you a lifetime of beautiful memories together. Every chapter of your story is my favorite!',
    treasure: 'star',
    tint: '#f3ede2',
  },
  {
    id: 'haneul',
    name: 'Kang Ha-neul',
    spot: [1180, 520],
    greeting: 'Oh! The bride is here! I have a famous line for you. Do you know who says it?',
    line: 'You’re the bravest, most amazing person in this whole town. Don’t you ever forget that!',
    drama: 'When the Camellia Blooms',
    year: 2019,
    character: 'Yong-sik, the honest country police officer from Ongsan',
    more: 'I was also a prince in “Moon Lovers: Scarlet Heart Ryeo”.',
    nudge: 'Oops, that’s my friend, not me!',
    wish: 'May your forever bloom brighter than any camellia, and may every day together feel brand new!',
    treasure: 'brooch',
    tint: '#e6eedd',
  },
  {
    id: 'soohyun',
    name: 'Kim Soo-hyun',
    spot: [1480, 600],
    greeting: 'Welcome, beautiful bride! I’ve prepared a line from one of my dramas. Can you guess who I am?',
    line: 'Through every storm and every tear, if I could go back, I would still choose you.',
    drama: 'Queen of Tears',
    year: 2024,
    character: 'Baek Hyun-woo, the lawyer from Yongdu-ri who married an heiress',
    more: 'I was also a 400-year-old alien in “My Love from the Star”.',
    nudge: 'Ah, so close! Try once more.',
    wish: 'May your marriage be full of laughter, and may every tear you share be a happy one. You deserve the royal treatment!',
    treasure: 'royalbox',
    tint: '#e7e6ee',
  },
  {
    id: 'wooseok',
    name: 'Byeon Woo-seok',
    spot: [260, 900],
    greeting: 'Hi! I’ve been waiting for you. Here’s a line from my drama. Who am I?',
    line: 'You saved me first. So in every lifetime, I’ll come running to find you.',
    drama: 'Lovely Runner',
    year: 2024,
    character: 'Ryu Sun-jae, a swimmer turned idol with a yellow umbrella',
    more: 'I was also a high-school heartthrob in the film “20th Century Girl”.',
    nudge: 'Hmm, not that one! Want to try again?',
    wish: 'May your love shine like a crystal, in this life and every life after. Congratulations!',
    treasure: 'crystal',
    tint: '#e2edf8',
  },
  {
    id: 'changwook',
    name: 'Ji Chang-wook',
    spot: [640, 1010],
    greeting: 'Psst! Over here, bride! I have a secret line from my drama. Can you guess who I am?',
    line: 'They call me the night courier. I can deliver anything, anywhere… even my heart.',
    drama: 'Healer',
    year: 2014,
    character: 'Seo Jung-hoo, a mysterious night courier',
    more: 'I also starred in “Suspicious Partner” and “The K2”.',
    nudge: 'Nope, not me!',
    wish: 'Wishing you endless luck and love! May your home always be warm and your hearts always close.',
    treasure: 'charm',
    tint: '#e1e4f1',
  },
  {
    id: 'seonho',
    name: 'Kim Seon-ho',
    spot: [1160, 990],
    greeting: 'Hello hello! Ready for a little K-drama quiz? Listen to my line!',
    line: 'In this seaside village I can fix anything: a leaky roof, a squeaky door… maybe even a lonely heart.',
    drama: 'Hometown Cha-Cha-Cha',
    year: 2021,
    character: 'Hong Du-sik, the village’s favorite handyman “Chief Hong”',
    more: 'I was also the investor Han Ji-pyeong in “Start-Up”.',
    nudge: 'Hehe, not quite! Try again.',
    wish: 'May your forever be even more romantic than a K-drama! Keep this little heart close, always.',
    treasure: 'keepsake',
    tint: '#f4ebdd',
  },
  {
    id: 'joohyuk',
    name: 'Nam Joo-hyuk',
    spot: [1480, 940],
    greeting: 'Hey! I heard there’s a wedding coming up! Can you guess me from my drama line?',
    line: 'We didn’t have much back then, but with you, every single day felt like summer.',
    drama: 'Twenty-Five Twenty-One',
    year: 2022,
    character: 'Baek Yi-jin, a sports reporter who cheered for a fencer',
    more: 'I was also a swimmer in “Weightlifting Fairy Kim Bok-joo”.',
    nudge: 'Oops! That’s not my name.',
    wish: 'Congratulations! Your own love story deserves the happiest ending. I can’t wait to see it!',
    treasure: 'sapphire',
    tint: '#dfe8f5',
  },
]

export const actorById = (id: ActorId) => ACTORS.find((a) => a.id === id)!

/** The hint after the n-th wrong answer (1-based). Never says the actor's name. */
export function hintFor(a: Actor, wrong: number) {
  if (wrong <= 1) return `Here’s a hint: this line is from “${a.drama}” (${a.year}).`
  if (wrong === 2) return `Another hint: in that drama I played ${a.character}.`
  return `One more hint: ${a.more}`
}

/** Four names: the right one plus three others, in random order. */
export function quizChoices(a: Actor) {
  const others = ACTORS.filter((x) => x.id !== a.id)
    .map((x) => ({ x, k: Math.random() }))
    .sort((p, q) => p.k - q.k)
    .slice(0, 3)
    .map((p) => p.x)
  return [a, ...others]
    .map((x) => ({ x, k: Math.random() }))
    .sort((p, q) => p.k - q.k)
    .map((p) => ({ id: p.x.id, name: p.x.name }))
}

export const RIGHT_TEXT = 'You got it right! You really know your K-dramas!'
export const WRONG_TEXT = 'Oops! Not quite! Want to try again?'
