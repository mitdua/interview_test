import { useRef, useState, useEffect } from 'react'

interface Props {
  base64Audio: string
  onEnded?: () => void
  autoPlay?: boolean
}

export default function AudioPlayer({ base64Audio, onEnded, autoPlay = true }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const onEndedRef = useRef(onEnded)
  const [playing, setPlaying] = useState(false)

  // Keep callback ref in sync without triggering effect re-run
  useEffect(() => {
    onEndedRef.current = onEnded
  }, [onEnded])

  useEffect(() => {
    const audio = new Audio(`data:audio/wav;base64,${base64Audio}`)
    audioRef.current = audio

    audio.onplay = () => setPlaying(true)
    audio.onpause = () => setPlaying(false)
    audio.onended = () => {
      setPlaying(false)
      onEndedRef.current?.()
    }

    if (autoPlay) audio.play()

    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [base64Audio, autoPlay])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
    } else {
      audio.currentTime = 0
      audio.play()
    }
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 rounded-lg border border-gray-700/80 bg-gray-800/50 px-4 py-2 text-sm text-gray-300 transition-colors hover:border-gray-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60"
    >
      {playing ? (
        <>
          <span className="inline-flex items-end gap-0.5">
            <span className="h-2.5 w-0.5 animate-pulse rounded-full bg-purple-400" />
            <span className="h-3.5 w-0.5 animate-pulse rounded-full bg-purple-400 [animation-delay:75ms]" />
            <span className="h-2 w-0.5 animate-pulse rounded-full bg-purple-400 [animation-delay:150ms]" />
          </span>
          Playing...
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.841z" />
          </svg>
          Replay
        </>
      )}
    </button>
  )
}
