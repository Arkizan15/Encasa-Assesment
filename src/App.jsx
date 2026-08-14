import { useState } from 'react'
import IdentityForm from './components/IdentityForm.jsx'
import LobbyScreen from './components/LobbyScreen.jsx'
import TestEngine from './components/TestEngine.jsx'
import ResultScreen from './components/ResultScreen.jsx'

/**
 * Encasa Grouping — Web Tes Diagnostik Online (ala Wayground/Quizizz).
 * Alur: Form Identitas → Lobby → Mesin Tes & Anti-Cheat → Hasil + Google Sheets + WA.
 */
export default function App() {
  const [user, setUser] = useState(null)
  const [stage, setStage] = useState('identity') // identity | lobby | test
  const [testResult, setTestResult] = useState(null)

  if (testResult) {
    return <ResultScreen user={user} {...testResult} />
  }

  if (stage === 'lobby') {
    return (
      <LobbyScreen
        user={user}
        onStart={() => setStage('test')}
        onBack={() => setStage('identity')}
      />
    )
  }

  if (stage === 'test') {
    return (
      <TestEngine
        user={user}
        onFinish={(result) => {
          setTestResult(result)
          setStage('done')
        }}
      />
    )
  }

  return (
    <IdentityForm
      initialData={user}
      onSubmit={(identity) => {
        setUser(identity)
        setStage('lobby')
      }}
    />
  )
}
