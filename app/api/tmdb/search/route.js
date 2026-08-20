import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')?.trim()
  const page = searchParams.get('page') || '1'

  if (!query) return NextResponse.json({ results: [] })

  const token = process.env.TMDB_ACCESS_TOKEN
  if (!token) return NextResponse.json(
    { error: 'TMDB_ACCESS_TOKEN не настроен. Добавь его в .env.local.' },
    { status: 500 }
  )

  const url = new URL('https://api.themoviedb.org/3/search/multi')
  url.searchParams.set('query', query)
  url.searchParams.set('language', 'ru-RU')
  url.searchParams.set('include_adult', 'false')
  url.searchParams.set('page', page)

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      accept: 'application/json'
    },
    next: { revalidate: 60 }
  })

  if (!response.ok) {
    return NextResponse.json({ error: 'TMDB вернул ошибку', status: response.status }, { status: response.status })
  }

  const data = await response.json()
  return NextResponse.json(data)
}
