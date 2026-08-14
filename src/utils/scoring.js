/**
 * Evaluasi satu jawaban terhadap kunci.
 * - multiple_choice / true_false : cocok persis.
 * - multiple_select : himpunan jawaban harus sama persis dengan kunci.
 */
function evaluate(question, userAnswer) {
  const isEmpty =
    userAnswer == null ||
    userAnswer === '' ||
    (Array.isArray(userAnswer) && userAnswer.length === 0)

  if (isEmpty) return false

  if (question.type === 'multiple_select') {
    const correctSet = new Set(question.correct)
    const userSet = new Set(userAnswer)
    if (userSet.size !== correctSet.size) return false
    for (const ans of userSet) {
      if (!correctSet.has(ans)) return false
    }
    return true
  }

  return userAnswer === question.correct
}

/**
 * Hitung skor keseluruhan tes.
 * @param {Array}  questions Bank soal.
 * @param {Object} answers   Map { idSoal: jawaban }.
 * @returns {{ correct: number, total: number, percentage: number, detail: Array }}
 */
export function scoreTest(questions, answers) {
  let correct = 0

  const detail = questions.map((question) => {
    const userAnswer = answers[question.id]
    const isCorrect = evaluate(question, userAnswer)
    if (isCorrect) correct += 1
    return { ...question, userAnswer, isCorrect }
  })

  const total = questions.length
  const percentage = total === 0 ? 0 : Math.round((correct / total) * 100)

  return { correct, total, percentage, detail }
}
