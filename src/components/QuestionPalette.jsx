import { QUESTIONS } from '../data/questions.js'

/**
 * Status tiap nomor soal:
 *  - answered   → biru solid
 *  - flagged    → amber (ragu-ragu)
 *  - current    → ring biru
 *  - expired    → abu-abu (waktu habis, terkunci)
 *  - unanswered → putih
 */
function statusOf(index, questions, answers, flagged, currentIndex, expired) {
  if (currentIndex === index) return 'current'
  const q = questions[index]
  if (expired?.has(q.id)) return 'expired'
  const a = answers[q.id]
  const answered = q.type === 'multiple_select' ? Array.isArray(a) && a.length > 0 : a != null
  if (flagged.has(q.id)) return 'flagged'
  if (answered) return 'answered'
  return 'unanswered'
}

const STATUS_CLASS = {
  answered: 'bg-blue-500 text-white border-blue-500',
  flagged: 'bg-amber-400 text-navy-950 border-amber-400',
  current: 'bg-blue-500/20 text-accent-300 border-blue-400 ring-2 ring-blue-400/30',
  expired: 'bg-slate-500 text-slate-200 border-slate-500',
  unanswered: 'bg-navy-800 text-slate-300 border-navy-600 hover:border-blue-400',
}

/**
 * FASE 2 — Navigasi soal & legend.
 * `questions` = urutan soal yang sedang ditampilkan (bisa sudah diacak).
 * `expired`   = Set id soal yang waktu pengerjaannya sudah habis (terkunci).
 */
export default function QuestionPalette({ questions = QUESTIONS, answers, flagged, expired, currentIndex, onJump }) {
  return (
    <div className="bg-navy-900 rounded-2xl border border-navy-800 shadow-card p-5">
      <p className="font-display text-base font-semibold text-slate-100 mb-1">Navigasi</p>
      <p className="text-xs text-slate-500 mb-4">Langsung lompat ke nomor berapa pun.</p>

      <div className="grid grid-cols-6 gap-2">
        {questions.map((q, i) => {
          const status = statusOf(i, questions, answers, flagged, currentIndex, expired)
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => onJump(i)}
              className={`h-9 rounded-lg border text-xs font-bold transition-colors ${STATUS_CLASS[status]}`}
            >
              {i + 1}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-navy-700 pt-4">
        <div className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded bg-blue-500" />
          <span className="text-xs text-slate-400">Terjawab</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded bg-amber-400" />
          <span className="text-xs text-slate-400">Ragu-ragu</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded border border-navy-600 bg-navy-800" />
          <span className="text-xs text-slate-400">Kosong</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded border border-blue-400 ring-2 ring-blue-400/30 bg-blue-500/20" />
          <span className="text-xs text-slate-400">Sedang dibuka</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded bg-slate-500" />
          <span className="text-xs text-slate-400">Waktu habis</span>
        </div>
      </div>
    </div>
  )
}
