import { useEffect, useRef, useState } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

/**
 * Dropdown kustom (pengganti <select> native — panel default OS tidak bisa
 * di-styling). Dibangun murni dengan Tailwind, senada tema navy.
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

  const openDropdown = () => {
    setOpen(true)
    setHighlight(selectedIndex >= 0 ? selectedIndex : 0)
  }

  const selectOption = (o) => {
    onChange(o.value)
    setOpen(false)
  }

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

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
        className={`cursor-target w-full rounded-xl border bg-navy-950/60 pl-10 pr-10 py-3 text-left text-sm outline-none transition-colors ${
          selected ? 'text-slate-100' : 'text-slate-500'
        } ${error ? 'border-red-500/60' : 'border-navy-700'}`}
      >
        {selected ? selected.label : placeholder}
      </button>
      <ChevronDownIcon
        className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 h-5 w-5 pointer-events-none transition-transform ${
          open ? 'rotate-180' : ''
        }`}
      />

      {/* Daftar opsi */}
      {open && (
        <ul
          role="listbox"
          aria-labelledby={id}
          ref={listRef}
          className="absolute z-30 mt-2 w-full rounded-xl bg-navy-800 shadow-card py-1"
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
                  className={`cursor-target w-full px-4 py-2.5 text-left text-sm transition-colors ${
                    o.value === value
                      ? 'bg-blue-500/15 text-accent-300'
                      : i === highlight
                        ? 'bg-navy-700 text-slate-100'
                        : 'text-slate-300 hover:bg-navy-700'
                  }`}
                >
                  {o.label}
                </button>
              </li>
            ))}
          </div>
        </ul>
      )}
    </div>
  )
}
