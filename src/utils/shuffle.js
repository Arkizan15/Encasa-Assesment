/**
 * Acak deterministik (seeded) — urutan soal & opsi berbeda tiap siswa,
 * tetapi STABIL untuk satu sesi (seed tersimpan di localStorage, jadi
 * tidak berubah saat halaman di-refresh).
 *
 * Jawaban disimpan sebagai TEKS opsi (bukan indeks), jadi pengacakan
 * tidak memengaruhi penilaian.
 */

/** PRNG 32-bit (mulberry32) — cepat & deterministik untuk seed integer. */
export function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Fisher–Yates shuffle deterministik. Tidak mengubah array asli. */
export function seededShuffle(arr, seed) {
  const rng = mulberry32(seed)
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/** Seed acak untuk sesi baru. */
export function randomSeed() {
  return Math.floor(Math.random() * 2 ** 31)
}
