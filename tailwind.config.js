/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Humanis + ramah (dari Jakarta!) untuk body/UI
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Serif display ekspresif (gaya editorial) untuk judul & angka besar
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      colors: {
        // Warna sekunder / brand — biru #1E70DE (teks yang di-highlight/diwarnai)
        brand: {
          50: '#eef4fd',
          100: '#dbe9fc',
          200: '#a9c9f8',
          300: '#6e9ef0',
          400: '#3f83ea',
          500: '#1E70DE',
          600: '#1962c6',
          700: '#1753a8',
          800: '#164387',
          900: '#14376e',
        },
        // Aksen CTA — amber #F59E0B (tombol utama / highlight editorial)
        accent: {
          DEFAULT: '#F59E0B',
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#F59E0B',
          600: '#d97706',
          700: '#b45309',
        },
      },
      boxShadow: {
        card: '0 4px 20px rgba(15, 23, 42, 0.08)',
        soft: '0 2px 8px rgba(15, 23, 42, 0.06)',
      },
    },
  },
  plugins: [],
}
