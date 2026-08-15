import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * FASE 2 — Anti-Cheat Engine.
 *
 * 1. Deteksi pindah tab / buka aplikasi lain (visibilitychange) → hitung pelanggaran.
 * 2. Deteksi keluar dari mode fullscreen (wajib selama tes) → hitung pelanggaran.
 * 3. Anti-screenshot desktop: saat browser kehilangan fokus (window blur — mis.
 *    Snipping Tool / Alt+Tab mencuri fokus) → SELURUH LAYAR DI-BLUR
 *    (filter: blur(20px)) agar tangkapan layar tidak terbaca. Otomatis kembali
 *    normal saat fokus kembali. Dihitung sebagai pelanggaran HANYA saat
 *    fullscreen aktif (hindari false-positive saat klik di luar window).
 *    Tombol PrintScreen juga diblokir.
 * 4. Blokir klik kanan (contextmenu), copy, cut, paste, dan seleksi teks.
 * 5. Blokir shortcut umum: Ctrl/Cmd+C/V/X/U/A/S/P, Ctrl/Cmd+Shift+I/J/C, F12.
 *
 * Catatan: screenshot di perangkat seluler (Android/iOS) tidak bisa dideteksi
 * oleh aplikasi web — ini batasan OS.
 *
 * @param {Object}   options
 * @param {number}   options.maxWarnings   Batas pelanggaran sebelum auto-submit.
 * @param {Function} options.onViolationLimit  Dipanggil saat pelanggaran mencapai batas.
 * @param {number}   options.initialCount  Pelanggaran tersimpan yang dipulihkan setelah refresh.
 * @returns {{ tabSwitchCount: number, warningOpen: boolean, dismissWarning: Function }}
 */
export default function useAntiCheat({ maxWarnings = 3, onViolationLimit, initialCount = 0 }) {
  const [tabSwitchCount, setTabSwitchCount] = useState(initialCount)
  const [warningOpen, setWarningOpen] = useState(false)

  const onViolationLimitRef = useRef(onViolationLimit)
  onViolationLimitRef.current = onViolationLimit
  const unmountedRef = useRef(false)

  // Satu kejadian nyata bisa memicu beberapa event sekaligus
  // (mis. blur + visibilitychange + fullscreenchange) — dedup dalam 1 detik.
  const lastViolationAtRef = useRef(0)
  const fullscreenActiveRef = useRef(false)

  // ── Efek blur layar (anti-screenshot visual) ─────────────────────────
  // Saat browser kehilangan fokus, seluruh halaman di-blur agar tangkapan
  // layar / foto tidak terbaca. Dipulihkan otomatis saat fokus kembali.
  const applyScreenBlur = useCallback(() => {
    if (document.body.style.filter === 'blur(20px)') return
    document.body.style.transition = 'filter 0.2s ease'
    document.body.style.filter = 'blur(20px)'
  }, [])

  const removeScreenBlur = useCallback(() => {
    document.body.style.filter = ''
    document.body.style.transition = ''
  }, [])

  const countViolation = useCallback(() => {
    const now = Date.now()
    if (now - lastViolationAtRef.current < 1000) return
    lastViolationAtRef.current = now
    setTabSwitchCount((prev) => prev + 1)
    setWarningOpen(true)
  }, [])

  // Pasang semua blokir + detektor saat tes berlangsung
  useEffect(() => {
    unmountedRef.current = false // reset (StrictMode double-mount di dev)
    const block = (e) => e.preventDefault()

    const onKeyDown = (e) => {
      // Ctrl (Windows/Linux) ATAU Cmd (macOS) — keduanya diblokir
      const isMod = e.ctrlKey || e.metaKey
      const blockedKeys = ['c', 'v', 'x', 'u', 's', 'a', 'p']
      if (isMod && blockedKeys.includes(e.key.toLowerCase())) {
        e.preventDefault()
      }
      // DevTools: Ctrl/Cmd+Shift+I / J / C
      if (isMod && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase())) {
        e.preventDefault()
      }
      if (e.key === 'F12') {
        e.preventDefault()
      }
      // Tombol screenshot (PrintScreen / Alt+PrtSc / Ctrl+PrtSc)
      if (e.key === 'PrintScreen') {
        e.preventDefault()
      }
    }

    const onVisibilityChange = () => {
      if (document.hidden) {
        applyScreenBlur()
        countViolation()
      } else {
        removeScreenBlur()
      }
    }

    // Anti-screenshot desktop: kehilangan fokus (window blur) → blur layar
    // supaya Snipping Tool / tool screenshot lain menangkap layar buram.
    // (Dihitung sebagai pelanggaran hanya saat fullscreen — tanpanya blur
    // mudah false-positive, tapi efek blur visual tetap diterapkan.)
    const onBlur = () => {
      if (unmountedRef.current) return
      applyScreenBlur()
      if (fullscreenActiveRef.current) countViolation()
    }

    // Fokus kembali → layar pulih normal
    const onFocus = () => removeScreenBlur()

    // Keluar dari fullscreen (setelah berhasil masuk) = pelanggaran
    const onFullscreenChange = () => {
      if (unmountedRef.current) return
      if (document.fullscreenElement) {
        fullscreenActiveRef.current = true
      } else {
        if (fullscreenActiveRef.current) countViolation()
        fullscreenActiveRef.current = false
      }
    }

    document.addEventListener('contextmenu', block)
    document.addEventListener('copy', block)
    document.addEventListener('cut', block)
    document.addEventListener('paste', block)
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('visibilitychange', onVisibilityChange)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    window.addEventListener('blur', onBlur)
    window.addEventListener('focus', onFocus)

    return () => {
      unmountedRef.current = true
      document.removeEventListener('contextmenu', block)
      document.removeEventListener('copy', block)
      document.removeEventListener('cut', block)
      document.removeEventListener('paste', block)
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('focus', onFocus)
      // Kembalikan layar ke normal — jangan merusak halaman lain
      removeScreenBlur()
    }
  }, [countViolation, applyScreenBlur, removeScreenBlur])

  // Auto-submit saat pelanggaran mencapai batas maksimal
  useEffect(() => {
    if (tabSwitchCount > 0 && tabSwitchCount >= maxWarnings) {
      onViolationLimitRef.current(tabSwitchCount)
    }
  }, [tabSwitchCount, maxWarnings])

  const dismissWarning = useCallback(() => setWarningOpen(false), [])

  return { tabSwitchCount, warningOpen, dismissWarning }
}
