import { FlagIcon, ClockIcon, TrophyIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { CheckIcon } from '@heroicons/react/24/solid'

const TYPE_LABEL = {
  multiple_choice: 'Pilihan Ganda',
  multiple_select: 'Pilihan Ganda Kompleks',
  true_false: 'Benar / Salah',
}

/** Format durasi soal, mis. 120 → "2 menit". */
function formatDuration(totalSeconds) {
  if (totalSeconds % 60 === 0) return `${totalSeconds / 60} menit`
  return `${totalSeconds} detik`
}

/**
 * FASE 2 — Kartu soal. Mendukung 3 tipe:
 * multiple_choice (radio), multiple_select (checkbox), true_false (radio).
 * `locked=true` → soal terkunci (waktu habis), jawaban tidak bisa diubah lagi.
 */
export default function QuestionCard({ question, index, total, answer, onAnswer, locked = false }) {
  const isMulti = question.type === 'multiple_select'
  const selected = Array.isArray(answer) ? answer : answer != null ? [answer] : []

  const toggle = (option) => {
    if (isMulti) {
      const next = selected.includes(option)
        ? selected.filter((o) => o !== option)
        : [...selected, option]
      onAnswer(next)
    } else {
      onAnswer(option)
    }
  }

  return (
    <div className="bg-navy-900 rounded-2xl border border-navy-800 shadow-card overflow-hidden">
      {/* Header soal */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-navy-700 bg-navy-850/80 px-6 py-4">
        <p className="font-display text-xl font-semibold text-cream-100">
          Soal {index + 1}
          <span className="font-sans text-sm font-medium text-slate-500"> / {total}</span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/25 px-3 py-1 text-[11px] font-semibold text-amber-300">
            <FlagIcon className="h-3.5 w-3.5" />
            {TYPE_LABEL[question.type]}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full bg-navy-800 border border-navy-700 px-3 py-1 text-[11px] font-semibold text-slate-400"
            title="Waktu mengerjakan soal ini"
          >
            <ClockIcon className="h-3.5 w-3.5" />
            {formatDuration(question.timeSeconds)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/25 px-3 py-1 text-[11px] font-semibold text-amber-300">
            <TrophyIcon className="h-3.5 w-3.5" />
            {question.points} poin
          </span>
        </div>
      </div>

      {/* Bacaan (untuk soal based on story/passage) */}
      {question.passage && (
        <div className="mx-6 mt-5 rounded-xl border border-blue-500/25 bg-blue-500/10 px-5 py-4">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-amber-300">Bacaan</p>
          <p className="text-sm leading-relaxed text-slate-300 select-text whitespace-pre-line">
            {question.passage}
          </p>
        </div>
      )}

      {/* Teks soal */}
      <div className="px-6 pt-5">
        <p className="font-display text-[17px] font-medium text-slate-100 leading-relaxed select-text">
          {question.question}
        </p>
        {isMulti && (
          <p className="mt-2 text-xs font-medium text-amber-400">
            Jawaban bisa lebih dari satu — centang semua jawaban yang benar.
          </p>
        )}
      </div>

      {/* Soal kadaluarsa — jawaban terkunci */}
      {locked && (
        <div className="mx-6 mt-4 flex items-start gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3">
          <ExclamationCircleIcon className="text-red-400 h-5 w-5 mt-0.5 shrink-0" />
          <p className="text-xs font-semibold text-red-300 leading-relaxed">
            Waktu soal ini sudah habis — jawaban terkunci dan tidak bisa diubah lagi.
          </p>
        </div>
      )}

      {/* Opsi jawaban */}
      <div className="px-6 py-5 space-y-3">
        {question.options.map((option) => {
          const isChecked = selected.includes(option)
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              disabled={locked}
              aria-pressed={isChecked}
              className={`cursor-target w-full flex items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all ${
                locked ? 'cursor-not-allowed opacity-70' : ''
              } ${
                isChecked
                  ? 'border-blue-400 bg-blue-500/15 text-amber-100'
                  : locked
                    ? 'border-navy-700 bg-navy-900/60 text-slate-500'
                    : 'border-navy-700 bg-navy-950/40 text-slate-300 hover:border-blue-400 hover:bg-blue-500/10 hover:-translate-y-0.5 active:translate-y-0'
              }`}
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border-2 ${
                  isMulti ? 'rounded' : 'rounded-full'
                } ${
                  isChecked
                    ? 'border-blue-400 bg-blue-400 text-navy-950'
                    : 'border-navy-600 bg-navy-900 text-transparent'
                }`}
              >
                {isMulti ? (
                  <CheckIcon className="h-3.5 w-3.5" />
                ) : (
                  <CheckIcon className="h-3.5 w-3.5" />
                )}
              </span>
              <span className="leading-relaxed">{option}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
