import { useState } from 'react'
import { FlagIcon, ClockIcon, TrophyIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { CheckIcon } from '@heroicons/react/24/solid'
import { ANSWER_KEY } from '../../lib/answer-key.js'

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
 * FASE 2 — Kartu soal (alur Quizizz).
 *  - multiple_choice / true_false → klik opsi = jawab langsung.
 *  - multiple_select → pilih beberapa opsi, lalu tekan tombol "Submit".
 * Setelah dijawab (`isAnswered`), soal terkunci & menampilkan feedback instan:
 *  hijau untuk jawaban benar, merah untuk jawaban salah + reveal jawaban benar.
 *
 * Props:
 *  - question   : data soal
 *  - index/total: posisi soal (untuk label "Soal n")
 *  - answer     : jawaban tersimpan (string | string[] | undefined)
 *  - isAnswered : sudah dievaluasi & terkunci?
 *  - isCorrect  : benar/salah (dipakai saat isAnswered)
 *  - locked     : terkunci total (dijawab / waktu habis)
 *  - onAnswer   : (value) => void — dipanggil sekali per soal
 */
export default function QuestionCard({
  question,
  index,
  total,
  answer,
  isAnswered = false,
  isCorrect = false,
  locked = false,
  onAnswer,
}) {
  const isMulti = question.type === 'multiple_select'
  const correctSet = new Set(
    Array.isArray(ANSWER_KEY[question.id]) ? ANSWER_KEY[question.id] : [ANSWER_KEY[question.id]]
  )

  // Seleksi sementara untuk multiple_select (belum di-submit)
  const [pending, setPending] = useState([])
  const selected = Array.isArray(answer) ? answer : answer != null ? [answer] : []
  // Yang tampak tercentang: jawaban tersimpan (sudah dijawab) atau pending (belum)
  const checked = isAnswered ? selected : pending

  const toggle = (option) => {
    if (isMulti) {
      setPending((prev) =>
        prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
      )
    } else {
      onAnswer(option)
    }
  }

  const submitMulti = () => {
    if (pending.length === 0) return
    onAnswer(pending)
  }

  const optionClass = (option) => {
    const isChecked = checked.includes(option)
    const isCorrectOption = correctSet.has(option)

    if (isAnswered) {
      if (isCorrectOption) {
        return 'border-emerald-400 bg-emerald-50 text-emerald-800'
      }
      if (isChecked) {
        return 'border-red-400 bg-red-50 text-red-700'
      }
      return 'border-slate-200 bg-slate-50 text-slate-400'
    }

    if (isChecked) {
      return 'border-brand-400 bg-brand-50 text-brand-700'
    }
    return 'border-slate-200 bg-white text-slate-600 hover:border-brand-400 hover:bg-brand-50/50 hover:-translate-y-0.5 active:translate-y-0'
  }

  const markerClass = (option) => {
    const isChecked = checked.includes(option)
    const isCorrectOption = correctSet.has(option)

    if (isAnswered) {
      if (isCorrectOption) return 'border-emerald-500 bg-emerald-500 text-white'
      if (isChecked) return 'border-red-500 bg-red-500 text-white'
      return 'border-slate-300 bg-white text-transparent'
    }
    if (isChecked) return 'border-brand-500 bg-brand-500 text-white'
    return 'border-slate-300 bg-white text-transparent'
  }

  const answeredAt = question.points // untuk label poin

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
      {/* Header soal */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-6 py-4">
        <p className="font-display text-xl font-semibold text-slate-900">
          Soal {index + 1}
          <span className="font-sans text-sm font-medium text-slate-400"> / {total}</span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 border border-brand-200 px-3 py-1 text-[11px] font-semibold text-brand-700">
            <FlagIcon className="h-3.5 w-3.5" />
            {TYPE_LABEL[question.type]}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-600"
            title="Waktu mengerjakan soal ini"
          >
            <ClockIcon className="h-3.5 w-3.5" />
            {formatDuration(question.timeSeconds)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 border border-brand-200 px-3 py-1 text-[11px] font-semibold text-brand-700">
            <TrophyIcon className="h-3.5 w-3.5" />
            {question.points} poin
          </span>
        </div>
      </div>

      {/* Bacaan (untuk soal based on story/passage) */}
      {question.passage && (
        <div className="mx-6 mt-5 rounded-xl border border-brand-200 bg-brand-50/60 px-5 py-4">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-brand-600">Bacaan</p>
          <p className="text-sm leading-relaxed text-slate-700 select-text whitespace-pre-line">
            {question.passage}
          </p>
        </div>
      )}

      {/* Teks soal */}
      <div className="px-6 pt-5">
        <p className="font-display text-[17px] font-medium text-slate-900 leading-relaxed select-text">
          {question.question}
        </p>
        {isMulti && !isAnswered && (
          <p className="mt-2 text-xs font-medium text-brand-600">
            Jawaban bisa lebih dari satu — centang semua jawaban yang benar, lalu tekan Submit.
          </p>
        )}
      </div>

      {/* Banner feedback instan */}
      {isAnswered && (
        <div
          className={`mx-6 mt-4 flex items-start gap-2 rounded-xl border px-4 py-3 ${
            isCorrect
              ? 'border-emerald-300 bg-emerald-50'
              : 'border-red-300 bg-red-50'
          }`}
        >
          {isCorrect ? (
            <CheckIcon className="text-emerald-500 h-5 w-5 mt-0.5 shrink-0" />
          ) : (
            <ExclamationCircleIcon className="text-red-500 h-5 w-5 mt-0.5 shrink-0" />
          )}
          <div>
            <p className={`text-xs font-bold ${isCorrect ? 'text-emerald-700' : 'text-red-700'}`}>
              {isCorrect ? `Benar! +${answeredAt} poin` : 'Salah!'}
            </p>
            {!isCorrect && (
              <p className="mt-0.5 text-xs text-red-600/90 leading-relaxed">
                Jawaban benar:{' '}
                <span className="font-bold">
                  {Array.isArray(ANSWER_KEY[question.id])
                    ? ANSWER_KEY[question.id].join(', ')
                    : ANSWER_KEY[question.id]}
                </span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Opsi jawaban */}
      <div className="px-6 py-5 space-y-3">
        {question.options.map((option) => {
          const isChecked = checked.includes(option)
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              disabled={isAnswered}
              aria-pressed={isChecked}
              className={`cursor-target w-full flex items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all disabled:cursor-default ${optionClass(option)}`}
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border-2 ${markerClass(option)} ${
                  isMulti ? 'rounded' : 'rounded-full'
                }`}
              >
                <CheckIcon className="h-3.5 w-3.5" />
              </span>
              <span className="leading-relaxed">{option}</span>
            </button>
          )
        })}

        {/* Submit untuk multiple_select */}
        {isMulti && !isAnswered && (
          <button
            type="button"
            onClick={submitMulti}
            disabled={pending.length === 0}
            className="cursor-target mt-1 w-full rounded-xl bg-brand-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Submit jawaban
          </button>
        )}
      </div>
    </div>
  )
}
