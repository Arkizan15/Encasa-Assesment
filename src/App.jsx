import React, { lazy, Suspense, useEffect, useState } from 'react'
import IdentityForm from './components/IdentityForm.jsx'
import LobbyScreen from './components/LobbyScreen.jsx'
import TestEngine from './components/TestEngine.jsx'
import ResultScreen from './components/ResultScreen.jsx'
import TargetCursor from './components/TargetCursor.jsx'
import { loadAppState, saveAppState } from './utils/persistence.js'

// Silk (three.js) dimuat async agar bundle utama tetap ringan —
// background WebGL muncul setelah halaman selesai dirender.
const Silk = lazy(() => import('./components/Silk.jsx'))

/**
 * Pengaman background Silk: kalau WebGL tidak tersedia / chunk gagal dimuat,
 * background cukup tidak muncul — tes tetap jalan normal.
 */
class SilkErrorBoundary extends React.Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    return this.state.hasError ? null : this.props.children
  }
}

/**
 * Encasa Grouping — Web Tes Diagnostik Online (ala Wayground/Quizizz).
 * Alur: Form Identitas → Lobby → Mesin Tes & Anti-Cheat → Hasil + Google Sheets + WA.
 *
 * Identitas + tahap disimpan di localStorage, jadi kalau tab tidak sengaja di-refresh
 * saat mengerjakan tes, user kembali ke posisi terakhir (bukan ke halaman awal).
 */
export default function App() {
  const [appState, setAppState] = useState(loadAppState)
  const { user, stage } = appState
  const [testResult, setTestResult] = useState(null)

  // Simpan identitas + tahap agar survive refresh
  useEffect(() => {
    saveAppState({ user, stage })
  }, [user, stage])

  return (
    <>
      {/* Kursor target kustom ala React Bits — aktif di semua layar */}
      <TargetCursor
        spinDuration={2}
        hideDefaultCursor
        parallaxOn
        cursorColor="#1E70DE"
        cursorColorOnTarget="#f59e0b"
      />

      {/* Latar Silk (React Bits) — animasi shader WebGL di belakang semua layar.
       * Layar memakai bg-slate-50 sehingga pola silk terlihat samar di tepinya. */}
      <SilkErrorBoundary>
        <Suspense fallback={null}>
          <div className="fixed inset-0 -z-10 pointer-events-none" aria-hidden="true">
            <Silk speed={2} scale={1} color="#a9c9f8" noiseIntensity={0.8} />
          </div>
        </Suspense>
      </SilkErrorBoundary>

      {testResult ? (
        <ResultScreen user={user} {...testResult} />
      ) : stage === 'lobby' ? (
        <LobbyScreen
          user={user}
          onStart={() => setAppState({ user, stage: 'test' })}
          onBack={() => setAppState({ user, stage: 'identity' })}
        />
      ) : stage === 'test' ? (
        <TestEngine
          user={user}
          onFinish={(result) => {
            setTestResult(result)
            setAppState({ user, stage: 'done' })
          }}
        />
      ) : (
        <IdentityForm
          initialData={user}
          onSubmit={(identity) => {
            setAppState({ user: identity, stage: 'lobby' })
          }}
        />
      )}
    </>
  )
}
