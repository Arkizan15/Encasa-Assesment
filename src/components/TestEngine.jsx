import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  FlagIcon,
  Squares2X2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationCircleIcon,
  XMarkIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import { ClockIcon, CheckIcon } from '@heroicons/react/24/solid'
import { QUESTIONS } from '../data/questions.js'
import { MAX_TAB_SWITCH_WARNING } from '../utils/constants.js'
import { formatTime } from '../utils/formatTime.js'
import { loadTestState, saveTestState, clearTestState } from '../utils/persistence.js'
import { seededShuffle, randomSeed } from '../utils/shuffle.js'
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
  // Progres tersimpan (localStorage) — dipulihkan kalau tab di-refresh tidak sengaja
  const [saved] = useState(loadTestState)

  const [currentIndex, setCurrentIndex] = useState(() =>
    Math.min(saved?.currentIndex ?? 0, QUESTIONS.length - 1)
  )
  const [answers, setAnswers] = useState(() => saved?.answers ?? {})
  const [flagged, setFlagged] = useState(() => new Set(saved?.flagged ?? []))
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [showPalette, setShowPalette] = useState(false)

  // Waktu mulai soal aktif — di-reset tiap pindah soal; dipersist agar timer
  // per soal tetap akurat kalau halaman di-refresh.
  const [questionStartedAt, setQuestionStartedAt] = useState(
    () => saved?.questionStartedAt ?? Date.now()
  )

  // Soal yang waktu pengerjaannya sudah habis → terkunci, tidak bisa dijawab
  // lagi (dipersist agar tetap terkunci saat refresh).
  const [expiredQuestions, setExpiredQuestions] = useState(
    () => new Set(saved?.expiredQuestions ?? [])
  )

  // Seed pengacakan — tetap sama untuk satu sesi (stabil saat refresh)
  const [seed] = useState(() => saved?.seed ?? randomSeed())

  // Urutan soal diacak per siswa (deterministik dari seed); jawaban tersimpan
  // sebagai teks opsi, jadi pengacakan tidak memengaruhi penilaian.
  const orderedQuestions = useMemo(() => seededShuffle(QUESTIONS, seed), [seed])

  // Waktu mulai tes dipersist agar timer tetap berjalan meski halaman di-refresh/ditutup
  const testStartedAtRef = useRef(saved?.testStartedAt ?? Date.now())

  // Ref agar callback auto-submit selalu membaca state terbaru + cegah double-submit
  const answersRef = useRef(answers)
  answersRef.current = answers
  const currentIndexRef = useRef(currentIndex)
  currentIndexRef.current = currentIndex
  const onFinishRef = useRef(onFinish)
  onFinishRef.current = onFinish
  const tabSwitchCountRef = useRef(0)
  const finishedRef = useRef(false)
  const expiredRef = useRef(expiredQuestions)
  expiredRef.current = expiredQuestions
  const currentQuestionIdRef = useRef(null)

  const finish = useCallback((reason) => {
    if (finishedRef.current) return
    finishedRef.current = true
    clearTestState() // tes selesai — hapus progres tersimpan
    setShowSubmitModal(false)
    onFinishRef.current({
      answers: answersRef.current,
      timeUsed: Math.floor((Date.now() - testStartedAtRef.current) / 1000),
      tabSwitchCount: tabSwitchCountRef.current,
      reason,
    })
  }, [])

  // Pindah ke soal lain — reset waktu mulai soal baru (timer per soal)
  const goTo = useCallback(
    (index) => {
      const next = Math.max(0, Math.min(index, orderedQuestions.length - 1))
      if (next === currentIndexRef.current) return
      setCurrentIndex(next)
      setQuestionStartedAt(Date.now())
    },
    [orderedQuestions.length]
  )

  // Soal aktif + sisa waktunya (timer per soal — dihitung dari waktu mulai
  // soal; aman saat refresh karena questionStartedAt tersimpan).
  const question = orderedQuestions[currentIndex]
  currentQuestionIdRef.current = question.id
  const isExpired = expiredQuestions.has(question.id)
  const initialSeconds = isExpired
    ? 0 // soal kadaluarsa tidak menghidupkan timer lagi
    : Math.max(
        0,
        question.timeSeconds - Math.floor((Date.now() - questionStartedAt) / 1000)
      )

  // Waktu soal habis → soal dikunci (tak bisa dijawab lagi) + auto-lanjut ke
  // soal berikutnya; kalau sudah soal terakhir → tes dikumpulkan otomatis.
  const onQuestionExpire = useCallback(() => {
    if (finishedRef.current) return
    const currentId = currentQuestionIdRef.current
    // Sekadar melihat ulang soal yang sudah kadaluarsa → jangan auto-lanjut lagi
    if (currentId != null && expiredRef.current.has(currentId)) return
    if (currentId != null) {
      setExpiredQuestions((prev) => {
        if (prev.has(currentId)) return prev
        const next = new Set(prev)
        next.add(currentId)
        return next
      })
    }
    if (currentIndexRef.current >= orderedQuestions.length - 1) {
      finish('timeout')
    } else {
      goTo(currentIndexRef.current + 1)
    }
  }, [finish, goTo, orderedQuestions.length])

  const { tabSwitchCount, warningOpen, dismissWarning } = useAntiCheat({
    maxWarnings: MAX_TAB_SWITCH_WARNING,
    initialCount: saved?.tabSwitchCount ?? 0,
    onViolationLimit: (count) => {
      if (finishedRef.current) return
      finishedRef.current = true
      clearTestState()
      onFinishRef.current({
        answers: answersRef.current,
        timeUsed: Math.floor((Date.now() - testStartedAtRef.current) / 1000),
        tabSwitchCount: count,
        reason: 'violation',
      })
    },
  })
  tabSwitchCountRef.current = tabSwitchCount

  const { secondsLeft } = useCountdown({
    initialSeconds,
    resetKey: question.id,
    onExpire: onQuestionExpire,
  })

  // Simpan progres setiap ada perubahan → survive refresh
  useEffect(() => {
    saveTestState({
      currentIndex,
      answers,
      flagged: [...flagged],
      expiredQuestions: [...expiredQuestions],
      tabSwitchCount,
      testStartedAt: testStartedAtRef.current,
      questionStartedAt,
      seed,
    })
  }, [currentIndex, answers, flagged, expiredQuestions, tabSwitchCount, questionStartedAt, seed])

  // Peringatan saat user mencoba menutup / me-refresh halaman di tengah tes
  useEffect(() => {
    const onBeforeUnload = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  // Minta fullscreen saat tes dimulai (butuh user gesture — retry pada klik pertama),
  // dan keluar fullscreen otomatis saat tes selesai (unmount).
  useEffect(() => {
    const el = document.documentElement
    const enterFullscreen = () => {
      if (!document.fullscreenElement && typeof el.requestFullscreen === 'function') {
        el.requestFullscreen().catch(() => {})
      }
    }
    enterFullscreen()
    const onInteraction = () => {
      enterFullscreen()
      window.removeEventListener('click', onInteraction)
    }
    window.addEventListener('click', onInteraction)
    return () => {
      window.removeEventListener('click', onInteraction)
      if (document.fullscreenElement && typeof document.exitFullscreen === 'function') {
        document.exitFullscreen().catch(() => {})
      }
    }
  }, [])

  const answer = answers[question.id]
  const isFlagged = flagged.has(question.id)
  const unansweredCount = orderedQuestions.filter((q) => {
    const a = answers[q.id]
    return q.type === 'multiple_select' ? !Array.isArray(a) || a.length === 0 : a == null
  }).length

  const setAnswer = (value) => {
    if (expiredQuestions.has(question.id)) return // soal kadaluarsa terkunci
    setAnswers((prev) => ({ ...prev, [question.id]: value }))
  }

  const toggleFlag = () => {
    setFlagged((prev) => {
      const next = new Set(prev)
      if (next.has(question.id)) next.delete(question.id)
      else next.add(question.id)
      return next
    })
  }

  const lowTime = secondsLeft <= 30

  return (
    <div className="min-h-screen bg-navy-950/70 flex flex-col select-none">
      {/* ── Header sticky ─────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-navy-900/95 backdrop-blur border-b border-navy-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/logo-encasa.png"
              alt="Logo Encasa"
              draggable={false}
              className="h-8 sm:h-9 w-auto object-contain shrink-0 rounded-[15px]"
            />
            <div className="min-w-0">
              <p className="font-display text-lg font-semibold text-cream-100 leading-tight truncate">
                Tes Diagnostik
              </p>
              <p className="flex items-center gap-1 text-xs text-slate-400 truncate">
                <UserCircleIcon className="h-4 w-4 shrink-0" />
                {user.nama} · {user.tingkat} {user.kelas}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Pelanggaran pindah tab */}
            <div
              className={`hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold border ${
                tabSwitchCount > 0
                  ? 'bg-red-500/10 border-red-500/30 text-red-400'
                  : 'bg-navy-800 border-navy-700 text-slate-400'
              }`}
              title="Jumlah pelanggaran pindah tab"
            >
              <ExclamationCircleIcon className="h-4 w-4" />
              {tabSwitchCount}/{MAX_TAB_SWITCH_WARNING}
            </div>

            {/* Navigasi soal (mobile) */}
            <button
              type="button"
              onClick={() => setShowPalette(true)}
              aria-label="Buka navigasi soal"
              className="lg:hidden inline-flex items-center justify-center rounded-lg border border-navy-600 bg-navy-800 p-2 text-slate-300 transition-colors hover:border-blue-400 hover:text-amber-300"
            >
              <Squares2X2Icon className="h-5 w-5" />
            </button>

            {/* Timer per soal */}
            <div
              title={
                isExpired
                  ? 'Waktu soal ini sudah habis — tidak bisa dijawab lagi'
                  : `Sisa waktu soal ini (${question.timeSeconds / 60} menit)`
              }
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-bold tabular-nums ${
                lowTime || isExpired ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
              }`}
            >
              <ClockIcon className="h-4 w-4" />
              {isExpired ? 'Waktu Habis' : formatTime(secondsLeft)}
            </div>

            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className="cursor-target hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-4 py-2 text-xs font-bold text-navy-950 transition-colors hover:bg-amber-300"
            >
              <CheckIcon className="h-4 w-4" />
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
            <p className="text-xs font-bold text-slate-400">
              Soal <span className="text-amber-400">{currentIndex + 1}</span> dari {QUESTIONS.length}
            </p>
            <p className="text-xs font-bold text-slate-400 tabular-nums">
              {Math.round(((currentIndex + 1) / QUESTIONS.length) * 100)}%
            </p>
          </div>
          <div className="h-1.5 rounded-full bg-navy-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-300"
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
              locked={isExpired}
            />

            {/* Navigasi bawah */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => goTo(currentIndex - 1)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-navy-600 bg-navy-800/80 px-4 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:border-blue-400 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeftIcon className="h-5 w-5" />
                Sebelumnya
              </button>

              <button
                type="button"
                onClick={toggleFlag}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold border transition-colors ${
                  isFlagged
                    ? 'bg-amber-400 border-amber-400 text-navy-950'
                    : 'border-amber-500/40 bg-navy-800/80 text-amber-400 hover:bg-amber-500/10'
                }`}
              >
                <FlagIcon className="h-4 w-4" />
                {isFlagged ? 'Tandai Selesai Ragu' : 'Ragu-Ragu'}
              </button>

              {currentIndex < QUESTIONS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => goTo(currentIndex + 1)}
                  className="cursor-target inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-bold text-navy-950 transition-colors hover:bg-amber-300"
                >
                  Selanjutnya
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(true)}
                  className="cursor-target inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-bold text-navy-950 transition-colors hover:bg-amber-300 sm:hidden"
                >
                  <CheckIcon className="h-5 w-5" />
                  Selesai
                </button>
              )}
            </div>

          </div>

          {/* Sidebar desktop */}
          <aside className="hidden lg:block space-y-4">
            <QuestionPalette
              questions={orderedQuestions}
              answers={answers}
              flagged={flagged}
              expired={expiredQuestions}
              currentIndex={currentIndex}
              onJump={goTo}
            />
            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className="cursor-target w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-sm font-bold text-navy-950 transition-colors hover:bg-amber-300"
            >
              <CheckIcon className="h-4 w-4" />
              Kumpulin sekarang
            </button>
          </aside>
        </div>
      </main>

      {/* ── Modal peringatan pindah tab ───────────────── */}
      {warningOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl bg-navy-900 border border-navy-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between bg-red-500/10 border-b border-red-500/25 px-6 py-4">
              <div className="flex items-center gap-2">
                <ExclamationCircleIcon className="text-red-400 h-5 w-5" />
                <p className="font-display text-base font-semibold text-red-300">Hei, kelihatan nih…</p>
              </div>
              <button type="button" onClick={dismissWarning} className="text-red-400/70 hover:text-red-300">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-slate-300 leading-relaxed">
                Kamu <span className="font-bold text-red-400">pindah tab, buka aplikasi lain,
                atau keluar dari layar tes</span> (termasuk coba screenshot). Gw catet nih yee.
              </p>
              <div className="mt-3 rounded-lg bg-navy-800 border border-navy-700 px-4 py-3 text-sm font-bold text-slate-200">
                Pelanggaran ke-{tabSwitchCount} dari {MAX_TAB_SWITCH_WARNING} — kalau sampai
                batas, tes langsung dikumpulin otomatis.
              </div>
              <button
                type="button"
                onClick={dismissWarning}
                className="cursor-target mt-4 w-full rounded-xl bg-amber-400 px-4 py-3 text-sm font-bold text-navy-950 transition-colors hover:bg-amber-300"
              >
            Oke, lanjut lagi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal konfirmasi kumpulkan ────────────────── */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl bg-navy-900 border border-navy-800 shadow-2xl overflow-hidden">
            <div className="bg-blue-500/10 border-b border-blue-500/25 px-6 py-4">
              <p className="font-display text-base font-semibold text-amber-300">Yakin mau dikumpulin?</p>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-slate-300 leading-relaxed">
                Setelah dikumpulin, jawaban nggak bisa diubah lagi, ya.
              </p>
              <div className="mt-3 rounded-lg bg-navy-800 border border-navy-700 px-4 py-3">
                <p className="text-xs text-slate-400">
                  Soal belum dijawab:{' '}
                  <span className="font-bold text-slate-100">{unansweredCount}</span> dari{' '}
                  {QUESTIONS.length}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Soal ditandai ragu-ragu:{' '}
                  <span className="font-bold text-slate-100">{flagged.size}</span>
                </p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="rounded-xl border border-navy-600 bg-navy-800 px-4 py-3 text-sm font-bold text-slate-300 transition-colors hover:bg-navy-700"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => finish('manual')}
                  className="cursor-target rounded-xl bg-amber-400 px-4 py-3 text-sm font-bold text-navy-950 transition-colors hover:bg-amber-300"
                >
                  Iya, kumpulin!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal navigasi soal (mobile) ────────────────── */}
      {showPalette && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-4 py-6 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-navy-900 border border-navy-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between bg-blue-500/10 border-b border-blue-500/25 px-5 py-4">
              <p className="font-display text-base font-semibold text-amber-300">Lompat ke nomor…</p>
              <button
                type="button"
                onClick={() => setShowPalette(false)}
                aria-label="Tutup navigasi soal"
                className="text-slate-500 transition-colors hover:text-slate-300"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[65vh] overflow-y-auto px-5 py-5">
              <QuestionPalette
                questions={orderedQuestions}
                answers={answers}
                flagged={flagged}
                expired={expiredQuestions}
                currentIndex={currentIndex}
                onJump={(i) => {
                  goTo(i)
                  setShowPalette(false)
                }}
              />
            </div>
            <div className="border-t border-navy-700 px-5 py-4">
              <button
                type="button"
                onClick={() => {
                  setShowPalette(false)
                  setShowSubmitModal(true)
                }}
                className="cursor-target w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-sm font-bold text-navy-950 transition-colors hover:bg-amber-300"
              >
                <CheckIcon className="h-4 w-4" />
                Kumpulin sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
