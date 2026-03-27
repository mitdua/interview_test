import { useRef, useState, useCallback } from 'react'

export type RecorderState = 'idle' | 'recording' | 'stopped'

export function useAudioRecorder() {
  const [state, setState] = useState<RecorderState>('idle')
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
    chunks.current = []

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.current.push(e.data)
    }

    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop())
    }

    mediaRecorder.current = recorder
    recorder.start()
    setState('recording')
  }, [])

  const stop = useCallback((): Promise<Blob> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorder.current
      if (!recorder || recorder.state !== 'recording') {
        resolve(new Blob())
        return
      }

      recorder.onstop = () => {
        recorder.stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunks.current, { type: 'audio/webm' })
        setState('stopped')
        resolve(blob)
      }

      recorder.stop()
    })
  }, [])

  const reset = useCallback(() => {
    setState('idle')
    chunks.current = []
  }, [])

  return { state, start, stop, reset }
}
