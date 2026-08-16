/**
 * Ornamen maskot Encasa — gambar dari /public/mascot.
 *
 *  - <MascotHead /> : lingkaran kecil berisi kepala maskot (crop bagian atas),
 *    dipakai di header TestEngine & pojok formulir.
 *  - <MascotFull /> : gambar maskot utuh dengan drop-shadow halus,
 *    dipakai di LobbyScreen & ResultScreen.
 *
 * Props:
 *  - variant : 'happy' | 'standing' | 'talking' | 'angry' (default 'happy' / 'standing')
 *  - className : kelas tambahan
 *  - size (MascotHead) : 'sm' | 'md' | 'lg' — ukuran lingkaran
 */

const HEAD_VARIANTS = {
  happy: 'mascot happy.png',
  standing: 'mascot standing.png',
  talking: 'mascot talking.png',
  angry: 'mascot angry.png',
}

const FULL_VARIANTS = {
  happy: 'mascot happy.png',
  standing: 'mascot standing.png',
  talking: 'mascot talking.png',
  angry: 'mascot angry.png',
}

const HEAD_SIZE = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
}

const enc = (name) => `/mascot/${encodeURIComponent(name)}`

export function MascotHead({ variant = 'happy', size = 'md', className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 overflow-hidden rounded-full border-2 border-white bg-brand-100 shadow-soft ${HEAD_SIZE[size]} ${className}`}
    >
      <img
        src={enc(HEAD_VARIANTS[variant] ?? HEAD_VARIANTS.happy)}
        alt=""
        draggable={false}
        className="h-full w-full object-cover object-top"
      />
    </span>
  )
}

export function MascotFull({ variant = 'standing', className = '', imgClassName = '' }) {
  return (
    <img
      src={enc(FULL_VARIANTS[variant] ?? FULL_VARIANTS.standing)}
      alt="Maskot Encasa"
      draggable={false}
      className={`pointer-events-none select-none object-contain drop-shadow-[0_10px_20px_rgba(15,23,42,0.18)] ${className}`}
    />
  )
}
