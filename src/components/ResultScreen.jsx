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
 * FASE 3 & 4 — Halaman Hasil (tampilan editorial).
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
    <div className="min-h-screen bg-navy-950/70 flex items-start justify-center px-4 sm:px-6 py-10 lg:py-16">
      <div className="w-full max-w-xl">
        {/* ── Kartu Skor ── */}
        <div className="animate-rise bg-navy-900 rounded-[28px] border border-navy-800 shadow-card overflow-hidden">
          {/* Header editorial */}
          <div className="bg-navy-850 border-b border-navy-700 px-7 sm:px-9 py-7">
            <div className="flex items-center justify-between gap-3">
              <img
                src="/logo-encasa.png"
                alt="Logo Encasa"
                draggable={false}
                className="h-12 w-auto object-contain rounded-[15px]"
              />
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-400">
                Langkah 4 dari 4
              </p>
            </div>
            <h1 className="mt-6 font-display text-3xl sm:text-4xl font-semibold text-cream-100">
              Tes selesai!
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Makasih udah jujur ngerjainnya, {firstName}. Ini hasilnya.
            </p>
          </div>

          <div className="px-7 sm:px-9 py-7 space-y-6">
            {/* Loading: menghitung skor */}
            {status === 'loading' && (
              <div className="flex flex-col items-center gap-3 py-8">
                <ArrowPathIcon className="text-amber-400 h-10 w-10 animate-spin" />
                <p className="text-sm font-bold text-slate-200">Sebentar, lagi dihitung…</p>
                <p className="text-xs text-slate-500">Jawabanmu dikirim & dinilai di server.</p>
              </div>
            )}

            {/* Error: gagal kirim / hitung */}
            {status === 'error' && (
              <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-5 py-5 text-center">
                <ExclamationCircleIcon className="mx-auto text-red-400 h-7 w-7" />
                <p className="mt-2 text-sm font-bold text-red-300">Skor belum bisa ditampilkan</p>
                <p className="mt-1 text-xs text-red-300/80 leading-relaxed">{errorHint()}</p>
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
                  <div className="w-32 h-32 rounded-full bg-amber-400 flex flex-col items-center justify-center shadow-soft ring-4 ring-amber-400/20">
                    <p className="font-display text-4xl font-semibold text-navy-950 tabular-nums">
                      {result.skor}
                      <span className="text-xl font-bold text-navy-800">/{result.total}</span>
                    </p>
                    <p className="mt-0.5 text-[10px] font-bold text-navy-900 tracking-[0.15em]">
                      TOTAL POIN
                    </p>
                  </div>
                  <p className="text-xs font-semibold text-slate-400 tabular-nums">
                    {result.correctCount} benar dari {result.detail.length} soal
                  </p>
                </div>

                {/* Status simpan ke Google Sheets */}
                <div
                  className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 ${
                    result.save?.ok
                      ? 'bg-emerald-500/10 border-emerald-500/25'
                      : 'bg-amber-500/10 border-amber-500/25'
                  }`}
                >
                  {result.save?.ok ? (
                    <CheckCircleIcon className="text-emerald-400 h-5 w-5 mt-0.5 shrink-0" />
                  ) : (
                    <InformationCircleIcon className="text-amber-400 h-5 w-5 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <p
                      className={`text-xs font-bold ${
                        result.save?.ok ? 'text-emerald-300' : 'text-amber-300'
                      }`}
                    >
                      {result.save?.ok
                        ? 'Tersimpan di Google Sheets'
                        : 'Skor terhitung, tapi gagal tersimpan'}
                    </p>
                    {result.save?.message && (
                      <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">
                        {result.save.message}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Grup WhatsApp (ENCASA GEN 5) */}
            <div className="rounded-2xl border border-green-500/25 bg-green-500/10 p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-green-300">
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
                <p className="text-lg font-extrabold text-green-100">{WHATSAPP_GROUP.title}</p>
                <p className="mt-0.5 text-sm text-slate-400">
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
            <div className="rounded-xl border border-navy-800 divide-y divide-navy-800">
              <div className="flex items-center gap-3 px-4 py-3">
                <UserCircleIcon className="text-amber-400 h-5 w-5" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    Nama
                  </p>
                  <p className="text-sm font-semibold text-slate-100 truncate">{user.nama}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3">
                <BookOpenIcon className="text-amber-400 h-5 w-5" />
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    Kelas
                  </p>
                  <p className="text-sm font-semibold text-slate-100">
                    {user.tingkat} · {user.kelas}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3">
                <ClockIcon className="text-amber-400 h-5 w-5" />
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    Waktu Selesai
                  </p>
                  <p className="text-sm font-semibold text-slate-100">{finishedAt}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3">
                <CheckCircleIcon className="text-amber-400 h-5 w-5" />
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    Durasi Pengerjaan
                  </p>
                  <p className="text-sm font-semibold text-slate-100">{formatTime(timeUsed)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3">
                <ExclamationCircleIcon
                  className={tabSwitchCount > 0 ? 'text-red-400 h-5 w-5' : 'text-amber-400 h-5 w-5'}
                />
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    Pelanggaran Pindah Tab
                  </p>
                  <p className="text-sm font-semibold text-slate-100">{tabSwitchCount} kali</p>
                </div>
              </div>
            </div>

            {tabSwitchCount > 0 && (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-500/10 border border-red-500/25 px-4 py-3">
                <XCircleIcon className="text-red-400 h-5 w-5 mt-0.5 shrink-0" />
                <p className="text-xs text-red-300 leading-relaxed">
                  Kamu tercatat <span className="font-bold">{tabSwitchCount}×</span> berpindah tab
                  selama tes. Pelanggaran ini ikut tercatat di laporan.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Review jawaban ── */}
        {status === 'success' && result && (
          <div className="animate-rise-1 mt-5 bg-navy-900 rounded-[24px] border border-navy-800 shadow-card overflow-hidden">
            <button
              type="button"
              onClick={() => setReviewOpen((o) => !o)}
              className="cursor-target w-full flex items-center justify-between px-6 sm:px-8 py-5 text-left"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircleIcon className="text-amber-400 h-5 w-5" />
                <p className="font-display text-lg font-semibold text-slate-100">Review jawaban</p>
                <span className="rounded-full bg-blue-500/10 border border-blue-500/25 px-2 py-0.5 text-[11px] font-bold text-amber-300 tabular-nums">
                  {result.skor}/{result.total}
                </span>
              </div>
              <ChevronDownIcon
                className={`text-slate-400 h-5 w-5 transition-transform ${reviewOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {reviewOpen && (
              <div className="border-t border-navy-700 divide-y divide-navy-800">
                {result.detail.map((d, i) => {
                  const q = QUESTIONS.find((x) => x.id === d.id)
                  if (!q) return null
                  return (
                    <div key={d.id} className="px-6 sm:px-8 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-display text-sm font-medium text-slate-200 leading-relaxed">
                          <span className="text-amber-400 mr-1.5">{i + 1}.</span>
                          {q.question}
                        </p>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[11px] font-bold tabular-nums ${
                              d.isCorrect
                                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                                : 'bg-navy-800 border-navy-700 text-slate-500'
                            }`}
                          >
                            {d.isCorrect ? `+${d.points} poin` : '0 poin'}
                          </span>
                          {d.isCorrect ? (
                            <CheckCircleIcon className="text-emerald-400 h-5 w-5 shrink-0" />
                          ) : (
                            <XCircleIcon className="text-red-400 h-5 w-5 shrink-0" />
                          )}
                        </div>
                      </div>
                      <p className="mt-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        Tipe: {TYPE_LABEL[q.type]} · Jawabanmu:{' '}
                        <span className={d.isCorrect ? 'text-emerald-400' : 'text-red-400'}>
                          {formatAnswer(d.userAnswer)}
                        </span>
                      </p>
                      {!d.isCorrect && (
                        <p className="mt-1 text-[11px] font-semibold text-emerald-300">
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
