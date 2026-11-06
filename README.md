# Our Chibi Wedding Adventure

A small romantic web game: collect the bride's 8 wedding treasures in a flower garden, get ready, and head for the aisle... but the wedding isn't until November 28. It's an 8th-anniversary gift (Nov 22) that ends with "See you on our Wedding Day!"

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:5179. `npm run build` makes a static build in `dist/`.

## Controls

- **Keyboard:** arrow keys or WASD to move, Enter / Space for buttons and dialogues.
- **Mouse:** click where the bride should walk; click buttons.
- **Touch:** tap where she should walk, or use the on-screen arrows.
- The round speaker button (top right) mutes or unmutes; the choice is remembered.

## Scenes

1. Opening: the bride looking out at the venue, and the "BEGIN OUR FOREVER" button.
2. Garden: find the dress, veil, shoes, bouquet, tiara, rings, earrings and perfume, then walk through the arch to the chapel door (it glows, with a "Get ready here" bubble) to start getting ready. The bride wears a dusty blue sundress here. Tap the purple "Exclusive Concert for your Anniversary" stage (or walk up to it and press "Watch BTS perform" / Enter): BTS first greet "Happy 8th Anniversary to you, AC and Giero!", then "Play Dynamite" starts the song and the dance. Esc or "Back to the garden" returns.
   - **K-Drama Celebrity Treasure Hunt:** the gate at the end of the right-hand path (or "Visit the K-Drama Garden") opens a cherry-blossom garden with eight chibi K-drama actors: Jung Hae-in, Lee Jong-suk, Kang Ha-neul, Kim Soo-hyun, Byeon Woo-seok, Ji Chang-wook, Kim Seon-ho and Nam Joo-hyuk. Walk up to one and "Talk to actor": they share a line from one of their dramas, then you pick their name from four shuffled choices. A wrong pick gives a hint (the drama, then the role, then another drama) and another try; a right pick earns their wish and a treasure from a chest. All eight unlock the group photo, "You're officially our K-Drama Queen!" and the K-Drama Super Fan Trophy. Progress is saved in the browser. The drama lines are original paraphrases inspired by each actor's real role (correctly credited), not verbatim quotes; they live in `src/kdrama/data.ts`.
3. Preparation: the items are put on one by one.
4. Aisle (`ceremony`): the bride reaches the start of the aisle and is stopped. "Wait… not yet!" Our wedding is on November 28, with a live countdown to that day.
5. Celebration ("Almost married!"): tap the bride or groom for new poses.
6. Ending: the anniversary picture above the seated wedding party (bridesmaids in blue, groomsmen in beige barong, guests in sage green and lavender; tap anyone for a hop), the cake and a "Play again" button.

For testing, `?scene=garden` (or `prep`, `ceremony`, `celebration`, `ending`) jumps straight to a scene. `?scene=garden&kdrama` opens the K-Drama Garden. To start the treasure hunt over, clear the `chibi-wedding-kdrama-v1` entry in the browser's local storage.

## Art and sound

- `public/ref/3.webp` is the main sprite sheet (`1.webp` is the older, lower-quality sheet). `2.webp` is the ending picture. `4.webp` is the entourage sheet: bridesmaids, groomsmen, guests, bow chairs, cake stand, lanterns and the "Our Wedding Day" title card.
- `public/sprites/` holds the characters, items and banner cut out of `3.webp`. To redo them, use `tools/extract.py` (cut-out with background removal) and then `tools/recolor.py` (makes the dusty blue "before" dress the bride wears in the garden). They need Python with Pillow, NumPy and SciPy:
  `python tools/extract.py public/ref/3.webp public/sprites && python tools/recolor.py public/sprites`
  The entourage sprites (and the green/lavender shirts for two male guests) come from `python tools/extract_entourage.py public/ref/4.webp public/sprites`.
- The ending shows `public/ref/2.webp` with animated petals, hearts, butterflies and lights over it.
- Scenery (garden, arch, fairy lights) is drawn in code: SVG for most scenes, canvas for the garden. Chairs, cake stand and lanterns are sprites.
- All music and sound effects are synthesized with WebAudio in `src/audio.ts`, including an original piano ballad for the K-Drama Garden; the only audio file is your own optional song for the stage show.
- The stage show plays your own copy of "Dynamite" if you put it in `public/audio/` as `dynamite.mp3` (or `.m4a`, `.aac`, `.ogg`, `.wav`); it loops and is not included. Without it, an original disco groove at 114 BPM plays. No video is shown, and the mute button controls both.
- `public/ref/5.webp` is the BTS sheet; `python tools/extract_bts.py public/ref/5.webp public/sprites` cuts the members, logo and lightstick.
- `public/ref/6.webp` is the K-drama actor sheet; `python tools/extract_kdrama.py public/ref/6.webp public/sprites` cuts each actor's standing, laughing and surprised poses, the group photo and the clapperboard. The K-Drama Garden scenery and the treasure icons are drawn in code (`src/kdrama/`).
