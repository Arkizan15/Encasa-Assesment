import { useState } from 'react'
import {
  BiUser,
  BiBook,
  BiCollection,
  BiInfoCircle,
  BiCheckCircle,
  BiRightArrowAlt,
  BiChevronDown,
} from 'react-icons/bi'
import { GRADE_LIST, CLASS_LIST } from '../data/classes.js'
import { validateIdentity } from '../utils/validation.js'

/**
 * FASE 1 — Form Identitas Pengguna.
 * Input Nama Lengkap (wajib) + Dropdown Kelas (tidak boleh ketik bebas).
 * Tema biru flat, font Inter, tanpa gradient.
 */
export default function IdentityForm({ onSubmit, initialData }) {
  // initialData (opsional) → isi form dengan data sebelumnya saat kembali dari lobby
  const [nama, setNama] = useState(initialData?.nama ?? '')
  const [tingkat, setTingkat] = useState(initialData?.tingkat ?? '')
  const [kelas, setKelas] = useState(initialData?.kelas ?? '')
  const [errors, setErrors] = useState({ nama: null, tingkat: null, kelas: null })

  const handleSubmit = (e) => {
    e.preventDefault()
    const validation = validateIdentity({ nama, tingkat, kelas })
    setErrors(validation)

    if (!validation.nama && !validation.tingkat && !validation.kelas) {
      onSubmit({ nama: nama.trim(), tingkat, kelas })
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        {/* Brand header */}
        <div className="flex items-center justify-center mb-6">
          <img
            src="/logo-encasa.png"
            alt="Logo Encasa Grouping"
            draggable={false}
            className="h-12 sm:h-14 w-auto object-contain"
          />
        </div>

        {/* Card utama */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
          {/* Header card */}
          <div className="bg-blue-50 border-b border-blue-100 px-7 py-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              <BiInfoCircle className="text-sm" />
              TES DIAGNOSTIK ONLINE
            </span>
            <h1 className="mt-3 text-2xl font-bold text-slate-900">Identitas Pendaftar</h1>
            <p className="mt-1 text-sm text-slate-500">
              Isi data diri dengan benar. Data ini akan digunakan untuk menilai hasil tes kamu.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="px-7 py-6 space-y-5">
            {/* Nama Lengkap */}
            <div>
              <label htmlFor="nama" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <BiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                <input
                  id="nama"
                  type="text"
                  value={nama}
                  onChange={(e) => {
                    setNama(e.target.value)
                    if (errors.nama) setErrors((prev) => ({ ...prev, nama: null }))
                  }}
                  placeholder="Contoh: Arkan Rifqy fauzan"
                  autoComplete="name"
                  className={`w-full rounded-xl border bg-white pl-10 pr-4 py-3 text-sm outline-none transition-colors placeholder:text-slate-400 focus:ring-2 ${
                    errors.nama
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                      : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'
                  }`}
                />
              </div>
              {errors.nama && (
                <p className="mt-1.5 text-xs font-medium text-red-600">{errors.nama}</p>
              )}
            </div>

            {/* Tingkat (X / XI) */}
            <div>
              <label htmlFor="tingkat" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Kelas (Tingkat) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <BiCollection className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                <select
                  id="tingkat"
                  value={tingkat}
                  onChange={(e) => {
                    setTingkat(e.target.value)
                    if (errors.tingkat) setErrors((prev) => ({ ...prev, tingkat: null }))
                  }}
                  className={`w-full appearance-none rounded-xl border bg-white pl-10 pr-10 py-3 text-sm outline-none transition-colors focus:ring-2 ${
                    tingkat ? 'text-slate-800' : 'text-slate-400'
                  } ${
                    errors.tingkat
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                      : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'
                  }`}
                >
                  <option value="" disabled>
                    Pilih tingkat (X / XI)…
                  </option>
                  {GRADE_LIST.map((g) => (
                    <option key={g} value={g} className="text-slate-800">
                      Kelas {g}
                    </option>
                  ))}
                </select>
                <BiChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none" />
              </div>
              {errors.tingkat && (
                <p className="mt-1.5 text-xs font-medium text-red-600">{errors.tingkat}</p>
              )}
            </div>

            {/* Nama Kelas */}
            <div>
              <label htmlFor="kelas" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Nama Kelas <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <BiBook className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                <select
                  id="kelas"
                  value={kelas}
                  onChange={(e) => {
                    setKelas(e.target.value)
                    if (errors.kelas) setErrors((prev) => ({ ...prev, kelas: null }))
                  }}
                  className={`w-full appearance-none rounded-xl border bg-white pl-10 pr-10 py-3 text-sm outline-none transition-colors focus:ring-2 ${
                    kelas ? 'text-slate-800' : 'text-slate-400'
                  } ${
                    errors.kelas
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                      : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'
                  }`}
                >
                  <option value="" disabled>
                    Pilih nama kelas…
                  </option>
                  {CLASS_LIST.map((kls) => (
                    <option key={kls} value={kls} className="text-slate-800">
                      {kls}
                    </option>
                  ))}
                </select>
                <BiChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none" />
              </div>
              {errors.kelas && (
                <p className="mt-1.5 text-xs font-medium text-red-600">{errors.kelas}</p>
              )}
            </div>

            {/* Info aturan tes */}
            <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3.5">
              <p className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-2">
                Sebelum mulai, perhatikan:
              </p>
              <ul className="space-y-1.5">
                {[
                  'Tes bersifat individu dan diawasi sistem anti-cheat.',
                  'Dilarang berpindah tab / membuka aplikasi lain selama tes.',
                  'Dilarang copy-paste & klik kanan — sistem akan memblokir otomatis.',
                  'Tes akan dikumpulkan otomatis saat waktu habis.',
                  'Coba aja nge cheat kalo berani.'
                ].map((rule) => (
                  <li key={rule} className="flex items-start gap-2 text-xs text-blue-900/80">
                    <BiCheckCircle className="text-blue-600 mt-0.5 shrink-0" />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white shadow-soft transition-colors hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              Mulai Tes Assessment
              <BiRightArrowAlt className="text-lg" />
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-slate-400">
          Encasa Assessment by Arkan Rifqy Fauzan
        </p>
      </div>
    </div>
  )
}
