import { useEffect, useRef, useState } from 'react'

/**
 * FASE 2 — Timer hitung mundur per soal (deadline tunggal, anti double-fire).
 *
 * @param {Object}   options
 * @param {number}   options.totalSeconds Durasi penuh soal (0 = timer mati, tidak pernah expire).
 * @param {number}   options.startedAt    Timestamp (ms) saat soal mulai ditampilkan.
 * @param {Function} options.onExpire     Dipanggil SEKALI saat waktu habis.
 * @param {*}        [options.resetKey]   Jika berubah, timer di-reset total (soal berganti).
 * @param {boolean}  [options.paused]     Jika true, hitung mundur dihentikan (nilai dipertahankan).
 *
 * Desain anti-lopping:
 *  - Sisa waktu dihitung dari deadline (`startedAt + totalSeconds*1000`) —
 *    re-render apa pun TIDAK mengubah hasil, sehingga tidak ada double-fire.
 *  - `onExpire` di-guard `firedIdRef` (per resetKey): satu soal → maksimal 1× expire.
 *  - Timer mati total (`totalSeconds <= 0`) → tidak pernah memanggil onExpire,
 *    apa pun kondisi render.
 *  - Cukup SATU setTimeout ke deadline, bukan interval per detik.
 */
export default function useCountdown({ totalSeconds, startedAt, onExpire, resetKey, paused = false }) {
  const [secondsLeft, setSecondsLeft] = useState(() =>
    totalSeconds > 0 ? Math.max(0, Math.ceil((startedAt + totalSeconds * 1000 - Date.now()) / 1000)) : 0
  )

  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire
  // id soal (resetKey) yang sudah expire — cegah double-fire untuk soal yang sama
  const firedIdRef = useRef(null)

  // Reset total saat soal berganti / durasi berubah
  useEffect(() => {
    setSecondsLeft(
      totalSeconds > 0 ? Math.max(0, Math.ceil((startedAt + totalSeconds * 1000 - Date.now()) / 1000)) : 0
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, totalSeconds, startedAt])

  // Satu timeout ke deadline; dijeda = timeout dibatalkan (waktu tidak berdetak)
  useEffect(() => {
    // Timer mati / dijeda → tidak pernah expire
    if (paused || totalSeconds <= 0) return undefined

    // Sudah expire untuk soal ini → jangan fire lagi (mis. StrictMode double-effect)
    if (firedIdRef.current === resetKey) return undefined

    const msLeft = startedAt + totalSeconds * 1000 - Date.now()

    // Deadline sudah lewat saat komponen render (mis. restore setelah refresh)
    if (msLeft <= 0) {
      firedIdRef.current = resetKey
      onExpireRef.current()
      setSecondsLeft(0)
      return undefined
    }

    const id = setTimeout(() => {
      firedIdRef.current = resetKey
      setSecondsLeft(0)
      onExpireRef.current()
    }, msLeft)

    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, resetKey, totalSeconds, startedAt])

  return { secondsLeft }
}
