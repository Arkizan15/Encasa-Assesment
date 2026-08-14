import { useEffect, useRef, useState } from 'react'

/**
 * FASE 2 — Timer hitung mundur.
 *
 * @param {Object}   options
 * @param {number}   options.initialSeconds Durasi awal dalam detik.
 * @param {Function} options.onExpire       Dipanggil sekali saat waktu habis (auto-submit).
 * @returns {{ secondsLeft: number }}
 */
export default function useCountdown({ initialSeconds, onExpire }) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds)

  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire
  const firedRef = useRef(false)

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (!firedRef.current) {
        firedRef.current = true
        onExpireRef.current()
      }
      return
    }

    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [secondsLeft])

  return { secondsLeft }
}
