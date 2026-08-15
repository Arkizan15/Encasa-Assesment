import { useEffect, useRef, useState } from 'react'

/**
 * FASE 2 — Timer hitung mundur.
 *
 * @param {Object}   options
 * @param {number}   options.initialSeconds Durasi awal dalam detik.
 * @param {Function} options.onExpire       Dipanggil sekali saat waktu habis (auto-submit).
 * @param {*}        [options.resetKey]     Jika berubah, timer di-reset ke initialSeconds
 *                                          (dipakai untuk timer per soal).
 * @returns {{ secondsLeft: number }}
 */
export default function useCountdown({ initialSeconds, onExpire, resetKey }) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds)

  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire
  const firedRef = useRef(false)

  // Reset saat soal berganti (resetKey berubah) — dipakai untuk timer per soal
  useEffect(() => {
    setSecondsLeft(initialSeconds)
    firedRef.current = false
  }, [resetKey, initialSeconds])

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
