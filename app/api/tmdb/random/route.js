import { NextResponse } from 'next/server'
export async function GET() {
 const token=process.env.TMDB_ACCESS_TOKEN
 if(!token)return NextResponse.json({error:'TMDB_ACCESS_TOKEN не настроен.'},{status:500})
 const page=Math.floor(Math.random()*20)+1
 const url=new URL('https://api.themoviedb.org/3/discover/movie')
 url.searchParams.set('language','ru-RU'); url.searchParams.set('sort_by','popularity.desc'); url.searchParams.set('page',String(page)); url.searchParams.set('vote_count.gte','100')
 const r=await fetch(url,{headers:{Authorization:`Bearer ${token}`,accept:'application/json'},next:{revalidate:60}})
 const d=await r.json(); const arr=d.results||[]
 return NextResponse.json(arr.length ? arr[Math.floor(Math.random()*arr.length)] : {})
}