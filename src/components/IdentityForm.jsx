import { useState } from 'react'
import { ArrowRightIcon } from '@heroicons/react/24/solid'
import { GRADE_LIST, CLASS_LIST } from '../data/classes.js'
import { validateIdentity } from '../utils/validation.js'
import CustomSelect from './CustomSelect.jsx'

/**
 * FASE 1 — Form Identitas (tampilan editorial ala Dribbble/Behance).
 * Layout asimetris: kiri cerita brand, kanan formulir. Tipografi pairing
 * Fraunces (judul) + Plus Jakarta Sans (body). Copy kasual & manusiawi.
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

  const fieldClass = (hasError) =>
    `w-full rounded-xl border bg-navy-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition-all placeholder:text-slate-500 ${
      hasError ? 'border-red-500/60 focus:border-red-400' : 'border-navy-700 focus:border-blue-400'
    }`

  return (
    <div className="min-h-screen bg-navy-950/70 flex items-center justify-center px-4 sm:px-6 py-10 lg:py-16">
      <div className="w-full max-w-6xl">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          {/* ── Kiri: cerita brand ── */}
          <div className="animate-rise">
            <img
              src="/logo-encasa.png"
              alt="Logo Encasa Grouping"
              draggable={false}
              className="h-16 w-auto object-contain rounded-[15px]"
            />

            <p className="mt-10 text-[11px] font-bold uppercase tracking-[0.25em] text-accent">
              Encasa Grouping · Penerimaan Anggota 2026
            </p>
            <h1 className="mt-4 text-4xl sm:text-5xl lg:text-[3.4rem] font-semibold text-cream-100 leading-[1.08]">
              Kenalan dulu,{' '}
              <em className="italic text-accent font-medium">biar nggak canggung.</em>
            </h1>
            <p className="mt-5 max-w-md text-sm sm:text-base leading-relaxed text-slate-400">
              Ini tes diagnostik singkat buat lihat gaya belajar & potensi kamu.
              Hasilnya cuma dibaca tim Encasa — nggak dipajang di mading, kok.
              Cukup jawab sejujurnya.
            </p>

            {/* Angka besar ala editorial */}
            <div className="mt-9 flex items-start gap-8">
              <div>
                <p className="font-display text-3xl text-cream-100">30</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                  soal singkat
                </p>
              </div>
              <div>
                <p className="font-display text-3xl text-cream-100">±15</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                  menit doang
                </p>
              </div>
              <div>
                <p className="font-display text-3xl text-cream-100">100%</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                  jujur aja
                </p>
              </div>
            </div>
          </div>

          {/* ── Kanan: formulir ── */}
          <div className="animate-rise-2">
            <div className="bg-navy-900 rounded-[28px] border border-navy-800 shadow-card p-7 sm:p-9">
              {/* Progres langkah */}
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  Langkah 1 dari 4
                </p>
                <p className="text-[11px] font-semibold text-accent">wajib diisi semua</p>
              </div>
              <div className="mt-3 h-1 rounded-full bg-navy-800">
                <div className="h-full w-1/4 rounded-full bg-amber-400" />
              </div>

              <h2 className="mt-7 text-2xl font-semibold text-slate-100">Biodata singkat</h2>
              <p className="mt-1 text-sm text-slate-400">
                Biar kami tahu hasil tes ini punya siapa.
              </p>

              <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-6">
                {/* 01 — Nama Lengkap */}
                <div>
                  <label htmlFor="nama" className="mb-1.5 flex items-baseline gap-2 text-sm font-semibold text-slate-300">
                    <span className="font-display text-xs italic text-accent">01</span>
                    Nama lengkap <span className="text-red-400">*</span>
                  </label>
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
                    className={fieldClass(errors.nama)}
                  />
                  {errors.nama && (
                    <p className="mt-1.5 text-xs font-medium text-red-400">{errors.nama}</p>
                  )}
                </div>

                {/* 02 — Tingkat (X / XI) */}
                <div>
                  <label htmlFor="tingkat" className="mb-1.5 flex items-baseline gap-2 text-sm font-semibold text-slate-300">
                    <span className="font-display text-xs italic text-accent">02</span>
                    Kelas (tingkat) <span className="text-red-400">*</span>
                  </label>
                  <CustomSelect
                    id="tingkat"
                    value={tingkat}
                    placeholder="Pilih tingkat (X / XI)…"
                    options={GRADE_LIST.map((g) => ({ value: g, label: `Kelas ${g}` }))}
                    error={errors.tingkat}
                    onChange={(v) => {
                      setTingkat(v)
                      if (errors.tingkat) setErrors((prev) => ({ ...prev, tingkat: null }))
                    }}
                  />
                  {errors.tingkat && (
                    <p className="mt-1.5 text-xs font-medium text-red-400">{errors.tingkat}</p>
                  )}
                </div>

                {/* 03 — Nama Kelas */}
                <div>
                  <label htmlFor="kelas" className="mb-1.5 flex items-baseline gap-2 text-sm font-semibold text-slate-300">
                    <span className="font-display text-xs italic text-accent">03</span>
                    Nama kelas <span className="text-red-400">*</span>
                  </label>
                  <CustomSelect
                    id="kelas"
                    value={kelas}
                    placeholder="Pilih nama kelas…"
                    options={CLASS_LIST}
                    error={errors.kelas}
                    onChange={(v) => {
                      setKelas(v)
                      if (errors.kelas) setErrors((prev) => ({ ...prev, kelas: null }))
                    }}
                  />
                  {errors.kelas && (
                    <p className="mt-1.5 text-xs font-medium text-red-400">{errors.kelas}</p>
                  )}
                </div>

                {/* CTA */}
                <button
                  type="submit"
                  className="cursor-target w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-4 text-sm font-extrabold text-navy-950 shadow-soft transition-all hover:-translate-y-0.5 hover:bg-amber-300 hover:shadow-card active:translate-y-0"
                >
                  Beres, lanjut ke briefing
                  <ArrowRightIcon className="h-5 w-5" />
                </button>
                <p className="text-center text-xs text-slate-500">
                  Nggak butuh waktu lama — ±15 menit, santai aja.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
