import { NextResponse } from 'next/server'

export async function GET() {
  const token = process.env.TMDB_ACCESS_TOKEN
  if (!token) return NextResponse.json({ error: 'TMDB_ACCESS_TOKEN не настроен.' }, { status: 500 })

  const url = new URL('https://api.themoviedb.org/3/trending/all/week')
  url.searchParams.set('language', 'ru-RU')

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, accept: 'application/json' },
    next: { revalidate: 300 }
  })
  if (!response.ok) return NextResponse.json({ error: 'TMDB вернул ошибку' }, { status: response.status })
  return NextResponse.json(await response.json())
}
