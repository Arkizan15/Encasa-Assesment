import {
  UserCircleIcon,
  CheckCircleIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline'
import { PlayIcon } from '@heroicons/react/24/solid'
import { MAX_TAB_SWITCH_WARNING } from '../utils/constants.js'
import { formatTime } from '../utils/formatTime.js'
import { QUESTIONS } from '../data/questions.js'

/**
 * FASE 2 (pintu masuk) — Briefing editorial sebelum tes (ala Dribbble/Behance).
 * Cerita singkat + statistik + aturan main, ditutup CTA amber yang jelas.
 */
export default function LobbyScreen({ user, onStart, onBack }) {
  const totalSeconds = QUESTIONS.reduce((sum, q) => sum + q.timeSeconds, 0)
  const totalPoin = QUESTIONS.reduce((sum, q) => sum + q.points, 0)
  const perSoalSeconds = QUESTIONS[0]?.timeSeconds ?? 120
  const firstName = user.nama.trim().split(/\s+/)[0] ?? user.nama

  return (
    <div className="min-h-screen bg-navy-950/70 flex items-start justify-center px-4 sm:px-6 py-10 lg:py-16">
      <div className="w-full max-w-3xl">
        <div className="animate-rise">
          {/* Header: logo + ubah data */}
          <div className="flex items-center justify-between gap-3">
            <img
              src="/logo-encasa.png"
              alt="Logo Encasa Grouping"
              draggable={false}
              className="h-12 w-auto object-contain rounded-[15px]"
            />
            <div className="flex items-center gap-3 min-w-0">
              <div className="hidden sm:flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-extrabold shrink-0">
                  {user.nama.charAt(0).toUpperCase()}
                </div>
                <p className="text-xs font-bold text-slate-300 truncate max-w-[160px]">{user.nama}</p>
              </div>
              <button
                type="button"
                onClick={onBack}
                className="cursor-target inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-slate-400 transition-colors hover:text-accent"
              >
                <PencilSquareIcon className="h-4 w-4" />
                Ubah data
              </button>
            </div>
          </div>

          {/* Judul editorial */}
          <p className="mt-12 text-[11px] font-bold uppercase tracking-[0.25em] text-accent">
            Briefing sebelum tes
          </p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-semibold text-cream-100 leading-[1.08]">
            Semua siap,{' '}
            <em className="italic text-accent font-medium">{firstName}</em>?
          </h1>
          <p className="mt-4 max-w-xl text-sm sm:text-base leading-relaxed text-slate-400">
             Nggak ada yang perlu ditegangin, baca soalnya,
            pilih jawabannya, selesai. inget yaa, Nilai bisa diperbaiki, Ilmu bisa dicari, tapi Jujur, tidak semua orang memiliki. #Kelazzzzz
          </p>

          {/* Statistik editorial */}
          <div className="mt-10 grid grid-cols-3 gap-3">
            {[
              { num: String(QUESTIONS.length), label: 'soal', sub: 'pilihan ganda & B/S' },
              { num: formatTime(perSoalSeconds), label: 'menit / soal', sub: 'otomatis lanjut' },
              { num: String(totalPoin), label: 'poin maksimal', sub: 'nilai = poin benar' },
            ].map((s, i) => (
              <div
                key={s.label}
                className={`hover-lift rounded-2xl bg-navy-900 border border-navy-800 px-4 py-5 text-center ${i === 1 ? 'animate-rise-1' : i === 2 ? 'animate-rise-2' : ''}`}
              >
                <p className="font-display text-2xl sm:text-3xl text-cream-100">{s.num}</p>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-accent">
                  {s.label}
                </p>
                <p className="mt-1 text-[10px] text-slate-500">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Aturan main */}
          <div className="animate-rise-3 mt-5 rounded-[24px] bg-navy-900 border border-navy-800 p-6 sm:p-7">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Aturan main — singkat, jujur aja
            </p>
            <ul className="mt-4 space-y-3">
              {[
                'Kerjain sendiri. Kalau nekat minta tolong teman, sistem bakal tahu.',
                `Pindah tab / buka aplikasi lain maksimal ${MAX_TAB_SWITCH_WARNING}× — lewat dari itu, tes langsung dikumpulin.`,
                'Copy, paste, dan klik kanan diblokir. Soal-soal ini rahasia.',
                `Setiap soal ada timer ${formatTime(perSoalSeconds)} — habis waktunya, otomatis lanjut.`,
                `Nilai dihitung dari total poin jawaban benar (maks ${totalPoin}).`,
                'Hasil & skor masuk ke admin + tercatat di Google Sheets. Aman, nggak bocor.',
              ].map((rule) => (
                <li key={rule} className="flex items-start gap-2.5 text-xs sm:text-sm leading-relaxed text-slate-300">
                  <CheckCircleIcon className="text-accent mt-0.5 shrink-0 h-4 w-4" />
                  {rule}
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <div className="animate-rise-3 mt-6">
            <button
              type="button"
              onClick={onStart}
              className="cursor-target w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 py-4 text-base font-extrabold text-navy-950 shadow-soft transition-all hover:-translate-y-0.5 hover:bg-amber-300 hover:shadow-card active:translate-y-0"
            >
              <PlayIcon className="h-5 w-5" />
              Gas, mulai!
            </button>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
              <UserCircleIcon className="h-4 w-4" />
              Total waktu {formatTime(totalSeconds)} — perasaan gugup itu normal, kok.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
