/**
 * Server lokal untuk menguji integrasi Google Sheets tanpa deploy Vercel.
 * 1. npm run build
 * 2. npm run serve   → http://localhost:8787
 *
 * Melayani: file statis dari /dist + endpoint /api/submit-score.
 */
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import submitScore from './api/submit-score.js'
import testSession from './api/test-session.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.join(__dirname, 'dist')
const PORT = process.env.PORT || 8787

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', (c) => (data += c))
    req.on('end', () => resolve(data))
  })
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)

  // ── API (adaptasi res Node → style Vercel/Express) ──
  if (url.pathname === '/api/submit-score' || url.pathname === '/api/test-session') {
    req.body = await readBody(req)
    const expressRes = {
      status(code) {
        res.statusCode = code
        return {
          json: (data) => {
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(data))
          },
        }
      },
    }
    const handler = url.pathname === '/api/test-session' ? testSession : submitScore
    await handler(req, expressRes)
    return
  }

  // ── Static (SPA fallback ke index.html) ──
  let filePath = path.join(DIST, decodeURIComponent(url.pathname))
  if (!filePath.startsWith(DIST) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST, 'index.html')
  }
  const ext = path.extname(filePath)
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
  fs.createReadStream(filePath).pipe(res)
})

server.listen(PORT, () => {
  console.log(`✓ Encasa Grouping berjalan di http://localhost:${PORT}`)
  console.log(`  API: http://localhost:${PORT}/api/submit-score`)
})
