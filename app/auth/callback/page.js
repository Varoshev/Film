'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [message, setMessage] = useState('Подтверждаем почту…')

  useEffect(() => {
    let cancelled = false

    async function finishAuth() {
      const params = new URLSearchParams(window.location.search)
      const errorCode = params.get('error_code')
      const errorDescription = params.get('error_description')
      const code = params.get('code')

      if (errorCode || errorDescription) {
        const raw = errorDescription || errorCode || 'Не удалось подтвердить почту.'
        let text = raw
        try { text = decodeURIComponent(raw.replace(/\+/g, ' ')) } catch {}
        if (!cancelled) {
          setMessage(text)
          setTimeout(() => router.replace(`/?auth=error&reason=${encodeURIComponent(text)}`), 1200)
        }
        return
      }

      if (!code) {
        if (!cancelled) {
          setMessage('В ссылке подтверждения отсутствует код.')
          setTimeout(() => router.replace('/?auth=error&reason=missing_code'), 1200)
        }
        return
      }

      const supabase = createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        if (!cancelled) {
          setMessage(error.message)
          setTimeout(() => router.replace(`/?auth=error&reason=${encodeURIComponent(error.message)}`), 1400)
        }
        return
      }

      if (!cancelled) {
        setMessage('Почта подтверждена. Открываем Film…')
        router.replace('/')
        router.refresh()
      }
    }

    finishAuth()
    return () => { cancelled = true }
  }, [router])

  return (
    <main style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#07070b',color:'#fff',padding:'24px'}}>
      <section style={{maxWidth:520,width:'100%',padding:'32px',border:'1px solid rgba(255,255,255,.12)',borderRadius:20,background:'rgba(20,20,30,.85)',textAlign:'center'}}>
        <div style={{fontSize:28,fontWeight:800,marginBottom:16}}>Film</div>
        <p style={{opacity:.8}}>{message}</p>
      </section>
    </main>
  )
}
