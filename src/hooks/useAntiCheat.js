import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * FASE 2 — Anti-Cheat Engine.
 *
 * 1. Deteksi pindah tab / buka aplikasi lain (visibilitychange) → hitung pelanggaran.
 * 2. Blokir klik kanan (contextmenu), copy, cut, paste, dan seleksi teks.
 * 3. Blokir shortcut umum: Ctrl+C/V/X/A/U/S/P, F12.
 *
 * @param {Object}   options
 * @param {number}   options.maxWarnings   Batas pelanggaran sebelum auto-submit.
 * @param {Function} options.onViolationLimit  Dipanggil saat pelanggaran mencapai batas.
 * @returns {{ tabSwitchCount: number, warningOpen: boolean, dismissWarning: Function }}
 */
export default function useAntiCheat({ maxWarnings = 3, onViolationLimit }) {
  const [tabSwitchCount, setTabSwitchCount] = useState(0)
  const [warningOpen, setWarningOpen] = useState(false)

  const onViolationLimitRef = useRef(onViolationLimit)
  onViolationLimitRef.current = onViolationLimit

  // Pasang semua blokir + detektor saat tes berlangsung
  useEffect(() => {
    const block = (e) => e.preventDefault()

    const onKeyDown = (e) => {
      const blockedKeys = ['c', 'v', 'x', 'u', 's', 'a', 'p']
      if (e.ctrlKey && blockedKeys.includes(e.key.toLowerCase())) {
        e.preventDefault()
      }
      if (e.key === 'F12') {
        e.preventDefault()
      }
    }

    const onVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => prev + 1)
      }
    }

    document.addEventListener('contextmenu', block)
    document.addEventListener('copy', block)
    document.addEventListener('cut', block)
    document.addEventListener('paste', block)
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      document.removeEventListener('contextmenu', block)
      document.removeEventListener('copy', block)
      document.removeEventListener('cut', block)
      document.removeEventListener('paste', block)
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  // Tampilkan modal peringatan setiap kali terjadi pelanggaran
  useEffect(() => {
    if (tabSwitchCount > 0) setWarningOpen(true)
  }, [tabSwitchCount])

  // Auto-submit saat pelanggaran mencapai batas maksimal
  useEffect(() => {
    if (tabSwitchCount > 0 && tabSwitchCount >= maxWarnings) {
      onViolationLimitRef.current(tabSwitchCount)
    }
  }, [tabSwitchCount, maxWarnings])

  const dismissWarning = useCallback(() => setWarningOpen(false), [])

  return { tabSwitchCount, warningOpen, dismissWarning }
}
