import { useEffect, useRef, useState } from 'react'
import {
  BiUserCircle,
  BiBook,
  BiCheckCircle,
  BiXCircle,
  BiLogoWhatsapp,
  BiTimeFive,
  BiErrorCircle,
  BiInfoCircle,
  BiChevronDown,
  BiCloudUpload,
  BiLoaderCircle,
} from 'react-icons/bi'
import { formatTime } from '../utils/formatTime.js'
import { submitScore } from '../api/submitScore.js'
import { QUESTIONS } from '../data/questions.js'
import { WHATSAPP_GROUP } from '../utils/constants.js'

const FINISH_REASON = {
  manual: 'Dikumpulkan manual',
  timeout: 'Waktu habis (auto-submit)',
  violation: 'Pelanggaran anti-cheat (auto-submit)',
}

const TYPE_LABEL = {
  multiple_choice: 'PG',
  multiple_select: 'PGK',
  true_false: 'B/S',
}

/**
 * FASE 3 & 4 — Halaman Hasil (ala Quizizz).
 *
 * Skor dihitung SERVER-SIDE: halaman ini mengirim jawaban ke /api/submit-score,
 * lalu menampilkan skor + review yang dikembalikan server. Kunci jawaban tidak
 * pernah ada di bundle frontend.
 */
export default function ResultScreen({ user, answers, timeUsed, tabSwitchCount, reason }) {
  const [status, setStatus] = useState('loading') // loading | success | error
  const [result, setResult] = useState(null)
  const [reviewOpen, setReviewOpen] = useState(false)
  const submittedRef = useRef(false)

  const finishedAt = new Date().toLocaleString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const submit = async () => {
    setStatus('loading')
    const res = await submitScore({
      nama: user.nama,
      kelas: `${user.tingkat} ${user.kelas}`,
      answers,
      timeUsed,
      tabSwitchCount,
      status: FINISH_REASON[reason] ?? reason,
    })
    setResult(res)
    setStatus(res.ok ? 'success' : 'error')
  }

  // Auto-submit jawaban ke server (sekali saja)
  useEffect(() => {
    if (submittedRef.current) return
    submittedRef.current = true
    submit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const formatAnswer = (answer) => {
    if (answer == null || answer === '') return '—'
    if (Array.isArray(answer)) return answer.join(', ')
    return answer
  }

  const errorHint = () => {
    switch (result?.reason) {
      case 'network_error':
        return 'Periksa koneksi internet, lalu coba lagi.'
      case 'token_expired':
      case 'invalid_token':
        return 'Sesi tes tidak valid. Muat ulang halaman dan coba lagi.'
      case 'rate_limited':
        return result?.message || 'Terlalu banyak pengumpulan. Coba beberapa saat lagi.'
      case 'not_configured':
        return result?.message || 'Server penilaian belum terhubung. Hubungi admin.'
      default:
        return result?.message || 'Terjadi kesalahan saat mengirim jawaban.'
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        {/* ── Kartu Skor ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
          <div className="bg-blue-50 border-b border-blue-100 px-7 py-6 text-center">
            <img
              src="/logo-encasa.png"
              alt="Logo Encasa"
              draggable={false}
              className="mx-auto h-14 sm:h-16 w-auto object-contain"
            />
            <h1 className="mt-4 text-xl font-bold text-slate-900">Tes Selesai!</h1>
            <p className="mt-1 text-sm text-slate-500">Terima kasih telah mengikuti tes diagnostik.</p>
          </div>

          <div className="px-7 py-6 space-y-5">
            {/* Loading: menghitung skor */}
            {status === 'loading' && (
              <div className="flex flex-col items-center gap-3 py-6">
                <BiLoaderCircle className="text-blue-600 text-4xl animate-spin" />
                <p className="text-sm font-bold text-slate-700">Menghitung skor…</p>
                <p className="text-xs text-slate-400">Jawabanmu sedang dikirim & dinilai server.</p>
              </div>
            )}

            {/* Error: gagal kirim / hitung */}
            {status === 'error' && (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-5 text-center">
                <BiErrorCircle className="mx-auto text-red-500 text-3xl" />
                <p className="mt-2 text-sm font-bold text-red-700">Skor belum bisa ditampilkan</p>
                <p className="mt-1 text-xs text-red-600/80 leading-relaxed">{errorHint()}</p>
                <button
                  type="button"
                  onClick={submit}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700"
                >
                  <BiCloudUpload className="text-base" />
                  Coba Lagi
                </button>
              </div>
            )}

            {/* Success: skor dari server */}
            {status === 'success' && result && (
              <>
                {/* Skor */}
                <div className="flex items-center justify-center">
                  <div className="w-28 h-28 rounded-full bg-blue-600 flex flex-col items-center justify-center shadow-soft">
                    <p className="text-3xl font-extrabold text-white tabular-nums">
                      {result.skor}
                      <span className="text-lg font-bold text-blue-200">/{result.total}</span>
                    </p>
                    <p className="text-[11px] font-semibold text-blue-100">JAWABAN BENAR</p>
                  </div>
                </div>

                {/* Status simpan ke Google Sheets */}
                <div
                  className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 ${
                    result.save?.ok
                      ? 'bg-emerald-50 border-emerald-100'
                      : 'bg-amber-50 border-amber-100'
                  }`}
                >
                  {result.save?.ok ? (
                    <BiCheckCircle className="text-emerald-600 text-lg mt-0.5 shrink-0" />
                  ) : (
                    <BiInfoCircle className="text-amber-600 text-lg mt-0.5 shrink-0" />
                  )}
                  <div>
                    <p
                      className={`text-xs font-bold ${
                        result.save?.ok ? 'text-emerald-800' : 'text-amber-800'
                      }`}
                    >
                      {result.save?.ok
                        ? 'Tersimpan di Google Sheets'
                        : 'Skor terhitung, tapi gagal tersimpan'}
                    </p>
                    {result.save?.message && (
                      <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600">
                        {result.save.message}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Grup WhatsApp (ENCASA GEN 5) */}
            <div className="rounded-2xl border border-green-200 bg-green-50 p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-green-700">Grup WhatsApp</p>
                <img
                  src="/logo-encasa.png"
                  alt="Logo Encasa"
                  draggable={false}
                  className="h-8 w-auto object-contain"
                />
              </div>
              <div>
                <p className="text-lg font-extrabold text-green-900">{WHATSAPP_GROUP.title}</p>
                <p className="mt-0.5 text-sm text-slate-600">Semua peserta tes bergabung di grup ini.</p>
              </div>
              <a
                href={WHATSAPP_GROUP.waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3.5 text-sm font-bold text-white transition-colors hover:bg-green-700"
              >
                <BiLogoWhatsapp className="text-xl" />
                Masuk Grup WhatsApp
              </a>
            </div>

            {/* Ringkasan */}
            <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
              <div className="flex items-center gap-3 px-4 py-3">
                <BiUserCircle className="text-blue-600 text-xl" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Nama</p>
                  <p className="text-sm font-semibold text-slate-800 truncate">{user.nama}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3">
                <BiBook className="text-blue-600 text-xl" />
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Kelas</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {user.tingkat} · {user.kelas}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3">
                <BiTimeFive className="text-blue-600 text-xl" />
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Waktu Selesai</p>
                  <p className="text-sm font-semibold text-slate-800">{finishedAt}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3">
                <BiCheckCircle className="text-blue-600 text-xl" />
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Durasi Pengerjaan</p>
                  <p className="text-sm font-semibold text-slate-800">{formatTime(timeUsed)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3">
                <BiErrorCircle
                  className={tabSwitchCount > 0 ? 'text-red-500 text-xl' : 'text-blue-600 text-xl'}
                />
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Pelanggaran Pindah Tab</p>
                  <p className="text-sm font-semibold text-slate-800">{tabSwitchCount} kali</p>
                </div>
              </div>
            </div>

            {tabSwitchCount > 0 && (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                <BiXCircle className="text-red-500 text-lg mt-0.5 shrink-0" />
                <p className="text-xs text-red-700 leading-relaxed">
                  Kamu tercatat <span className="font-bold">{tabSwitchCount}×</span> berpindah tab selama
                  tes. Pelanggaran ini ikut tercatat di laporan.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Review jawaban (ala Quizizz) ── */}
        {status === 'success' && result && (
          <div className="mt-5 bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
            <button
              type="button"
              onClick={() => setReviewOpen((o) => !o)}
              className="w-full flex items-center justify-between px-6 py-4 text-left"
            >
              <div className="flex items-center gap-2">
                <BiCheckCircle className="text-blue-600 text-lg" />
                <p className="text-sm font-bold text-slate-900">Review Jawaban</p>
                <span className="rounded-full bg-blue-50 border border-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700 tabular-nums">
                  {result.skor}/{result.total}
                </span>
              </div>
              <BiChevronDown
                className={`text-slate-400 text-xl transition-transform ${reviewOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {reviewOpen && (
              <div className="border-t border-slate-100 divide-y divide-slate-100">
                {result.detail.map((d, i) => {
                  const q = QUESTIONS.find((x) => x.id === d.id)
                  if (!q) return null
                  return (
                    <div key={d.id} className="px-6 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-xs font-bold text-slate-700 leading-relaxed">
                          <span className="text-blue-700 mr-1.5">{i + 1}.</span>
                          {q.question}
                        </p>
                        {d.isCorrect ? (
                          <BiCheckCircle className="text-emerald-500 text-lg shrink-0" />
                        ) : (
                          <BiXCircle className="text-red-500 text-lg shrink-0" />
                        )}
                      </div>
                      <p className="mt-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                        Tipe: {TYPE_LABEL[q.type]} · Jawabanmu:{' '}
                        <span className={d.isCorrect ? 'text-emerald-600' : 'text-red-600'}>
                          {formatAnswer(d.userAnswer)}
                        </span>
                      </p>
                      {!d.isCorrect && (
                        <p className="mt-1 text-[11px] font-semibold text-emerald-700">
                          Jawaban benar: {formatAnswer(d.correct)}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
