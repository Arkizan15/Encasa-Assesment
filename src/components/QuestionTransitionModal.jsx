import { useEffect, useState } from 'react'
import { randomStickerUrl } from '../data/stickers.js'

/**
 * QuestionTransitionModal — layar putih transisi antar soal (murni presentasional).
 *
 * Komponen ini HANYA menampilkan: halaman putih penuh + TEPAT 1 stiker acak.
 * SELURUH timing (berapa lama tampil, kapan auto-advance) dikontrol oleh
 * parent (TestEngine) — komponen ini TIDAK punya timer/callback sendiri,
 * sehingga tidak mungkin muncul berulang atau berjalan sendiri (anti-looping).
 *
 * Stiker dipilih ulang setiap `open` berubah menjadi true (sekali per transisi).
 *
 * Props:
 *  - open        : tampilkan layar putih atau tidak (dikontrol parent)
 *  - label       : teks status untuk screen-reader (mis. "Benar!" / "Waktu habis").
 *                  Secara visual diganti loading circle di bawah stiker.
 */
export default function QuestionTransitionModal({ open, label }) {
  // Stiker acak — dipilih ulang tiap transisi (open false→true)
  const [sticker, setSticker] = useState(() => randomStickerUrl())

  useEffect(() => {
    if (!open) return
    setSticker(randomStickerUrl())
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white px-4">
      {/* 1 stiker — ditampilkan di tengah halaman putih */}
      <div className="animate-sticker-pop flex flex-col items-center">
        <div className="flex h-56 w-56 sm:h-72 sm:w-72 items-center justify-center overflow-hidden rounded-[32px] border-4 border-slate-100 bg-white p-3 shadow-card">
          <img
            src={sticker}
            alt=""
            draggable={false}
            className="h-full w-full select-none object-contain"
          />
        </div>

        {/* Loading circle — menandakan soal berikutnya sedang disiapkan.
         * `label` tetap dipakai sebagai teks screen-reader (mis. "Benar!"). */}
        <div role="status" className="mt-6 flex items-center justify-center">
          <span className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-brand-500" />
          {label && <span className="sr-only">{label}</span>}
        </div>
      </div>
    </div>
  )
}
