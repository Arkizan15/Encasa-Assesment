import { useEffect, useRef, useState } from 'react'
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline'

/**
 * Dropdown kustom (pengganti <select> native — panel default OS tidak bisa
 * di-styling). Dibangun murni dengan Tailwind, senada tema navy.
 *
 * Dua mode tampilan:
 *  - Daftar pendek (≤6 opsi) → panel kecil tepat di bawah tombol.
 *  - Daftar panjang (>6 opsi, mis. nama kelas) → FULL-SCREEN SHEET:
 *    overlay gelap + panel tengah, agar tidak ada warna halaman asli
 *    yang terlihat di bawah/samping panel.
 *
 * Navigasi keyboard lengkap:
 *  - ArrowDown/ArrowUp : buka dropdown (saat tertutup) / pindah sorotan
 *  - Home / End        : lompat ke opsi pertama / terakhir
 *  - Enter             : pilih opsi yang disorot
 *  - Escape            : tutup dropdown
 *
 * Props:
 *  - value       : nilai terpilih (string)
 *  - placeholder : teks saat kosong
 *  - options     : array string (label = value) atau { value, label }
 *  - icon        : elemen ikon kiri (opsional, posisi absolute)
 *  - error       : truthy → tampil state error
 *  - onChange    : (value) => void
 */
export default function CustomSelect({ id, value, placeholder, options = [], icon, error, onChange }) {
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(-1)
  const rootRef = useRef(null)
  const listRef = useRef(null)

  const items = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o))
  const selected = items.find((o) => o.value === value)
  const selectedIndex = selected ? items.findIndex((o) => o.value === value) : -1

  // Daftar panjang → full-screen sheet supaya menutupi seluruh layar
  const isSheet = items.length > 6
  const sheetTitle = (placeholder || 'Pilih').replace(/…$/, '')

  const openDropdown = () => {
    setOpen(true)
    setHighlight(selectedIndex >= 0 ? selectedIndex : 0)
  }

  const selectOption = (o) => {
    onChange(o.value)
    setOpen(false)
  }

  const close = () => setOpen(false)

  // Tutup saat klik di luar (mode panel kecil)
  useEffect(() => {
    if (!open || isSheet) return
    const onPointerDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open, isSheet])

  // Jaga opsi yang disorot tetap terlihat saat scroll (daftar panjang)
  useEffect(() => {
    if (!open || !listRef.current) return
    const el = listRef.current.querySelector(`[data-index="${highlight}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [open, highlight])

  // Navigasi keyboard (terpicu saat fokus berada di dalam root — tombol pemicu)
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setOpen(false)
      return
    }
    if (open) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlight((h) => (h + 1) % items.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlight((h) => (h - 1 + items.length) % items.length)
      } else if (e.key === 'Home') {
        e.preventDefault()
        setHighlight(0)
      } else if (e.key === 'End') {
        e.preventDefault()
        setHighlight(items.length - 1)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const h = highlight >= 0 ? highlight : 0
        if (items[h]) selectOption(items[h])
      }
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      openDropdown()
    }
  }

  const optionClass = (o, i) =>
    `cursor-target w-full px-4 py-2.5 text-left text-sm transition-colors ${
      o.value === value
        ? 'bg-brand-50 text-brand-600'
        : i === highlight
          ? 'bg-brand-50 text-brand-700'
          : 'text-slate-600 hover:bg-slate-50'
    }`

  return (
    <div className="relative" ref={rootRef} onKeyDown={handleKeyDown}>
      {icon}

      {/* Tombol pemicu */}
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-activedescendant={open && highlight >= 0 ? `${id}-option-${highlight}` : undefined}
        onClick={() => (open ? setOpen(false) : openDropdown())}
        className={`cursor-target w-full rounded-xl border bg-white pl-10 pr-10 py-3 text-left text-sm outline-none transition-colors ${
          selected ? 'text-slate-900' : 'text-slate-400'
        } ${error ? 'border-red-400' : 'border-slate-300'}`}
      >
        {selected ? selected.label : placeholder}
      </button>
      <ChevronDownIcon
        className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 h-5 w-5 pointer-events-none transition-transform ${
          open ? 'rotate-180' : ''
        }`}
      />

      {/* ── Mode panel kecil (daftar pendek) ── */}
      {open && !isSheet && (
        <ul
          role="listbox"
          aria-labelledby={id}
          ref={listRef}
          className="absolute z-30 mt-2 w-full rounded-xl bg-white border border-slate-200 shadow-card py-1"
        >
          <div className="max-h-60 overflow-y-auto">
            {items.map((o, i) => (
              <li key={o.value}>
                <button
                  type="button"
                  id={`${id}-option-${i}`}
                  role="option"
                  aria-selected={o.value === value}
                  data-index={i}
                  onClick={() => selectOption(o)}
                  onMouseEnter={() => setHighlight(i)}
                  className={optionClass(o, i)}
                >
                  {o.label}
                </button>
              </li>
            ))}
          </div>
        </ul>
      )}

      {/* ── Mode full-screen sheet (daftar panjang) ── */}
      {open && isSheet && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6"
          onClick={close}
        >
          <div
            role="listbox"
            aria-labelledby={id}
            className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header sheet */}
            <div className="flex items-center justify-between bg-amber-50 border-b border-slate-200 px-5 py-4">
              <p className="font-display text-base font-semibold text-slate-800">{sheetTitle}</p>
              <button
                type="button"
                onClick={close}
                aria-label="Tutup"
                className="cursor-target text-slate-500 transition-colors hover:text-slate-300"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Daftar opsi */}
            <div ref={listRef} className="max-h-[65vh] overflow-y-auto px-3 py-3">
              {items.map((o, i) => (
                <button
                  key={o.value}
                  type="button"
                  id={`${id}-option-${i}`}
                  role="option"
                  aria-selected={o.value === value}
                  data-index={i}
                  onClick={() => selectOption(o)}
                  onMouseEnter={() => setHighlight(i)}
                  className={`${optionClass(o, i)} rounded-lg`}
                >
                  {o.label}
                </button>
              ))}
            </div>

            {/* Footer sheet */}
            <div className="border-t border-slate-200 px-5 py-3">
              <button
                type="button"
                onClick={close}
                className="cursor-target w-full rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
