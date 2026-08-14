import { useCallback, useEffect, useRef, useState } from 'react'
import {
  BiTimeFive,
  BiFlag,
  BiGridAlt,
  BiChevronLeft,
  BiChevronRight,
  BiCheckDouble,
  BiErrorCircle,
  BiX,
  BiUserCircle,
} from 'react-icons/bi'
import { QUESTIONS } from '../data/questions.js'
import { TEST_DURATION_SECONDS, MAX_TAB_SWITCH_WARNING } from '../utils/constants.js'
import { formatTime } from '../utils/formatTime.js'
import useAntiCheat from '../hooks/useAntiCheat.js'
import useCountdown from '../hooks/useCountdown.js'
import QuestionCard from './QuestionCard.jsx'
import QuestionPalette from './QuestionPalette.jsx'

/**
 * FASE 2 — Mesin Tes Diagnostik & Anti-Cheat Engine.
 * Timer, navigasi (sebelumnya/selanjutnya/ragu-ragu/selesai), deteksi pindah tab,
 * blokir copy-paste-klik kanan, dan auto-submit saat waktu habis / pelanggaran maksimal.
 */
export default function TestEngine({ user, onFinish }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [flagged, setFlagged] = useState(() => new Set())
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [showPalette, setShowPalette] = useState(false)

  // Ref agar callback auto-submit selalu membaca state terbaru + cegah double-submit
  const answersRef = useRef(answers)
  answersRef.current = answers
  const secondsLeftRef = useRef(TEST_DURATION_SECONDS)
  const onFinishRef = useRef(onFinish)
  onFinishRef.current = onFinish
  const tabSwitchCountRef = useRef(0)
  const finishedRef = useRef(false)

  const finish = useCallback((reason) => {
    if (finishedRef.current) return
    finishedRef.current = true
    setShowSubmitModal(false)
    onFinishRef.current({
      answers: answersRef.current,
      timeUsed: TEST_DURATION_SECONDS - secondsLeftRef.current,
      tabSwitchCount: tabSwitchCountRef.current,
      reason,
    })
  }, [])

  const { tabSwitchCount, warningOpen, dismissWarning } = useAntiCheat({
    maxWarnings: MAX_TAB_SWITCH_WARNING,
    onViolationLimit: (count) => {
      if (finishedRef.current) return
      finishedRef.current = true
      onFinishRef.current({
        answers: answersRef.current,
        timeUsed: TEST_DURATION_SECONDS - secondsLeftRef.current,
        tabSwitchCount: count,
        reason: 'violation',
      })
    },
  })
  tabSwitchCountRef.current = tabSwitchCount

  const { secondsLeft } = useCountdown({
    initialSeconds: TEST_DURATION_SECONDS,
    onExpire: () => finish('timeout'),
  })
  secondsLeftRef.current = secondsLeft

  // Peringatan saat user mencoba menutup / me-refresh halaman di tengah tes
  useEffect(() => {
    const onBeforeUnload = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  const question = QUESTIONS[currentIndex]
  const answer = answers[question.id]
  const isFlagged = flagged.has(question.id)
  const unansweredCount = QUESTIONS.filter((q) => {
    const a = answers[q.id]
    return q.type === 'multiple_select' ? !Array.isArray(a) || a.length === 0 : a == null
  }).length

  const setAnswer = (value) => setAnswers((prev) => ({ ...prev, [question.id]: value }))

  const toggleFlag = () => {
    setFlagged((prev) => {
      const next = new Set(prev)
      if (next.has(question.id)) next.delete(question.id)
      else next.add(question.id)
      return next
    })
  }

  const lowTime = secondsLeft <= 5 * 60

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col select-none">
      {/* ── Header sticky ─────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/logo-encasa.png"
              alt="Logo Encasa"
              draggable={false}
              className="h-8 sm:h-9 w-auto object-contain shrink-0"
            />
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-blue-700 leading-tight truncate">
                Tes Diagnostik
              </p>
              <p className="flex items-center gap-1 text-xs text-slate-500 truncate">
                <BiUserCircle className="shrink-0" />
                {user.nama} · {user.tingkat} {user.kelas}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Pelanggaran pindah tab */}
            <div
              className={`hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold border ${
                tabSwitchCount > 0
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
              title="Jumlah pelanggaran pindah tab"
            >
              <BiErrorCircle className="text-sm" />
              {tabSwitchCount}/{MAX_TAB_SWITCH_WARNING}
            </div>

            {/* Navigasi soal (mobile) */}
            <button
              type="button"
              onClick={() => setShowPalette(true)}
              aria-label="Buka navigasi soal"
              className="lg:hidden inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white p-2 text-slate-600 transition-colors hover:border-blue-400 hover:text-blue-700"
            >
              <BiGridAlt className="text-xl" />
            </button>

            {/* Timer */}
            <div
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-bold tabular-nums ${
                lowTime ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
              }`}
            >
              <BiTimeFive className="text-base" />
              {formatTime(secondsLeft)}
            </div>

            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-slate-700"
            >
              <BiCheckDouble className="text-sm" />
              Selesai
            </button>
          </div>
        </div>
      </header>

      {/* ── Body ──────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Progress bar ala Quizizz */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-bold text-slate-600">
              Soal <span className="text-blue-700">{currentIndex + 1}</span> dari {QUESTIONS.length}
            </p>
            <p className="text-xs font-bold text-slate-500 tabular-nums">
              {Math.round(((currentIndex + 1) / QUESTIONS.length) * 100)}%
            </p>
          </div>
          <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / QUESTIONS.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          {/* Kolom soal */}
          <div className="space-y-4">
            <QuestionCard
              question={question}
              index={currentIndex}
              total={QUESTIONS.length}
              answer={answer}
              onAnswer={setAnswer}
            />

            {/* Navigasi bawah */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((i) => i - 1)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-400 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <BiChevronLeft className="text-lg" />
                Sebelumnya
              </button>

              <button
                type="button"
                onClick={toggleFlag}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold border transition-colors ${
                  isFlagged
                    ? 'bg-amber-400 border-amber-400 text-white'
                    : 'border-amber-300 bg-white text-amber-600 hover:bg-amber-50'
                }`}
              >
                <BiFlag className="text-base" />
                {isFlagged ? 'Tandai Selesai Ragu' : 'Ragu-Ragu'}
              </button>

              {currentIndex < QUESTIONS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIndex((i) => i + 1)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700"
                >
                  Selanjutnya
                  <BiChevronRight className="text-lg" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700 sm:hidden"
                >
                  <BiCheckDouble className="text-lg" />
                  Selesai
                </button>
              )}
            </div>

          </div>

          {/* Sidebar desktop */}
          <aside className="hidden lg:block space-y-4">
            <QuestionPalette
              answers={answers}
              flagged={flagged}
              currentIndex={currentIndex}
              onJump={setCurrentIndex}
            />
            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700"
            >
              <BiCheckDouble className="text-base" />
              Kumpulkan Jawaban
            </button>
          </aside>
        </div>
      </main>

      {/* ── Modal peringatan pindah tab ───────────────── */}
      {warningOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between bg-red-50 border-b border-red-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <BiErrorCircle className="text-red-600 text-xl" />
                <p className="text-sm font-bold text-red-700">Peringatan Anti-Cheat</p>
              </div>
              <button type="button" onClick={dismissWarning} className="text-red-400 hover:text-red-600">
                <BiX className="text-xl" />
              </button>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-slate-700 leading-relaxed">
                Kamu terdeteksi <span className="font-bold text-red-600">berpindah tab / membuka
                aplikasi lain</span> selama tes berlangsung.
              </p>
              <div className="mt-3 rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-sm font-bold text-slate-800">
                Pelanggaran: {tabSwitchCount} dari {MAX_TAB_SWITCH_WARNING} — tes akan
                dikumpulkan otomatis jika mencapai batas.
              </div>
              <button
                type="button"
                onClick={dismissWarning}
                className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700"
              >
                OK, Saya Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal konfirmasi kumpulkan ────────────────── */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="bg-blue-50 border-b border-blue-100 px-6 py-4">
              <p className="text-sm font-bold text-blue-800">Kumpulkan Jawaban?</p>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-slate-700 leading-relaxed">
                Kamu yakin ingin mengumpulkan tes sekarang?
              </p>
              <div className="mt-3 rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
                <p className="text-xs text-slate-500">
                  Soal belum dijawab:{' '}
                  <span className="font-bold text-slate-800">{unansweredCount}</span> dari{' '}
                  {QUESTIONS.length}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Soal ditandai ragu-ragu:{' '}
                  <span className="font-bold text-slate-800">{flagged.size}</span>
                </p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => finish('manual')}
                  className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700"
                >
                  Kumpulkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal navigasi soal (mobile) ────────────────── */}
      {showPalette && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 px-4 py-6 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between bg-blue-50 border-b border-blue-100 px-5 py-4">
              <p className="text-sm font-bold text-blue-800">Navigasi Soal</p>
              <button
                type="button"
                onClick={() => setShowPalette(false)}
                aria-label="Tutup navigasi soal"
                className="text-slate-400 transition-colors hover:text-slate-600"
              >
                <BiX className="text-xl" />
              </button>
            </div>
            <div className="max-h-[65vh] overflow-y-auto px-5 py-5">
              <QuestionPalette
                answers={answers}
                flagged={flagged}
                currentIndex={currentIndex}
                onJump={(i) => {
                  setCurrentIndex(i)
                  setShowPalette(false)
                }}
              />
            </div>
            <div className="border-t border-slate-100 px-5 py-4">
              <button
                type="button"
                onClick={() => {
                  setShowPalette(false)
                  setShowSubmitModal(true)
                }}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700"
              >
                <BiCheckDouble className="text-base" />
                Kumpulkan Jawaban
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
