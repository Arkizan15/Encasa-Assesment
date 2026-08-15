import { useEffect, useState } from 'react'
import IdentityForm from './components/IdentityForm.jsx'
import LobbyScreen from './components/LobbyScreen.jsx'
import TestEngine from './components/TestEngine.jsx'
import ResultScreen from './components/ResultScreen.jsx'
import { loadAppState, saveAppState } from './utils/persistence.js'

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

  if (testResult) {
    return <ResultScreen user={user} {...testResult} />
  }

  if (stage === 'lobby') {
    return (
      <LobbyScreen
        user={user}
        onStart={() => setAppState({ user, stage: 'test' })}
        onBack={() => setAppState({ user, stage: 'identity' })}
      />
    )
  }

  if (stage === 'test') {
    return (
      <TestEngine
        user={user}
        onFinish={(result) => {
          setTestResult(result)
          setAppState({ user, stage: 'done' })
        }}
      />
    )
  }

  return (
    <IdentityForm
      initialData={user}
      onSubmit={(identity) => {
        setAppState({ user: identity, stage: 'lobby' })
      }}
    />
  )
}
