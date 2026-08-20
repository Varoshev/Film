import { NextResponse } from 'next/server'

const genreMap = {
  'боевик':'28','приключения':'12','анимация':'16','комедия':'35','криминал':'80',
  'документальный':'99','драма':'18','семейный':'10751','фэнтези':'14','история':'36',
  'ужасы':'27','музыка':'10402','детектив':'9648','мелодрама':'10749','фантастика':'878',
  'телевизионный фильм':'10770','триллер':'53','военный':'10752','вестерн':'37'
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const genre = searchParams.get('genre')?.toLowerCase()
  const token = process.env.TMDB_ACCESS_TOKEN
  if (!token) return NextResponse.json({error:'TMDB_ACCESS_TOKEN не настроен.'},{status:500})
  const url = new URL('https://api.themoviedb.org/3/discover/movie')
  if (genreMap[genre]) url.searchParams.set('with_genres', genreMap[genre])
  url.searchParams.set('language','ru-RU')
  url.searchParams.set('sort_by','vote_average.desc')
  url.searchParams.set('vote_count.gte','300')
  const response = await fetch(url,{headers:{Authorization:`Bearer ${token}`,accept:'application/json'},next:{revalidate:600}})
  if (!response.ok) return NextResponse.json({error:'TMDB ошибка'},{status:response.status})
  return NextResponse.json(await response.json())
}
