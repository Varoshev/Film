import { NextResponse } from 'next/server'
export async function GET() {
 const token=process.env.TMDB_ACCESS_TOKEN
 if(!token)return NextResponse.json({error:'TMDB_ACCESS_TOKEN не настроен.'},{status:500})
 const url=new URL('https://api.themoviedb.org/3/movie/upcoming')
 url.searchParams.set('language','ru-RU'); url.searchParams.set('region','US')
 const r=await fetch(url,{headers:{Authorization:`Bearer ${token}`,accept:'application/json'},next:{revalidate:1800}})
 return NextResponse.json(await r.json(),{status:r.status})
}