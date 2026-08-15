/**
 * Penyimpanan lokal (localStorage) agar progres tidak hilang saat tab di-refresh
 * atau browser ditutup tidak sengaja:
 *  - APP_KEY : identitas user + tahap (identity | lobby | test | done)
 *  - TEST_KEY: progres tes berjalan (jawaban, soal aktif, ragu-ragu, pelanggaran, waktu mulai)
 */

const APP_KEY = 'encasa.app'
const TEST_KEY = 'encasa.test'

function safeParse(raw) {
  try {
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function loadAppState() {
  const data = safeParse(localStorage.getItem(APP_KEY))
  return {
    user: data?.user ?? null,
    stage: ['identity', 'lobby', 'test', 'done'].includes(data?.stage) ? data.stage : 'identity',
  }
}

export function saveAppState({ user, stage }) {
  try {
    localStorage.setItem(APP_KEY, JSON.stringify({ user, stage }))
  } catch {
    // localStorage penuh / tidak tersedia — abaikan
  }
}

export function loadTestState() {
  const data = safeParse(localStorage.getItem(TEST_KEY))
  if (!data) return null
  return {
    currentIndex:
      Number.isInteger(data.currentIndex) && data.currentIndex >= 0 ? data.currentIndex : 0,
    answers: data.answers && typeof data.answers === 'object' ? data.answers : {},
    flagged: Array.isArray(data.flagged) ? data.flagged : [],
    tabSwitchCount: Number.isFinite(data.tabSwitchCount) ? data.tabSwitchCount : 0,
    testStartedAt: Number.isFinite(data.testStartedAt) ? data.testStartedAt : null,
    // seed pengacakan urutan soal/opsi — disimpan agar stabil saat refresh
    seed: Number.isFinite(data.seed) ? data.seed : null,
  }
}

export function saveTestState({
  currentIndex,
  answers,
  flagged,
  tabSwitchCount,
  testStartedAt,
  seed,
}) {
  try {
    localStorage.setItem(
      TEST_KEY,
      JSON.stringify({ currentIndex, answers, flagged, tabSwitchCount, testStartedAt, seed })
    )
  } catch {
    // abaikan
  }
}

export function clearTestState() {
  try {
    localStorage.removeItem(TEST_KEY)
  } catch {
    // abaikan
  }
}
