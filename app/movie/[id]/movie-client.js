'use client'
import { useEffect,useState } from 'react'
import { createClient } from '../../../lib/supabase/client'

export default function MovieClient({tmdbId}) {
 const [movie,setMovie]=useState(null),[loading,setLoading]=useState(true),[status,setStatus]=useState('planned'),[rating,setRating]=useState(''),[review,setReview]=useState(''),[favorite,setFavorite]=useState(false),[message,setMessage]=useState(''),[reviews,setReviews]=useState([])
 useEffect(()=>{(async()=>{
  const r=await fetch(`/api/tmdb/movie/${tmdbId}`); const m=await r.json(); setMovie(m); setLoading(false)
  const sb=createClient(); const {data:{user}}=await sb.auth.getUser()
  if(!user||!m?.id)return
  const {data:mr}=await sb.from('movies').select('id').eq('tmdb_id',m.id).maybeSingle()
  if(!mr)return
  const {data:mine}=await sb.from('user_media').select('status,rating,review,is_favorite').eq('user_id',user.id).eq('movie_id',mr.id).maybeSingle()
  if(mine){setStatus(mine.status);setRating(mine.rating??'');setReview(mine.review??'');setFavorite(mine.is_favorite)}
  const {data:rv}=await sb.from('user_media').select('rating,review,profiles(username,display_name)').eq('movie_id',mr.id).not('review','is',null).order('updated_at',{ascending:false}).limit(20)
  setReviews(rv||[])
 })()},[tmdbId])
 async function save(){
  const sb=createClient();const {data:{user}}=await sb.auth.getUser()
  if(!user){setMessage('Войдите в аккаунт.');return}
  const {data:m,error:e}=await sb.from('movies').upsert({tmdb_id:movie.id,media_type:'movie',title:movie.title,original_title:movie.original_title,overview:movie.overview,poster_path:movie.poster_path,backdrop_path:movie.backdrop_path,release_date:movie.release_date||null,genres:movie.genres||[],runtime_minutes:movie.runtime||null,external_rating:movie.vote_average||null,updated_at:new Date().toISOString()},{onConflict:'tmdb_id'}).select('id').single()
  if(e){setMessage(e.message);return}
  const {error}=await sb.from('user_media').upsert({user_id:user.id,movie_id:m.id,status,rating:rating===''?null:Number(rating),review:review||null,is_favorite:favorite,watched_at:status==='watched'?new Date().toISOString():null,updated_at:new Date().toISOString()},{onConflict:'user_id,movie_id'})
  setMessage(error?error.message:'Сохранено.')
 }
 if(loading)return <main className="page-shell"><div className="empty glass">Загрузка фильма...</div></main>
 if(movie?.success===false)return <main className="page-shell"><div className="empty glass">Фильм не найден.</div></main>
 return <main className="page-shell">
  <button className="back-btn" onClick={()=>history.back()}>← Назад</button>
  <article className="movie-page glass">
   <div className="movie-cover">{movie.poster_path?<img src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt=""/>:<div className="no-poster">🎬</div>}</div>
   <div className="movie-page-info"><span className="eyebrow">ФИЛЬМ</span><h1>{movie.title}</h1><p className="muted">{movie.release_date?.slice(0,4)} · TMDB ★ {movie.vote_average?.toFixed(1)} · {movie.runtime||'—'} мин.</p><div className="chips">{(movie.genres||[]).map(g=><span key={g.id}>{g.name}</span>)}</div><p>{movie.overview||'Описание отсутствует.'}</p>
    <div className="library-form"><label>Мой статус</label><select value={status} onChange={e=>setStatus(e.target.value)}><option value="planned">🔖 В планах</option><option value="watching">👀 Смотрю</option><option value="watched">✅ Просмотрено</option><option value="on_hold">⏸ Отложено</option><option value="dropped">⛔ Брошено</option></select><label>Моя оценка: {rating||'—'}/10</label><input type="range" min="0" max="10" step=".5" value={rating||0} onChange={e=>setRating(e.target.value)}/><label>Отзыв</label><textarea value={review} onChange={e=>setReview(e.target.value)} placeholder="Твой отзыв..."/><label className="favorite-check"><input type="checkbox" checked={favorite} onChange={e=>setFavorite(e.target.checked)}/> ❤️ Избранное</label><button className="primary" onClick={save}>Сохранить</button>{message&&<div className="notice">{message}</div>}</div>
   </div>
  </article>
  <section className="page-section"><h2>Отзывы пользователей</h2>{reviews.length?reviews.map((r,i)=><div className="review glass" key={i}><b>{r.profiles?.display_name||r.profiles?.username||'Пользователь'}</b> · ⭐ {Number(r.rating).toFixed(1)}<p>{r.review}</p></div>):<div className="empty glass">Пока нет отзывов.</div>}</section>
 </main>
}
