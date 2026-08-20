import './globals.css'

export const metadata = {
  title: 'Film',
  description: 'Film 3.0 — социальный каталог фильмов'
}

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}
