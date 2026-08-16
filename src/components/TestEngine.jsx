import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ExclamationCircleIcon,
  XMarkIcon,
  UserCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import { ClockIcon, CheckIcon } from '@heroicons/react/24/solid'
import { QUESTIONS } from '../data/questions.js'
import { MAX_TAB_SWITCH_WARNING } from '../utils/constants.js'
import { formatTime } from '../utils/formatTime.js'
import { loadTestState, saveTestState, clearTestState } from '../utils/persistence.js'
import { seededShuffle, randomSeed } from '../utils/shuffle.js'
// ⚠️ Pengecualian arsitektur (disetujui): kunci jawaban diimpor ke frontend
// agar jawaban bisa dievaluasi instan (feedback hijau/merah ala Quizizz).
// Skor akhir tetap dihitung ulang server-side di /api/submit-score.
import { ANSWER_KEY } from '../../lib/answer-key.js'
import useAntiCheat from '../hooks/useAntiCheat.js'
import useCountdown from '../hooks/useCountdown.js'
import QuestionCard from './QuestionCard.jsx'
import QuestionTransitionModal from './QuestionTransitionModal.jsx'
import { MascotHead } from './MascotOrnament.jsx'

/** Durasi fase transisi antar soal (ms). */
const FEEDBACK_MS = 1000 // feedback benar/salah terlihat dulu
const COOLING_MS = 2000 // halaman putih + 1 stiker

/** Evaluasi satu jawaban terhadap kunci (client-side, untuk feedback instan). */
function evaluateAnswer(id, value) {
  const correct = ANSWER_KEY[id]
  if (Array.isArray(correct)) {
    const correctSet = new Set(correct)
    const userSet = new Set(Array.isArray(value) ? value : [])
    if (userSet.size !== correctSet.size) return false
    for (const ans of userSet) if (!correctSet.has(ans)) return false
    return true
  }
  return value === correct
}

/**
 * FASE 2 — Mesin Tes Diagnostik & Anti-Cheat Engine.
 *
 * ALUR LINEAR (Mandatory Completion) — tanpa kebebasan navigasi:
 *   Soal 1 → wajib dijawab → feedback benar/salah (1 dtk) → halaman PUTIH
 *   dengan TEPAT 1 stiker (3 dtk) → auto-advance → … → Soal N dijawab →
 *   tombol "Kumpulkan Jawaban" muncul → submit.
 *
 * SELURUH timing transisi dikontrol di sini (parent) dalam SATU timer chain
 * (`beginTransition`). Modal stiker hanya menampilkan gambar — tidak punya
 * timer/callback sendiri → stiker TIDAK MUNGKIN muncul berulang.
 *
 * Anti-cheat tetap berjalan global di background meski sedang transisi.
 */
export default function TestEngine({ user, onFinish }) {
  // Progres tersimpan (localStorage) — dipulihkan kalau tab di-refresh tidak sengaja
  const [saved] = useState(loadTestState)

  const [currentIndex, setCurrentIndex] = useState(() =>
    Math.min(saved?.currentIndex ?? 0, QUESTIONS.length - 1)
  )
  const [answers, setAnswers] = useState(() => saved?.answers ?? {})
  // id soal yang sudah dievaluasi & terkunci (feedback instan)
  const [answeredIds, setAnsweredIds] = useState(() => new Set(saved?.answeredIds ?? []))
  // id soal → boolean benar/salah
  const [correctMap, setCorrectMap] = useState(() => saved?.correctMap ?? {})
  
  // Halaman putih + stiker transisi (dikontrol penuh oleh beginTransition)
  const [isCoolingDown, setIsCoolingDown] = useState(false)

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

  // Ref agar callback selalu membaca state terbaru + cegah double-submit
  const answersRef = useRef(answers)
  answersRef.current = answers
  const answeredIdsRef = useRef(answeredIds)
  answeredIdsRef.current = answeredIds
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
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current)
    transitionTimerRef.current = null
    setIsCoolingDown(false)
    onFinishRef.current({
      answers: answersRef.current,
      timeUsed: Math.floor((Date.now() - testStartedAtRef.current) / 1000),
      tabSwitchCount: tabSwitchCountRef.current,
      reason,
    })
  }, [])

  // Lanjut ke soal berikutnya (satu-satunya arah navigasi — maju saja)
  const goNext = useCallback(() => {
    const next = currentIndexRef.current + 1
    if (next >= orderedQuestions.length) return
    setCurrentIndex(next)
    setQuestionStartedAt(Date.now())
  }, [orderedQuestions.length])

  /**
   * SATU-SATUNYA sumber timing transisi.
   *  - feedback benar/salah tampil dulu (FEEDBACK_MS)
   *  - lalu halaman putih + 1 stiker (COOLING_MS)
   *  - lalu auto-advance (atau buka modal kumpul di soal terakhir)
   * Timer chain disimpan di `transitionTimerRef` — dipanggil ulang akan
   * membatalkan yang lama, jadi transisi maksimal terjadi 1× per soal.
   */
  const transitionTimerRef = useRef(null)
  const beginTransition = useCallback(() => {
    if (finishedRef.current) return
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current)
    transitionTimerRef.current = setTimeout(() => {
      setIsCoolingDown(true)
      transitionTimerRef.current = setTimeout(() => {
        transitionTimerRef.current = null
        setIsCoolingDown(false)
        if (finishedRef.current) return
        if (currentIndexRef.current >= orderedQuestions.length - 1) {
          finish('completed')
          return
        } else {
          goNext()
        }
      }, COOLING_MS)
    }, FEEDBACK_MS)
  }, [goNext, orderedQuestions.length, finish])

  // Soal aktif + statusnya
  const question = orderedQuestions[currentIndex]
  currentQuestionIdRef.current = question.id
  const isAnswered = answeredIds.has(question.id)
  const isCorrect = correctMap[question.id]
  const isExpired = expiredQuestions.has(question.id)
  const isLocked = isAnswered || isExpired
  const isLastQuestion = currentIndex === orderedQuestions.length - 1

  // Timer per soal — dihentikan begitu soal dijawab / sedang transisi.
  // useCountdown berbasis deadline (startedAt + totalSeconds) sehingga
  // re-render apa pun tidak memicu expire ganda.
  const totalSeconds = isLocked ? 0 : question.timeSeconds // 0 = timer mati untuk soal terkunci

  // Waktu soal habis → soal dikunci (tak bisa dijawab lagi) + evaluasi salah +
  // transisi ke soal berikutnya.
  const onQuestionExpire = useCallback(() => {
    if (finishedRef.current) return
    const currentId = currentQuestionIdRef.current
    // Sudah dijawab / sudah kadaluarsa → jangan diproses lagi
    if (currentId != null && (expiredRef.current.has(currentId) || answeredIdsRef.current.has(currentId))) return
    if (currentId != null) {
      setExpiredQuestions((prev) => {
        if (prev.has(currentId)) return prev
        const next = new Set(prev)
        next.add(currentId)
        return next
      })
      // Tidak dijawab → dievaluasi sebagai salah
      setAnsweredIds((prev) => {
        if (prev.has(currentId)) return prev
        const next = new Set(prev)
        next.add(currentId)
        return next
      })
      setCorrectMap((prev) => ({ ...prev, [currentId]: false }))
    }
    // Transisi (feedback "Waktu Habis" singkat → putih + stiker → advance)
    beginTransition()
  }, [beginTransition])

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

  // Timer di-pause saat soal sudah dijawab / sedang transisi
  const { secondsLeft } = useCountdown({
    totalSeconds,
    startedAt: questionStartedAt,
    resetKey: question.id,
    paused: isAnswered || isCoolingDown,
    onExpire: onQuestionExpire,
  })

  // Simpan progres setiap ada perubahan → survive refresh
  useEffect(() => {
    saveTestState({
      currentIndex,
      answers,
      answeredIds: [...answeredIds],
      correctMap,
      flagged: [],
      expiredQuestions: [...expiredQuestions],
      tabSwitchCount,
      testStartedAt: testStartedAtRef.current,
      questionStartedAt,
      seed,
    })
  }, [currentIndex, answers, answeredIds, correctMap, expiredQuestions, tabSwitchCount, questionStartedAt, seed])

  // Peringatan saat user mencoba menutup / me-refresh halaman di tengah tes
  useEffect(() => {
    const onBeforeUnload = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  // Bersihkan timer transisi saat komponen unmount (tes selesai / pindah layar)
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current)
      transitionTimerRef.current = null
    }
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

  /**
   * Jawaban ter-submit (dari QuestionCard):
   *  - single choice → langsung saat opsi diklik
   *  - multiple_select → saat tombol "Submit" ditekan
   * Evaluasi instan + kunci soal + mulai transisi (1× saja).
   */
  const handleAnswer = useCallback(
    (value) => {
      if (finishedRef.current) return
      const currentId = currentQuestionIdRef.current
      if (currentId == null) return
      if (answeredIdsRef.current.has(currentId) || expiredRef.current.has(currentId)) return

      const correct = evaluateAnswer(currentId, value)
      setAnswers((prev) => ({ ...prev, [currentId]: value }))
      setAnsweredIds((prev) => new Set(prev).add(currentId))
      setCorrectMap((prev) => ({ ...prev, [currentId]: correct }))
      beginTransition()
    },
    [beginTransition]
  )

  // Timer pill di header: tampilkan status alih-alih angka kalau soal terkunci
  const timerPill = isExpired
    ? { label: 'Waktu Habis', cls: 'bg-slate-400 text-white' }
    : isAnswered
      ? { label: isCorrect ? 'Benar!' : 'Salah', cls: isCorrect ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white' }
      : { label: formatTime(secondsLeft), cls: secondsLeft <= 30 ? 'bg-red-500 text-white' : 'bg-brand-500 text-white' }

  const unansweredCount = orderedQuestions.filter((q) => !answeredIds.has(q.id)).length

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col select-none">
      {/* ── Header sticky ─────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <MascotHead variant={isCorrect ? 'happy' : 'standing'} size="md" />
            <div className="min-w-0">
              <p className="font-display text-lg font-semibold text-slate-900 leading-tight truncate">
                Tes Diagnostik
              </p>
              <p className="flex items-center gap-1 text-xs text-slate-500 truncate">
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
                  ? 'bg-red-50 border-red-200 text-red-600'
                  : 'bg-slate-100 border-slate-200 text-slate-500'
              }`}
              title="Jumlah pelanggaran pindah tab"
            >
              <ExclamationCircleIcon className="h-4 w-4" />
              {tabSwitchCount}/{MAX_TAB_SWITCH_WARNING}
            </div>

            {/* Timer per soal */}
            <div
              title={
                isAnswered
                  ? 'Jawaban sudah dievaluasi — soal ini terkunci'
                  : isExpired
                    ? 'Waktu soal ini sudah habis — tidak bisa dijawab lagi'
                    : `Sisa waktu soal ini (${question.timeSeconds / 60} menit)`
              }
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-bold tabular-nums ${timerPill.cls}`}
            >
              {isAnswered ? <CheckCircleIcon className="h-4 w-4" /> : <ClockIcon className="h-4 w-4" />}
              {timerPill.label}
            </div>
          </div>
        </div>
      </header>

      {/* ── Body ──────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Segmented progress bar — indikator visual saja, tidak bisa diklik */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-bold text-slate-500">
              Soal <span className="text-brand-600">{currentIndex + 1}</span> dari {QUESTIONS.length}
            </p>
            <p className="text-xs font-bold text-slate-500 tabular-nums">
              {Math.round(((currentIndex + 1) / QUESTIONS.length) * 100)}%
            </p>
          </div>
          <div className="flex gap-1.5">
            {orderedQuestions.map((q, i) => (
              <div
                key={q.id}
                className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                  i <= currentIndex ? 'bg-brand-500' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        <QuestionCard
          key={question.id}
          question={question}
          index={currentIndex}
          total={QUESTIONS.length}
          answer={answers[question.id]}
          isAnswered={isAnswered}
          isCorrect={isCorrect}
          locked={isLocked}
          onAnswer={handleAnswer}
        />

        {/* Aksi bawah — hanya muncul di soal terakhir: Kumpulkan Jawaban */}
        {isLastQuestion && (
          <div className="mt-5">
            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              disabled={!isLocked || isCoolingDown}
              className="cursor-target w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-500 px-5 py-4 text-base font-extrabold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:bg-brand-400 hover:shadow-card active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckIcon className="h-5 w-5" />
              Kumpulkan Jawaban
            </button>
            <p className="mt-2 text-center text-xs text-slate-400">
              {isLocked
                ? 'Semua soal sudah dikerjakan — jawaban final bisa dikumpulkan sekarang.'
                : 'Jawab soal ini dulu untuk bisa mengumpulkan.'}
            </p>
          </div>
        )}
      </main>

      {/* ── Stiker transisi — murni presentasional, timing dikontrol parent ── */}
      <QuestionTransitionModal
        open={isCoolingDown}
        label={isAnswered ? (isCorrect ? 'Benar!' : 'Salah!') : 'Waktu habis'}
      />

      {/* ── Modal peringatan pindah tab ───────────────── */}
      {warningOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between bg-red-50 border-b border-red-200 px-6 py-4">
              <div className="flex items-center gap-2">
                <ExclamationCircleIcon className="text-red-500 h-5 w-5" />
                <p className="font-display text-base font-semibold text-red-600">Hei, kelihatan nih…</p>
              </div>
              <button type="button" onClick={dismissWarning} className="text-red-400 hover:text-red-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-slate-600 leading-relaxed">
                Kamu <span className="font-bold text-red-500">pindah tab, buka aplikasi lain,
                atau keluar dari layar tes</span> (termasuk coba screenshot). Gw catet nih yee.
              </p>
              <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm font-bold text-red-600">
                Pelanggaran ke-{tabSwitchCount} dari {MAX_TAB_SWITCH_WARNING} — kalau sampai
                batas, tes langsung dikumpulin otomatis.
              </div>
              <button
                type="button"
                onClick={dismissWarning}
                className="cursor-target mt-4 w-full rounded-xl bg-brand-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-400"
              >
                Oke, lanjut lagi
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
