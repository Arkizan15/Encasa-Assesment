/**
 * FASE 4 — Kirim hasil tes ke Google Sheets.
 *
 * Urutan percobaan:
 *   1. POST /api/submit-score (serverless / server lokal)
 *   2. Jika gagal/belum terkonfigurasi → POST langsung ke Apps Script Web App
 *      (butuh env VITE_APPS_SCRIPT_URL saat build — lihat .env.example)
 *
 * @param {Object} payload { nama, kelas, skor, total, persentase, durasi, pelanggaranTab, status }
 * @returns {Promise<{ok: boolean, reason?: string, message?: string}>}
 */
export async function submitScore(payload) {
  const directUrl = import.meta.env.VITE_APPS_SCRIPT_URL

  // 1) Lewat server /api
  try {
    const res = await fetch('/api/submit-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const contentType = res.headers.get('content-type') || ''
    const viaServer = res.status === 404 || contentType.includes('text/html')
      ? { ok: false, reason: 'not_configured' }
      : { ok: res.ok, ...(await res.json().catch(() => ({}))) }

    if (viaServer.ok) return viaServer

    // 2) Fallback langsung ke Apps Script (tanpa server)
    if (directUrl) {
      const direct = await fetch(directUrl, {
        method: 'POST',
        // text/plain → hindari CORS preflight
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
      })
      const data = await direct.json().catch(() => ({}))
      if (data.ok) {
        return { ok: true, reason: 'saved', message: 'Hasil tes tersimpan ke Google Sheets.' }
      }
      return { ok: false, reason: 'error', message: data.error || 'Apps Script menolak permintaan.' }
    }

    return viaServer
  } catch (err) {
    // Jaringan error pada /api → coba langsung Apps Script
    if (directUrl) {
      const direct = await fetch(directUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
      })
      const data = await direct.json().catch(() => ({}))
      if (data.ok) return { ok: true, reason: 'saved', message: 'Hasil tes tersimpan ke Google Sheets.' }
      return { ok: false, reason: 'error', message: data.error || 'Apps Script menolak permintaan.' }
    }
    return { ok: false, reason: 'network_error', message: err.message }
  }
}
