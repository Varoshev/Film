import MovieClient from './movie-client'

export default async function MoviePage({ params }) {
  const { id } = await params
  return <MovieClient tmdbId={id} />
}
