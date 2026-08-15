/**
 * Token sesi tes — stateless (HMAC-SHA256), aman di lingkungan serverless
 * karena tidak butuh penyimpanan bersama antar instance.
 *
 * Alur: siswa memulai tes → frontend POST /api/test-session → dapat token →
 * token wajib dibawa saat submit. Mencegah skor/baris palsu dikirim langsung
 * ke API tanpa melalui aplikasi.
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SESSION_TTL_MS = 3 * 60 * 60 * 1000 // 3 jam (durasi tes 60 menit + toleransi)

function secret() {
  // Prioritas: env (Vercel) → config.json scoreSecret (lokal) → fallback dev
  if (process.env.ENCASA_SCORE_SECRET) return process.env.ENCASA_SCORE_SECRET
  try {
    const config = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', 'config.json'), 'utf-8')
    )
    if (config.scoreSecret) return config.scoreSecret
  } catch {
    /* config.json tidak ada / rusak → lanjut ke fallback */
  }
  return 'encasa-dev-secret-change-me'
}

const b64url = (buf) => Buffer.from(buf).toString('base64url')

function sign(payload) {
  return crypto.createHmac('sha256', secret()).update(payload).digest('base64url')
}

/** Terbitkan token untuk satu sesi tes. */
export function issueToken(kelas) {
  const payload = b64url(
    JSON.stringify({ kelas: kelas.trim(), exp: Date.now() + SESSION_TTL_MS })
  )
  return `${payload}.${sign(payload)}`
}

/**
 * Verifikasi token.
 * @returns {{ ok: true, kelas: string } | { ok: false, reason: string }}
 */
export function verifyToken(token, expectedKelas) {
  if (typeof token !== 'string' || !token.includes('.')) {
    return { ok: false, reason: 'invalid_token' }
  }
  const [payload, sig] = token.split('.')
  const expected = sign(payload)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, reason: 'invalid_token' }
  }

  let data
  try {
    data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'))
  } catch {
    return { ok: false, reason: 'invalid_token' }
  }

  if (typeof data.exp !== 'number' || data.exp < Date.now()) {
    return { ok: false, reason: 'token_expired' }
  }
  if (typeof expectedKelas === 'string' && data.kelas !== expectedKelas.trim()) {
    return { ok: false, reason: 'token_kelas_mismatch' }
  }

  return { ok: true, kelas: data.kelas }
}
