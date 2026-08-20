'use client'
import {useEffect,useState} from 'react'
import {createClient} from '../../../lib/supabase/client'

export default function CollectionClient({id}){
 const [collection,setCollection]=useState(null),[items,setItems]=useState([]),[loading,setLoading]=useState(true)
 useEffect(()=>{(async()=>{const sb=createClient();const {data:c}=await sb.from('collections').select('id,name,description,is_public,user_id,profiles(username,display_name)').eq('id',id).maybeSingle();if(!c){setLoading(false);return}setCollection(c);const {data:i}=await sb.from('collection_items').select('movie_id,position,movies(id,title,poster_path,release_date,external_rating)').eq('collection_id',id).order('position');setItems(i||[]);setLoading(false)})()},[id])
 if(loading)return <main className="page-shell"><div className="empty glass">Загрузка коллекции...</div></main>
 if(!collection)return <main className="page-shell"><div className="empty glass">Коллекция не найдена.</div></main>
 return <main className="page-shell"><button className="back-btn" onClick={()=>history.back()}>← Назад</button><header className="collection-page-head glass"><span className="eyebrow">КОЛЛЕКЦИЯ</span><h1>{collection.name}</h1><p>{collection.description||'Без описания'}</p><small>Автор: @{collection.profiles?.username||'user'} · {collection.is_public?'Публичная':'Приватная'}</small></header><section className="page-section"><h2>🎬 Фильмы · {items.length}</h2>{items.length?<div className="movie-grid">{items.map(x=><a className="poster-card glass" href={`/movie/${x.movies.id}`} key={x.movie_id}>{x.movies.poster_path?<img src={`https://image.tmdb.org/t/p/w342${x.movies.poster_path}`} alt=""/>:<div className="no-poster">🎬</div>}<b>{x.movies.title}</b><span>{x.movies.release_date?.slice(0,4)||''} · ★ {(x.movies.external_rating||0).toFixed(1)}</span></a>)}</div>:<div className="empty glass">В коллекции пока нет фильмов.</div>}</section></main>
}
