'use client'
import {useEffect,useState} from 'react'
import {createClient} from '../../../lib/supabase/client'

export default function PublicUserClient({username}) {
 const [user,setUser]=useState(null),[stats,setStats]=useState(null),[collections,setCollections]=useState([]),[media,setMedia]=useState([]),[activity,setActivity]=useState([]),[loading,setLoading]=useState(true)
 useEffect(()=>{(async()=>{
  const sb=createClient()
  const {data:u}=await sb.from('profiles').select('id,username,display_name,avatar_url,bio,created_at').eq('username',username).maybeSingle()
  if(!u){setLoading(false);return}
  setUser(u)
  const {data:rows}=await sb.from('user_media').select('status,rating,is_favorite,updated_at,movies(id,title,poster_path,release_date)').eq('user_id',u.id).order('updated_at',{ascending:false})
  const list=rows||[], ratings=list.map(x=>Number(x.rating)).filter(Number.isFinite)
  const {count:friends}=await sb.from('friendships').select('*',{count:'exact',head:true}).or(`requester_id.eq.${u.id},addressee_id.eq.${u.id}`).eq('status','accepted')
  const {data:cols}=await sb.from('collections').select('id,name,description,is_public').eq('user_id',u.id).eq('is_public',true).order('created_at',{ascending:false})
  const {data:act}=await sb.from('activity').select('action,metadata,created_at,movies(title),collections(name)').eq('user_id',u.id).order('created_at',{ascending:false}).limit(12)
  setMedia(list);setCollections(cols||[]);setActivity(act||[])
  setStats({watched:list.filter(x=>x.status==='watched').length,watching:list.filter(x=>x.status==='watching').length,planned:list.filter(x=>x.status==='planned').length,favorite:list.filter(x=>x.is_favorite).length,friends:friends||0,ratings:ratings.length,avg:ratings.length?ratings.reduce((a,b)=>a+b,0)/ratings.length:0})
  setLoading(false)
 })()},[username])
 if(loading)return <main className="page-shell"><div className="empty glass">Загрузка профиля...</div></main>
 if(!user)return <main className="page-shell"><div className="empty glass">Пользователь не найден.</div></main>
 return <main className="page-shell">
  <div className="profile-head glass"><div className="avatar">{(user.display_name||user.username||'?')[0].toUpperCase()}</div><div><span className="eyebrow">FILM USER</span><h1>{user.display_name||user.username}</h1><p className="muted">@{user.username}</p><p className="muted">{user.bio||'Пользователь Film'}</p></div></div>
  <div className="stats">
   <div className="stat glass"><b>{stats.watched}</b><span>🎬 Просмотрено</span></div><div className="stat glass"><b>{stats.watching}</b><span>👀 Смотрю</span></div><div className="stat glass"><b>{stats.planned}</b><span>🔖 В планах</span></div><div className="stat glass"><b>{collections.length}</b><span>📚 Коллекций</span></div><div className="stat glass"><b>{stats.friends}</b><span>👥 Друзей</span></div><div className="stat glass"><b>{stats.avg.toFixed(1)}</b><span>⭐ Средняя оценка</span></div>
  </div>
  <section className="page-section"><h2>📚 Публичные коллекции</h2>{collections.length?<div className="collection-grid">{collections.map(c=><a href={`/collection/${c.id}`} className="collection-card glass" key={c.id}><b>{c.name}</b><span>{c.description||'Подборка фильмов'}</span></a>)}</div>:<div className="empty glass">Публичных коллекций нет.</div>}</section>
  <section className="page-section"><h2>🎬 Последние фильмы</h2>{media.length?<div className="movie-grid">{media.filter(x=>x.movies).slice(0,12).map(x=><a href={`/movie/${x.movies.id}`} className="poster-card glass" key={`${x.movies.id}-${x.updated_at}`}>{x.movies.poster_path?<img src={`https://image.tmdb.org/t/p/w342${x.movies.poster_path}`} alt=""/>:<div className="no-poster">🎬</div>}<b>{x.movies.title}</b><span>{x.status} · {x.rating??'—'}/10</span></a>)}</div>:<div className="empty glass">Нет публичной истории.</div>}</section>
  <section className="page-section"><h2>📰 Активность</h2>{activity.length?activity.map((a,i)=><div className="activity-row glass" key={i}><b>{activityLabel(a.action)}</b><span>{a.movies?.title||a.collections?.name||''}</span><small>{new Date(a.created_at).toLocaleDateString('ru-RU')}</small></div>):<div className="empty glass">Нет активности.</div>}</section>
 </main>
}
function activityLabel(action){return ({added_to_library:'Добавил фильм в библиотеку',rated_movie:'Оценил фильм',reviewed_movie:'Оставил отзыв',changed_status:'Изменил статус фильма',created_collection:'Создал коллекцию',liked_collection:'Поставил лайк коллекции'})[action]||action}
