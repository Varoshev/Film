import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  const token = process.env.TMDB_ACCESS_TOKEN
  if (!token) return NextResponse.json({ error: 'TMDB_ACCESS_TOKEN не настроен.' }, { status: 500 })

  const { id } = await params
  const url = new URL(`https://api.themoviedb.org/3/movie/${id}`)
  url.searchParams.set('language', 'ru-RU')
  url.searchParams.set('append_to_response', 'credits,videos,images')

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, accept: 'application/json' },
    next: { revalidate: 300 }
  })

  if (!response.ok) return NextResponse.json({ error: 'Фильм не найден' }, { status: response.status })
  return NextResponse.json(await response.json())
}
