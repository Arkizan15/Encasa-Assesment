/**
 * Penilaian server-side — kunci jawaban HANYA ada di server, tidak pernah
 * dikirim ke browser. Frontend mengirim jawaban; server menghitung skor.
 *
 * Skor memakai BOBOT POIN per soal (5 / 10 / 20, total maks 300) sesuai
 * spesifikasi admin — bukan sekadar hitung jumlah benar.
 */
import { ANSWER_KEY, QUESTION_POINTS } from './answer-key.js'

const TOTAL = Object.values(QUESTION_POINTS).reduce((sum, p) => sum + p, 0)

function isEmpty(answer) {
  return (
    answer == null ||
    answer === '' ||
    (Array.isArray(answer) && answer.length === 0)
  )
}

function isMultipleSelect(id) {
  return Array.isArray(ANSWER_KEY[id])
}

/**
 * Evaluasi satu jawaban terhadap kunci.
 * - single answer (multiple_choice / true_false) : cocok persis.
 * - multiple_select : himpunan jawaban harus sama persis dengan kunci.
 */
function evaluate(id, userAnswer) {
  if (isEmpty(userAnswer)) return false

  const correct = ANSWER_KEY[id]
  if (Array.isArray(correct)) {
    const correctSet = new Set(correct)
    const userSet = new Set(userAnswer)
    if (userSet.size !== correctSet.size) return false
    for (const ans of userSet) {
      if (!correctSet.has(ans)) return false
    }
    return true
  }

  return userAnswer === correct
}

/**
 * Hitung skor keseluruhan (berbasis poin).
 * @param {Object} answers Map { idSoal: jawaban } — id yang tidak dikenal diabaikan.
 * @returns {{ skor: number, total: number, persentase: number, correctCount: number, detail: Array }}
 *   skor = jumlah poin soal yang benar (maks 300)
 *   detail: [{ id, userAnswer, isCorrect, correct, points }] — `correct` hanya
 *   dikirim setelah submit (untuk fitur review jawaban di halaman hasil).
 */
export function scoreTest(answers = {}) {
  let skor = 0
  let correctCount = 0

  const detail = Object.keys(ANSWER_KEY).map((idStr) => {
    const id = Number(idStr)
    const userAnswer = answers[id]
    const isCorrect = evaluate(id, userAnswer)
    const points = QUESTION_POINTS[id] ?? 1
    if (isCorrect) {
      skor += points
      correctCount += 1
    }
    return { id, userAnswer: userAnswer ?? null, isCorrect, correct: ANSWER_KEY[id], points }
  })

  const persentase = TOTAL === 0 ? 0 : Math.round((skor / TOTAL) * 100)

  return { skor, total: TOTAL, persentase, correctCount, detail }
}
