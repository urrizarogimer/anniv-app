import { useEffect, useState } from 'react'
import { audio } from '../audio'

export function MuteButton() {
  const [muted, setMuted] = useState(audio.muted)
  useEffect(() => audio.subscribe(setMuted), [])
  return (
    <button
      type="button"
      className="round-btn pointer-events-auto"
      aria-label={muted ? 'Turn sound on' : 'Mute sound'}
      aria-pressed={muted}
      onClick={(e) => {
        e.stopPropagation()
        audio.unlock()
        audio.setMuted(!muted)
        if (muted) audio.sfx('click')
      }}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <svg viewBox="0 0 24 24" width={22} height={22} aria-hidden>
        <path d="M4 9h3l5-4v14l-5-4H4z" fill="#ec6a90" stroke="#d64d77" strokeWidth={1.2} strokeLinejoin="round" />
        {muted ? (
          <path d="M16 9l5 6M21 9l-5 6" stroke="#d64d77" strokeWidth={2.2} strokeLinecap="round" />
        ) : (
          <>
            <path d="M15.5 9a4 4 0 0 1 0 6" stroke="#ec6a90" strokeWidth={2} fill="none" strokeLinecap="round" />
            <path d="M18 6.5a7.5 7.5 0 0 1 0 11" stroke="#f78aa8" strokeWidth={2} fill="none" strokeLinecap="round" />
          </>
        )}
      </svg>
    </button>
  )
}
