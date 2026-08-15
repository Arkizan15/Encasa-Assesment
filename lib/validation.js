/**
 * Validasi input server-side untuk /api/test-session & /api/submit-score.
 * Mencegah body sampah / spam masuk ke Google Sheet.
 */
import { ANSWER_KEY } from './answer-key.js'

// Daftar kelas sama dengan src/data/classes.js (salinan server-only)
const GRADE_LIST = ['X', 'XI']
const CLASS_LIST = [
  'AKL 1', 'AKL 2', 'AKL 3',
  'MPLB 1', 'MPLB 2',
  'PM 1', 'PM 2',
  'TJKT 1', 'TJKT 2',
  'PPLG 1', 'PPLG 2',
  'DKV 1', 'DKV 2',
  'BCF 1', 'BCF 2',
  'SP 1', 'SP 2',
  'PH 1', 'PH 2', 'PH 3',
  'KL 1',
  'ULW 1', 'ULW 2',
]

const VALID_KELAS = new Set(
  GRADE_LIST.flatMap((g) => CLASS_LIST.map((k) => `${g} ${k}`))
)

export function isValidKelas(kelas) {
  return typeof kelas === 'string' && VALID_KELAS.has(kelas.trim())
}

export function isValidNama(nama) {
  return (
    typeof nama === 'string' &&
    nama.trim().length >= 3 &&
    nama.trim().length <= 100
  )
}

/**
 * Validasi & bersihkan jawaban.
 * @returns {{ ok: true, answers: Object } | { ok: false, reason: string }}
 */
export function validateAnswers(answers) {
  if (answers == null || typeof answers !== 'object' || Array.isArray(answers)) {
    return { ok: false, reason: 'invalid_answers' }
  }

  const cleaned = {}
  for (const [idStr, value] of Object.entries(answers)) {
    const id = Number(idStr)
    if (!Number.isInteger(id) || !(id in ANSWER_KEY)) continue // abaikan id tak dikenal

    if (Array.isArray(ANSWER_KEY[id])) {
      if (!Array.isArray(value) || value.length === 0) continue
      if (!value.every((v) => typeof v === 'string' && v.length > 0 && v.length <= 500)) {
        return { ok: false, reason: 'invalid_answers' }
      }
      cleaned[id] = [...new Set(value)]
    } else {
      if (typeof value !== 'string' || value.length === 0 || value.length > 500) {
        return { ok: false, reason: 'invalid_answers' }
      }
      cleaned[id] = value
    }
  }

  return { ok: true, answers: cleaned }
}
