/**
 * Kirim JAWABAN tes ke server — skor dihitung server-side (kunci jawaban
 * tidak pernah dikirim ke browser).
 *
 * Alur:
 *   1. POST /api/test-session { kelas } → dapat token sesi (HMAC).
 *   2. POST /api/submit-score { nama, kelas, answers, ..., token } → server
 *      menghitung skor, menyimpan ke Google Sheets, lalu mengembalikan skor
 *      + detail review.
 *
 * @param {Object} payload { nama, kelas, answers, timeUsed, tabSwitchCount, status }
 * @returns {Promise<Object>} { ok, skor?, total?, persentase?, detail?, save?, reason?, message? }
 */
export async function submitScore(payload) {
  let token = null

  // 1) Minta token sesi tes
  try {
    const sessionRes = await fetch('/api/test-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kelas: payload.kelas }),
    })
    const session = await sessionRes.json().catch(() => ({}))
    if (session.ok && session.token) token = session.token
  } catch {
    /* token gagal → submit tetap dicoba, server akan menolak tanpa token */
  }

  // 2) Kirim jawaban + token
  try {
    const res = await fetch('/api/submit-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, token }),
    })

    const data = await res.json().catch(() => ({}))
    if (data.ok) return data

    // Kasus khusus: API tidak ditemukan / belum ter-deploy (404 / respon HTML)
    const isHtml = (res.headers.get('content-type') || '').includes('text/html')
    if (res.status === 404 || isHtml) {
      return {
        ok: false,
        reason: 'not_configured',
        message:
          'Server penilaian tidak ditemukan. Jalankan lewat "npm run serve" (bukan "npm run dev") atau deploy ke Vercel dengan folder /api ikut ter-deploy.',
      }
    }
    return data
  } catch (err) {
    return { ok: false, reason: 'network_error', message: err.message }
  }
}
