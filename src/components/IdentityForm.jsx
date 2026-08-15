import { useState } from 'react'
import {
  UserIcon,
  BookOpenIcon,
  RectangleStackIcon,
  InformationCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import { ArrowRightIcon } from '@heroicons/react/24/solid'
import { GRADE_LIST, CLASS_LIST } from '../data/classes.js'
import { validateIdentity } from '../utils/validation.js'
import CustomSelect from './CustomSelect.jsx'

/**
 * FASE 1 — Form Identitas Pengguna.
 * Input Nama Lengkap (wajib) + Dropdown Kelas (tidak boleh ketik bebas).
 * Tema navy flat, font Poppins, tanpa gradient.
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
    <div className="min-h-screen bg-navy-950/70 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        {/* Brand header */}
        <div className="flex items-center justify-center mb-6">
          <img
            src="/logo-encasa.png"
            alt="Logo Encasa Grouping"
            draggable={false}
            className="h-12 sm:h-14 w-auto object-contain rounded-[15px]"
          />
        </div>

        {/* Card utama */}
        <div className="bg-navy-900 rounded-2xl border border-navy-800 shadow-card">
          {/* Header card */}
          <div className="bg-navy-850 rounded-t-2xl border-b border-navy-700 px-7 py-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-900 border border-blue-500/30 px-3 py-1 text-xs font-semibold text-blue-300">
              <InformationCircleIcon className="h-4 w-4" />
              TES DIAGNOSTIK ONLINE
            </span>
            <h1 className="mt-3 text-2xl font-bold text-slate-100">Identitas Pendaftar</h1>
            <p className="mt-1 text-sm text-slate-400">
              Isi data diri dengan benar. Data ini akan digunakan untuk menilai hasil tes kamu.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="px-7 py-6 space-y-5">
            {/* Nama Lengkap */}
            <div>
              <label htmlFor="nama" className="block text-sm font-semibold text-slate-300 mb-1.5">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 h-5 w-5" />
                <input
                  id="nama"
                  type="text"
                  value={nama}
                  onChange={(e) => {
                    setNama(e.target.value)
                    if (errors.nama) setErrors((prev) => ({ ...prev, nama: null }))
                  }}
                  placeholder="Contoh: Arkan Rifqy Fauzan"
                  autoComplete="name"
                  className={`w-full rounded-xl border bg-navy-950/60 pl-10 pr-4 py-3 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-500 ${
                    errors.nama
                      ? 'border-red-500/60 focus:border-red-400'
                      : 'border-navy-700 focus:border-blue-400'
                  }`}
                />
              </div>
              {errors.nama && (
                <p className="mt-1.5 text-xs font-medium text-red-600">{errors.nama}</p>
              )}
            </div>

            {/* Tingkat (X / XI) */}
            <div>
              <label htmlFor="tingkat" className="block text-sm font-semibold text-slate-300 mb-1.5">
                Kelas (Tingkat) <span className="text-red-500">*</span>
              </label>
              <CustomSelect
                id="tingkat"
                value={tingkat}
                placeholder="Pilih tingkat (X / XI)…"
                options={GRADE_LIST.map((g) => ({ value: g, label: `Kelas ${g}` }))}
                icon={
                  <RectangleStackIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 h-5 w-5" />
                }
                error={errors.tingkat}
                onChange={(v) => {
                  setTingkat(v)
                  if (errors.tingkat) setErrors((prev) => ({ ...prev, tingkat: null }))
                }}
              />
              {errors.tingkat && (
                <p className="mt-1.5 text-xs font-medium text-red-600">{errors.tingkat}</p>
              )}
            </div>

            {/* Nama Kelas */}
            <div>
              <label htmlFor="kelas" className="block text-sm font-semibold text-slate-300 mb-1.5">
                Nama Kelas <span className="text-red-500">*</span>
              </label>
              <CustomSelect
                id="kelas"
                value={kelas}
                placeholder="Pilih nama kelas…"
                options={CLASS_LIST}
                icon={
                  <BookOpenIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 h-5 w-5" />
                }
                error={errors.kelas}
                onChange={(v) => {
                  setKelas(v)
                  if (errors.kelas) setErrors((prev) => ({ ...prev, kelas: null }))
                }}
              />
              {errors.kelas && (
                <p className="mt-1.5 text-xs font-medium text-red-600">{errors.kelas}</p>
              )}
            </div>

            {/* Info aturan tes */}
            <div className="rounded-xl bg-blue-500/10 border border-blue-500/25 px-4 py-3.5">
              <p className="text-xs font-bold text-blue-300 uppercase tracking-wide mb-2">
                Sebelum mulai, perhatikan:
              </p>
              <ul className="space-y-1.5">
                {[
                  'Tes bersifat individu dan diawasi sistem anti-cheat.',
                  'Dilarang berpindah tab (maks pindah 3 kali wak, I just warn ya)',
                  'Coba deh nanti copy pertanyaannya',
                  'Tes akan dikumpulkan otomatis saat waktu habis.',
                  'Jujur, bakal lebih asik kalo kalian buka ini di PC/laptop',
                  'Wanna try cheating?'
                ].map((rule) => (
                  <li key={rule} className="flex items-start gap-2 text-xs text-blue-200/80">
                    <CheckCircleIcon className="text-blue-400 mt-0.5 shrink-0 h-4 w-4" />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="cursor-target w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-3.5 text-sm font-bold text-white shadow-soft transition-colors hover:bg-blue-400 active:bg-blue-600"
            >
              Mulai Tes Assessment
              <ArrowRightIcon className="h-5 w-5" />
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-slate-500">
          Encasa Assessment by Arkan Rifqy Fauzan
        </p>
      </div>
    </div>
  )
}
