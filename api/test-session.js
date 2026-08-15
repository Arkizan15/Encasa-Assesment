/**
 * /api/test-session — Vercel Serverless Function.
 *
 * Terbitkan token sesi tes (HMAC, stateless). Dipanggil saat siswa mulai tes;
 * token ini wajib dibawa saat submit ke /api/submit-score.
 *
 * Body: { kelas: "X AKL 1" }
 * Respon: { ok: true, token, expiresInMs }
 */
import { issueToken } from '../lib/session.js'
import { isValidKelas } from '../lib/validation.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, reason: 'method_not_allowed' })
    return
  }

  let body = {}
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    res.status(400).json({ ok: false, reason: 'invalid_json' })
    return
  }

  const { kelas } = body
  if (!isValidKelas(kelas)) {
    res.status(400).json({ ok: false, reason: 'invalid_kelas' })
    return
  }

  const token = issueToken(kelas)
  res.status(200).json({ ok: true, token, expiresInMs: 3 * 60 * 60 * 1000 })
}
