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
} from 'react-icons/bi'
import { scoreTest } from '../utils/scoring.js'
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
 * Skor, ringkasan, auto-simpan ke Google Sheets via /api/submit-score,
 * review jawaban, dan redirect WhatsApp.
 */
export default function ResultScreen({ user, answers, timeUsed, tabSwitchCount, reason }) {
  const { correct, total, percentage, detail } = scoreTest(QUESTIONS, answers)
  const [saveStatus, setSaveStatus] = useState('saving') // saving | saved | not_configured | failed
  const [saveMessage, setSaveMessage] = useState('')
  const [reviewOpen, setReviewOpen] = useState(false)
  const submittedRef = useRef(false)

  const finishedAt = new Date().toLocaleString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  // Auto-simpan hasil ke Google Sheets (sekali saja)
  useEffect(() => {
    if (submittedRef.current) return
    submittedRef.current = true

    submitScore({
      nama: user.nama,
      kelas: `${user.tingkat} ${user.kelas}`,
      skor: correct,
      total,
      persentase: percentage,
      durasi: formatTime(timeUsed),
      pelanggaranTab: tabSwitchCount,
      status: FINISH_REASON[reason] ?? reason,
    }).then((res) => {
      if (res.ok) {
        setSaveStatus('saved')
        setSaveMessage('Hasil tesmu otomatis tersimpan di Google Sheets admin.')
      } else if (res.reason === 'not_configured') {
        setSaveStatus('not_configured')
        setSaveMessage(res.message || 'Belum terhubung ke Google Sheets.')
      } else {
        setSaveStatus('failed')
        setSaveMessage(res.message || 'Gagal menyimpan hasil tes.')
      }
    })
  }, [correct, total, percentage, timeUsed, tabSwitchCount, reason, user.nama, user.tingkat, user.kelas])

  const formatAnswer = (q, answer) => {
    if (answer == null || answer === '') return '—'
    if (Array.isArray(answer)) return answer.join(', ')
    return answer
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
            {/* Skor */}
            <div className="flex items-center justify-center">
              <div className="w-28 h-28 rounded-full bg-blue-600 flex flex-col items-center justify-center shadow-soft">
                <p className="text-3xl font-extrabold text-white tabular-nums">
                  {correct}
                  <span className="text-lg font-bold text-blue-200">/{total}</span>
                </p>
                <p className="text-[11px] font-semibold text-blue-100">JAWABAN BENAR</p>
              </div>
            </div>

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

            {/* Status simpan ke Google Sheets */}
            <div
              className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 ${
                saveStatus === 'saved'
                  ? 'bg-emerald-50 border-emerald-100'
                  : saveStatus === 'saving'
                    ? 'bg-blue-50 border-blue-100'
                    : 'bg-amber-50 border-amber-100'
              }`}
            >
              {saveStatus === 'saved' ? (
                <BiCheckCircle className="text-emerald-600 text-lg mt-0.5 shrink-0" />
              ) : saveStatus === 'saving' ? (
                <BiCloudUpload className="text-blue-600 text-lg mt-0.5 shrink-0 animate-pulse" />
              ) : (
                <BiInfoCircle className="text-amber-600 text-lg mt-0.5 shrink-0" />
              )}
              <div>
                <p
                  className={`text-xs font-bold ${
                    saveStatus === 'saved'
                      ? 'text-emerald-800'
                      : saveStatus === 'saving'
                        ? 'text-blue-800'
                        : 'text-amber-800'
                  }`}
                >
                  {saveStatus === 'saved'
                    ? 'Tersimpan di Google Sheets'
                    : saveStatus === 'saving'
                      ? 'Menyimpan hasil tes…'
                      : saveStatus === 'not_configured'
                        ? 'Belum terhubung ke Google Sheets'
                        : 'Gagal menyimpan hasil tes'}
                </p>
                {saveMessage && (
                  <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600">{saveMessage}</p>
                )}
              </div>
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
                {correct}/{total}
              </span>
            </div>
            <BiChevronDown
              className={`text-slate-400 text-xl transition-transform ${reviewOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {reviewOpen && (
            <div className="border-t border-slate-100 divide-y divide-slate-100">
              {detail.map((q, i) => (
                <div key={q.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-bold text-slate-700 leading-relaxed">
                      <span className="text-blue-700 mr-1.5">{i + 1}.</span>
                      {q.question}
                    </p>
                    {q.isCorrect ? (
                      <BiCheckCircle className="text-emerald-500 text-lg shrink-0" />
                    ) : (
                      <BiXCircle className="text-red-500 text-lg shrink-0" />
                    )}
                  </div>
                  <p className="mt-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                    Tipe: {TYPE_LABEL[q.type]} · Jawabanmu:{' '}
                    <span className={q.isCorrect ? 'text-emerald-600' : 'text-red-600'}>
                      {formatAnswer(q, q.userAnswer)}
                    </span>
                  </p>
                  {!q.isCorrect && (
                    <p className="mt-1 text-[11px] font-semibold text-emerald-700">
                      Jawaban benar: {formatAnswer(q, q.correct)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
