/**
 * Validasi form identitas (FASE 1).
 * @returns {{ nama: string|null, tingkat: string|null, kelas: string|null }} objek error per field (null = valid)
 */
export function validateIdentity({ nama = '', tingkat = '', kelas = '' }) {
  const errors = { nama: null, tingkat: null, kelas: null }

  if (!nama.trim()) {
    errors.nama = 'Nama lengkap wajib diisi.'
  } else if (nama.trim().length < 3) {
    errors.nama = 'Nama minimal 3 karakter.'
  }

  if (!tingkat) {
    errors.tingkat = 'Silakan pilih tingkat kelas (X / XI) terlebih dahulu.'
  }

  if (!kelas) {
    errors.kelas = 'Silakan pilih nama kelas terlebih dahulu.'
  }

  return errors
}
