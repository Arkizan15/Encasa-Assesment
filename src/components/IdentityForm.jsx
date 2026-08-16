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
import { MascotHead } from './MascotOrnament.jsx'

/**
 * FASE 1 — Form Identitas Pengguna.
 * Input Nama Lengkap (wajib) + Dropdown Kelas (tidak boleh ketik bebas).
 * Tema light (slate), aksen brand biru + CTA amber, tanpa gradient.
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
        <div className="relative flex items-center justify-center mb-6">
          <MascotHead
            variant="talking"
            size="lg"
            className="absolute left-0 sm:left-4 top-1/2 -translate-y-1/2 hidden sm:inline-block"
          />
          <img
            src="/logo-encasa.png"
            alt="Logo Encasa Grouping"
            draggable={false}
            className="h-12 sm:h-14 w-auto object-contain rounded-[15px]"
          />
        </div>

        {/* Card utama */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card">
          {/* Header card */}
          <div className="bg-brand-50 rounded-t-2xl border-b border-brand-100 px-7 py-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-brand-200 px-3 py-1 text-xs font-semibold text-brand-600">
              <InformationCircleIcon className="h-4 w-4" />
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
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
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
                  className={`w-full rounded-xl border bg-white pl-10 pr-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 ${
                    errors.nama
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-slate-300 focus:border-brand-500'
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
              <CustomSelect
                id="tingkat"
                value={tingkat}
                placeholder="Pilih tingkat (X / XI)…"
                options={GRADE_LIST.map((g) => ({ value: g, label: `Kelas ${g}` }))}
                icon={
                  <RectangleStackIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
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
              <label htmlFor="kelas" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Nama Kelas <span className="text-red-500">*</span>
              </label>
              <CustomSelect
                id="kelas"
                value={kelas}
                placeholder="Pilih nama kelas…"
                options={CLASS_LIST}
                icon={
                  <BookOpenIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
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
            <div className="rounded-xl bg-brand-50 border border-brand-100 px-4 py-3.5">
              <p className="text-xs font-bold text-brand-700 uppercase tracking-wide mb-2">
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
                  <li key={rule} className="flex items-start gap-2 text-xs text-slate-600">
                    <CheckCircleIcon className="text-brand-500 mt-0.5 shrink-0 h-4 w-4" />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="cursor-target w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3.5 text-sm font-bold text-white shadow-soft transition-colors hover:bg-brand-400 active:bg-brand-600"
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
