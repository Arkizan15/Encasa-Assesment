import { QUESTIONS } from '../data/questions.js'

/**
 * Status tiap nomor soal:
 *  - answered   → biru solid
 *  - flagged    → amber (ragu-ragu)
 *  - current    → ring biru
 *  - unanswered → putih
 */
function statusOf(index, answers, flagged, currentIndex) {
  if (currentIndex === index) return 'current'
  const q = QUESTIONS[index]
  const a = answers[q.id]
  const answered = q.type === 'multiple_select' ? Array.isArray(a) && a.length > 0 : a != null
  if (flagged.has(q.id)) return 'flagged'
  if (answered) return 'answered'
  return 'unanswered'
}

const STATUS_CLASS = {
  answered: 'bg-blue-600 text-white border-blue-600',
  flagged: 'bg-amber-400 text-white border-amber-400',
  current: 'bg-white text-blue-700 border-blue-600 ring-2 ring-blue-200',
  unanswered: 'bg-white text-slate-600 border-slate-300 hover:border-blue-400',
}

/**
 * FASE 2 — Navigasi soal & legend.
 */
export default function QuestionPalette({ answers, flagged, currentIndex, onJump }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5">
      <p className="text-sm font-bold text-slate-900 mb-1">Navigasi Soal</p>
      <p className="text-xs text-slate-400 mb-4">Ketuk nomor untuk melompat ke soal.</p>

      <div className="grid grid-cols-6 gap-2">
        {QUESTIONS.map((q, i) => {
          const status = statusOf(i, answers, flagged, currentIndex)
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => onJump(i)}
              className={`h-9 rounded-lg border text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200 ${STATUS_CLASS[status]}`}
            >
              {i + 1}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-slate-100 pt-4">
        <div className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded bg-blue-600" />
          <span className="text-xs text-slate-500">Terjawab</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded bg-amber-400" />
          <span className="text-xs text-slate-500">Ragu-ragu</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded border border-slate-300 bg-white" />
          <span className="text-xs text-slate-500">Kosong</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded border border-blue-600 ring-2 ring-blue-200" />
          <span className="text-xs text-slate-500">Sedang dibuka</span>
        </div>
      </div>
    </div>
  )
}
