/** Keyboard codes (and the touch d-pad's names) mapped to walking directions. */
export const DIRS: Record<string, [number, number]> = {
  ArrowUp: [0, -1],
  KeyW: [0, -1],
  ArrowDown: [0, 1],
  KeyS: [0, 1],
  ArrowLeft: [-1, 0],
  KeyA: [-1, 0],
  ArrowRight: [1, 0],
  KeyD: [1, 0],
  'pad-up': [0, -1],
  'pad-down': [0, 1],
  'pad-left': [-1, 0],
  'pad-right': [1, 0],
}
