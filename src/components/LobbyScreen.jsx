import {
  BiUserCircle,
  BiBook,
  BiTimeFive,
  BiCheckCircle,
  BiErrorCircle,
  BiPlay,
  BiEdit,
} from 'react-icons/bi'
import { TEST_DURATION_SECONDS, MAX_TAB_SWITCH_WARNING } from '../utils/constants.js'
import { formatTime } from '../utils/formatTime.js'
import { QUESTIONS } from '../data/questions.js'

/**
 * Lobby ala Quizizz/Wayground — layar persiapan sebelum tes dimulai.
 */
export default function LobbyScreen({ user, onStart, onBack }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        {/* Header ala lobby */}
        <div className="flex items-center justify-center mb-6">
          <img
            src="/logo-encasa.png"
            alt="Logo Encasa Grouping"
            draggable={false}
            className="h-12 sm:h-14 w-auto object-contain"
          />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
          {/* Peserta */}
          <div className="bg-blue-50 border-b border-blue-100 px-7 py-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center text-white font-extrabold shrink-0">
                {user.nama.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{user.nama}</p>
                <p className="text-xs text-slate-500">
                  Kelas {user.tingkat} · {user.kelas}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:border-blue-400 hover:text-blue-700"
            >
              <BiEdit className="text-sm" />
              Ubah
            </button>
          </div>

          <div className="px-7 py-6 space-y-5">
            {/* Info ringkas */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-3 text-center">
                <BiBook className="mx-auto text-blue-600 text-xl" />
                <p className="mt-1 text-lg font-extrabold text-slate-900 tabular-nums">{QUESTIONS.length}</p>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Soal</p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-3 text-center">
                <BiTimeFive className="mx-auto text-blue-600 text-xl" />
                <p className="mt-1 text-lg font-extrabold text-slate-900 tabular-nums">
                  {formatTime(TEST_DURATION_SECONDS)}
                </p>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Waktu</p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-3 text-center">
                <BiErrorCircle className="mx-auto text-blue-600 text-xl" />
                <p className="mt-1 text-lg font-extrabold text-slate-900 tabular-nums">
                  {MAX_TAB_SWITCH_WARNING}
                </p>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Max Pindah Tab</p>
              </div>
            </div>

            {/* Aturan */}
            <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3.5 space-y-2">
              {[
                'Tes dikerjakan sendiri — sistem anti-cheat aktif.',
                'Dilarang pindah tab / buka aplikasi lain (maks 3×, otomatis dikumpulkan).',
                'Copy, paste, dan klik kanan diblokir otomatis.',
                'Tes dikumpulkan otomatis saat waktu habis.',
                'Hasil & skor dikirim ke admin dan tercatat di Google Sheets.',
              ].map((rule) => (
                <div key={rule} className="flex items-start gap-2 text-xs text-blue-900/80">
                  <BiCheckCircle className="text-blue-600 mt-0.5 shrink-0" />
                  {rule}
                </div>
              ))}
            </div>

            {/* Mulai */}
            <button
              type="button"
              onClick={onStart}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-4 text-base font-extrabold text-white shadow-soft transition-all hover:bg-blue-700 active:scale-[0.99]"
            >
              <BiPlay className="text-xl" />
              Mulai Tes Sekarang
            </button>
            <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
              <BiUserCircle className="text-sm" />
              Tes berlangsung {formatTime(TEST_DURATION_SECONDS)} — pastikan kamu siap!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
