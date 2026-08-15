import { BiCheckSquare, BiRadioCircle, BiFlag } from 'react-icons/bi'

const TYPE_LABEL = {
  multiple_choice: 'Pilihan Ganda',
  multiple_select: 'Pilihan Ganda Kompleks',
  true_false: 'Benar / Salah',
}

/**
 * FASE 2 — Kartu soal. Mendukung 3 tipe:
 * multiple_choice (radio), multiple_select (checkbox), true_false (radio).
 */
export default function QuestionCard({ question, index, total, answer, onAnswer }) {
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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
      {/* Header soal */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/60 px-6 py-4">
        <p className="text-sm font-bold text-slate-900">
          Soal {index + 1}
          <span className="font-medium text-slate-400"> / {total}</span>
        </p>
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-[11px] font-semibold text-blue-700">
          <BiFlag className="text-xs" />
          {TYPE_LABEL[question.type]}
        </span>
      </div>

      {/* Bacaan (untuk soal based on story/passage) */}
      {question.passage && (
        <div className="mx-6 mt-5 rounded-xl border border-blue-100 bg-blue-50/50 px-5 py-4">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-blue-700">Bacaan</p>
          <p className="text-sm leading-relaxed text-slate-700 select-text whitespace-pre-line">
            {question.passage}
          </p>
        </div>
      )}

      {/* Teks soal */}
      <div className="px-6 pt-5">
        <p className="text-base font-semibold text-slate-800 leading-relaxed select-text">
          {question.question}
        </p>
        {isMulti && (
          <p className="mt-2 text-xs font-medium text-blue-600">
            Jawaban bisa lebih dari satu — centang semua jawaban yang benar.
          </p>
        )}
      </div>

      {/* Opsi jawaban */}
      <div className="px-6 py-5 space-y-3">
        {question.options.map((option) => {
          const isChecked = selected.includes(option)
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              aria-pressed={isChecked}
              className={`w-full flex items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                isChecked
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/40'
              }`}
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border-2 ${
                  isMulti ? 'rounded' : 'rounded-full'
                } ${
                  isChecked
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-300 bg-white text-transparent'
                }`}
              >
                {isMulti ? (
                  <BiCheckSquare className="h-3.5 w-3.5" />
                ) : (
                  <BiRadioCircle className="h-3.5 w-3.5" />
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
