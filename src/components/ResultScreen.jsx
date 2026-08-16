import { useEffect, useRef, useState } from 'react'
import {
  UserCircleIcon,
  BookOpenIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { CloudArrowUpIcon } from '@heroicons/react/24/solid'
// Logo WhatsApp adalah brand icon — tidak tersedia di Heroicons, tetap pakai react-icons.
import { BiLogoWhatsapp } from 'react-icons/bi'
import { formatTime } from '../utils/formatTime.js'
import { submitScore } from '../api/submitScore.js'
import { QUESTIONS } from '../data/questions.js'
import { WHATSAPP_GROUP } from '../utils/constants.js'
import { MascotFull } from './MascotOrnament.jsx'

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
 * FASE 3 & 4 — Halaman Hasil (tampilan editorial, tema light).
 *
 * Skor dihitung SERVER-SIDE: halaman ini mengirim jawaban ke /api/submit-score,
 * lalu menampilkan skor + review yang dikembalikan server. Kunci jawaban tidak
 * pernah ada di bundle frontend (kecuali fitur feedback instan yang disetujui —
 * skor akhir tetap dihitung ulang server-side).
 */
export default function ResultScreen({ user, answers, timeUsed, tabSwitchCount, reason }) {
  const [status, setStatus] = useState('loading') // loading | success | error
  const [result, setResult] = useState(null)
  const [reviewOpen, setReviewOpen] = useState(false)
  const submittedRef = useRef(false)
  const firstName = user.nama.trim().split(/\s+/)[0] ?? user.nama

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
    <div className="min-h-screen bg-slate-50 flex items-start justify-center px-4 sm:px-6 py-10 lg:py-16">
      <div className="w-full max-w-xl">
        {/* ── Kartu Skor ── */}
        <div className="animate-rise bg-white rounded-[28px] border border-slate-200 shadow-card overflow-hidden">
          {/* Header editorial */}
          <div className="bg-brand-50 border-b border-brand-100 px-7 sm:px-9 py-7">
            <div className="flex items-center justify-between gap-3">
              <img
                src="/logo-encasa.png"
                alt="Logo Encasa"
                draggable={false}
                className="h-12 w-auto object-contain rounded-[15px]"
              />
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-500">
                Langkah 4 dari 4
              </p>
            </div>
            <div className="mt-6 flex items-end justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl sm:text-4xl font-semibold text-slate-900">
                  Tes selesai!
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Makasih udah jujur ngerjainnya, {firstName}. Ini hasilnya.
                </p>
              </div>
              <MascotFull
                variant="happy"
                className="hidden sm:block h-20 lg:h-24 w-auto shrink-0 -mb-3"
              />
            </div>
          </div>

          <div className="px-7 sm:px-9 py-7 space-y-6">
            {/* Loading: menghitung skor */}
            {status === 'loading' && (
              <div className="flex flex-col items-center gap-3 py-8">
                <ArrowPathIcon className="text-brand-500 h-10 w-10 animate-spin" />
                <p className="text-sm font-bold text-slate-700">Sebentar, lagi dihitung…</p>
                <p className="text-xs text-slate-400">Jawabanmu dikirim & dinilai di server.</p>
              </div>
            )}

            {/* Error: gagal kirim / hitung */}
            {status === 'error' && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-5 text-center">
                <ExclamationCircleIcon className="mx-auto text-red-500 h-7 w-7" />
                <p className="mt-2 text-sm font-bold text-red-600">Skor belum bisa ditampilkan</p>
                <p className="mt-1 text-xs text-red-500/90 leading-relaxed">{errorHint()}</p>
                <button
                  type="button"
                  onClick={submit}
                  className="cursor-target mt-4 inline-flex items-center gap-2 rounded-xl bg-red-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-400"
                >
                  <CloudArrowUpIcon className="h-4 w-4" />
                  Coba Lagi
                </button>
              </div>
            )}

            {/* Success: skor dari server */}
            {status === 'success' && result && (
              <>
                {/* Skor (poin) — angka besar editorial */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-32 h-32 rounded-full bg-amber-500 flex flex-col items-center justify-center shadow-soft ring-4 ring-amber-500/20">
                    <p className="font-display text-4xl font-semibold text-white tabular-nums">
                      {result.skor}
                      <span className="text-xl font-bold text-brand-100">/{result.total}</span>
                    </p>
                    <p className="mt-0.5 text-[10px] font-bold text-white tracking-[0.15em]">
                      TOTAL POIN
                    </p>
                  </div>
                  <p className="text-xs font-semibold text-slate-500 tabular-nums">
                    {result.correctCount} benar dari {result.detail.length} soal
                  </p>
                </div>

                {/* Status simpan ke Google Sheets */}
                <div
                  className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 ${
                    result.save?.ok
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-amber-50 border-amber-200'
                  }`}
                >
                  {result.save?.ok ? (
                    <CheckCircleIcon className="text-emerald-500 h-5 w-5 mt-0.5 shrink-0" />
                  ) : (
                    <InformationCircleIcon className="text-brand-500 h-5 w-5 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <p
                      className={`text-xs font-bold ${
                        result.save?.ok ? 'text-emerald-600' : 'text-brand-600'
                      }`}
                    >
                      {result.save?.ok
                        ? 'Tersimpan di Google Sheets'
                        : 'Skor terhitung, tapi gagal tersimpan'}
                    </p>
                    {result.save?.message && (
                      <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
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
                <p className="text-[11px] font-bold uppercase tracking-wide text-green-600">
                  Grup WhatsApp
                </p>
                <img
                  src="/logo-encasa.png"
                  alt="Logo Encasa"
                  draggable={false}
                  className="h-8 w-auto object-contain rounded-[5px]"
                />
              </div>
              <div>
                <p className="text-lg font-extrabold text-green-700">{WHATSAPP_GROUP.title}</p>
                <p className="mt-0.5 text-sm text-slate-500">
                  Gabung, biar nggak ketinggalan info & pengumuman selanjutnya.
                </p>
              </div>
              <a
                href={WHATSAPP_GROUP.waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-target w-full inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-3.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-green-400 active:translate-y-0"
              >
                <BiLogoWhatsapp className="h-5 w-5" />
                Gabung Sekarang
              </a>
            </div>

            {/* Ringkasan */}
            <div className="rounded-xl border border-slate-200 divide-y divide-slate-200">
              <div className="flex items-center gap-3 px-4 py-3">
                <UserCircleIcon className="text-brand-500 h-5 w-5" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                    Nama
                  </p>
                  <p className="text-sm font-semibold text-slate-800 truncate">{user.nama}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3">
                <BookOpenIcon className="text-brand-500 h-5 w-5" />
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                    Kelas
                  </p>
                  <p className="text-sm font-semibold text-slate-800">
                    {user.tingkat} · {user.kelas}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3">
                <ClockIcon className="text-brand-500 h-5 w-5" />
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                    Waktu Selesai
                  </p>
                  <p className="text-sm font-semibold text-slate-800">{finishedAt}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3">
                <CheckCircleIcon className="text-brand-500 h-5 w-5" />
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                    Durasi Pengerjaan
                  </p>
                  <p className="text-sm font-semibold text-slate-800">{formatTime(timeUsed)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3">
                <ExclamationCircleIcon
                  className={tabSwitchCount > 0 ? 'text-red-500 h-5 w-5' : 'text-brand-500 h-5 w-5'}
                />
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                    Pelanggaran Pindah Tab
                  </p>
                  <p className="text-sm font-semibold text-slate-800">{tabSwitchCount} kali</p>
                </div>
              </div>
            </div>

            {tabSwitchCount > 0 && (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                <XCircleIcon className="text-red-500 h-5 w-5 mt-0.5 shrink-0" />
                <p className="text-xs text-red-600 leading-relaxed">
                  Kamu tercatat <span className="font-bold">{tabSwitchCount}×</span> berpindah tab
                  selama tes. Pelanggaran ini ikut tercatat di laporan.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Review jawaban ── */}
        {status === 'success' && result && (
          <div className="animate-rise-1 mt-5 bg-white rounded-[24px] border border-slate-200 shadow-card overflow-hidden">
            <button
              type="button"
              onClick={() => setReviewOpen((o) => !o)}
              className="cursor-target w-full flex items-center justify-between px-6 sm:px-8 py-5 text-left"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircleIcon className="text-brand-500 h-5 w-5" />
                <p className="font-display text-lg font-semibold text-slate-800">Review jawaban</p>
                <span className="rounded-full bg-brand-50 border border-brand-200 px-2 py-0.5 text-[11px] font-bold text-brand-700 tabular-nums">
                  {result.skor}/{result.total}
                </span>
              </div>
              <ChevronDownIcon
                className={`text-slate-400 h-5 w-5 transition-transform ${reviewOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {reviewOpen && (
              <div className="border-t border-slate-200 divide-y divide-slate-200">
                {result.detail.map((d, i) => {
                  const q = QUESTIONS.find((x) => x.id === d.id)
                  if (!q) return null
                  return (
                    <div key={d.id} className="px-6 sm:px-8 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-display text-sm font-medium text-slate-700 leading-relaxed">
                          <span className="text-brand-500 mr-1.5">{i + 1}.</span>
                          {q.question}
                        </p>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[11px] font-bold tabular-nums ${
                              d.isCorrect
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                                : 'bg-slate-100 border-slate-200 text-slate-500'
                            }`}
                          >
                            {d.isCorrect ? `+${d.points} poin` : '0 poin'}
                          </span>
                          {d.isCorrect ? (
                            <CheckCircleIcon className="text-emerald-500 h-5 w-5 shrink-0" />
                          ) : (
                            <XCircleIcon className="text-red-500 h-5 w-5 shrink-0" />
                          )}
                        </div>
                      </div>
                      <p className="mt-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                        Tipe: {TYPE_LABEL[q.type]} · Jawabanmu:{' '}
                        <span className={d.isCorrect ? 'text-emerald-600' : 'text-red-500'}>
                          {formatAnswer(d.userAnswer)}
                        </span>
                      </p>
                      {!d.isCorrect && (
                        <p className="mt-1 text-[11px] font-semibold text-emerald-600">
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
