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

1. Opening: "OUR WEDDING DAY 11.28.26" and the "BEGIN OUR FOREVER" button.
2. Garden: find the dress, veil, shoes, bouquet, tiara, rings, earrings and perfume.
3. Preparation: the items are put on one by one.
4. Aisle (`ceremony`): the bride reaches the start of the aisle and is stopped. "Wait… not yet!" Our wedding is on November 28, with a live countdown to that day.
5. Celebration ("Almost married!"): tap the bride or groom for new poses.
6. Ending: the anniversary picture and a "Play again" button.

For testing, `?scene=garden` (or `prep`, `ceremony`, `celebration`, `ending`) jumps straight to a scene.

## Art and sound

- `public/ref/3.webp` is the sprite sheet the sprites come from (`1.webp` is the older, lower-quality sheet). `2.webp` is the ending picture.
- `public/sprites/` holds the characters, items and banner cut out of `3.webp`. To redo them, use `tools/extract.py` (cut-out with background removal) and then `tools/recolor.py` (makes the pink "before" dress). They need Python with Pillow, NumPy and SciPy:
  `python tools/extract.py public/ref/3.webp public/sprites && python tools/recolor.py public/sprites`
- The ending shows `public/ref/2.webp` with animated petals, hearts, butterflies and lights over it.
- Scenery (garden, arch, chairs, fairy lights) is drawn in code: SVG for most scenes, canvas for the garden.
- All music and sound effects are synthesized with WebAudio in `src/audio.ts`; there are no audio files.
