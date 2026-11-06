import type { CSSProperties, PointerEvent } from 'react'

/** On-screen arrows for touch screens. Holding a button adds its direction to `keys`. */
export function DPad({ keys, style, color = '#ec6a90' }: { keys: { current: Set<string> }; style?: CSSProperties; color?: string }) {
  const pad = (dir: string) => ({
    onPointerDown: (e: PointerEvent) => {
      e.preventDefault()
      try {
        ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      } catch {
        /* capture is a nicety; ignore if the pointer is already gone */
      }
      keys.current.add(dir)
    },
    onPointerUp: () => keys.current.delete(dir),
    onPointerCancel: () => keys.current.delete(dir),
    onLostPointerCapture: () => keys.current.delete(dir),
  })
  return (
    <div className="absolute left-3 grid grid-cols-3 grid-rows-3 gap-1 opacity-90" style={style}>
      {(
        [
          ['pad-up', 'col-start-2 row-start-1', 0],
          ['pad-left', 'col-start-1 row-start-2', -90],
          ['pad-right', 'col-start-3 row-start-2', 90],
          ['pad-down', 'col-start-2 row-start-3', 180],
        ] as const
      ).map(([dir, pos, rot]) => (
        <button key={dir} type="button" aria-label={dir.replace('pad-', 'Move ')} className={`round-btn !h-11 !w-11 touch-none ${pos}`} {...pad(dir)}>
          <svg viewBox="0 0 24 24" width={20} height={20} style={{ transform: `rotate(${rot}deg)` }} aria-hidden>
            <path d="M12 5l7 9H5z" fill={color} />
          </svg>
        </button>
      ))}
    </div>
  )
}
