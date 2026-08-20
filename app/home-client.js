'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../lib/supabase/client'

const tabs = [
  ['home', '🏠 Главная'],
  ['browse', '🔎 Обзор'],
  ['bookmarks', '🔖 Закладки'],
  ['profile', '👤 Профиль'],
  ['friends', '👥 Друзья']
]

export default function HomeClient({ user, profile }) {
  const [tab, setTab] = useState('home')
  const [authMode, setAuthMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState(profile?.username || '')
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [message, setMessage] = useState('')
  const [canResend, setCanResend] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const hash = window.location.hash
    const query = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(hash.replace(/^#\?/, '').replace(/^#/, ''))
    const errorCode = hashParams.get('error_code')
    const errorDescription = hashParams.get('error_description')
    const authReason = query.get('reason')

    if (errorCode || errorDescription || authReason) {
      const raw = errorDescription || authReason || 'Ошибка подтверждения почты.'
      let text = raw
      try { text = decodeURIComponent(raw.replace(/\+/g, ' ')) } catch {}
      setMessage(text)
      setCanResend(true)
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  async function auth() {
    const supabase = createClient()
    setMessage('')
    const result = authMode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username, display_name: displayName },
            emailRedirectTo: `${window.location.origin}/auth/confirm`
          }
        })

    if (result.error) {
      setMessage(result.error.message)
      setCanResend(false)
      return
    }

    if (authMode === 'login') {
      setMessage('Вход выполнен.')
      setCanResend(false)
      router.refresh()
      return
    }

    if (result.data?.session) {
      setMessage('Аккаунт создан. Вход выполнен.')
      setCanResend(false)
      router.refresh()
    } else {
      setMessage('Аккаунт создан. Подтверди почту по ссылке из письма.')
      setCanResend(true)
    }
  }

  async function resendConfirmation() {
    if (!email) {
      setMessage('Сначала введи Email.')
      return
    }
    const supabase = createClient()
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm` }
    })
    setMessage(error ? error.message : 'Новое письмо с подтверждением отправлено.')
  }

  async function saveProfile() {
    if (!user) return
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({
      username,
      display_name: displayName,
      updated_at: new Date().toISOString()
    }).eq('id', user.id)
    setMessage(error ? error.message : 'Профиль сохранён.')
  }

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    location.reload()
  }

  if (!user) {
    return (
      <main className="auth-shell">
        <section className="auth-card glass">
          <div className="logo">Film</div>
          <h1>Film 3.0</h1>
          <p className="muted">Твой социальный каталог фильмов, сериалов и аниме.</p>

          <div className="auth-switch">
            <button className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>Войти</button>
            <button className={authMode === 'signup' ? 'active' : ''} onClick={() => setAuthMode('signup')}>Регистрация</button>
          </div>

          {authMode === 'signup' && <>
            <input placeholder="Никнейм" value={username} onChange={e => setUsername(e.target.value)} />
            <input placeholder="Отображаемое имя" value={displayName} onChange={e => setDisplayName(e.target.value)} />
          </>}
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} />
          <button className="primary" onClick={auth}>{authMode === 'login' ? 'Войти' : 'Создать аккаунт'}</button>
          {message && <div className="notice">{message}</div>}
          {authMode === 'signup' && canResend && <button className="side-btn" onClick={resendConfirmation}>Отправить письмо ещё раз</button>}
        </section>
      </main>
    )
  }

  return (
    <div className="app-shell">
      <aside className="sidebar glass">
        <div className="logo">Film</div>
        <div className="side-section">Навигация</div>
        {tabs.map(([id, label]) =>
          <button key={id} className={`side-btn ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>
            {label}
          </button>
        )}
        <div className="side-section">Моя библиотека</div>
        {['❤️ Избранное', '👀 Смотрю', '🔖 В планах', '✅ Просмотрено', '⏸ Отложено', '⛔ Брошено'].map(x =>
          <button className="side-btn" key={x} onClick={() => setTab('bookmarks')}>{x}</button>
        )}
        <button className="logout" onClick={logout}>Выйти</button>
      </aside>

      <main className="content">
        <SearchBar />
        <header className="tmdb-credit">Данные каталога: TMDB</header>

        {tab === 'home' && <Home profile={profile} />}
        {tab === 'browse' && <Browse />}
        {tab === 'bookmarks' && <Bookmarks />}
        {tab === 'friends' && <Friends />}
        {tab === 'profile' && <Profile profile={profile} user={user} username={username} displayName={displayName} setUsername={setUsername} setDisplayName={setDisplayName} saveProfile={saveProfile} message={message} />}
      </main>
      <nav className="mobile-nav">
        {tabs.map(([id,label]) => <button key={id} className={tab===id?'active':''} onClick={()=>setTab(id)}><span>{label.split(' ')[0]}</span><small>{label.substring(label.indexOf(' ')+1)}</small></button>)}
      </nav>
    </div>
  )
}

function RandomMovie() {
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(false)
  async function randomize() {
    setLoading(true)
    const res = await fetch('/api/tmdb/random')
    const data = await res.json()
    setMovie(data)
    setLoading(false)
  }
  return <button className="feature glass random-feature" onClick={randomize}>
    <strong>🎲 Случайный фильм</strong>
    <span>{loading ? 'Ищем...' : movie ? `${movie.title} · ★ ${(movie.vote_average||0).toFixed(1)}` : 'Нажми — и получишь случайный фильм'}</span>
  </button>
}

function Upcoming() {
  const [items, setItems] = useState([])
  useState(() => { fetch('/api/tmdb/upcoming').then(r=>r.json()).then(d=>setItems((d.results||[]).slice(0,8))) })
  return <Section title="🗓 Скоро выйдет" subtitle="Ближайшие релизы">
    {items.length ? <div className="movie-grid">{items.map(x =>
      <a href={`/movie/${x.id}`} className="poster-card glass" key={x.id}>
        {x.poster_path ? <img src={`https://image.tmdb.org/t/p/w342${x.poster_path}`} alt="" /> : <div className="no-poster">🎬</div>}
        <b>{x.title}</b><span>{x.release_date || 'Дата уточняется'}</span>
      </a>
    )}</div> : <PlaceholderCards text="Загружаем ближайшие релизы..." />}
  </Section>
}

function Anime() {
  const [items, setItems] = useState([])
  useState(() => { fetch('/api/tmdb/anime').then(r=>r.json()).then(d=>setItems((d.results||[]).slice(0,8))) })
  return <Section title="🌸 Аниме" subtitle="Японская анимация">
    {items.length ? <div className="movie-grid">{items.map(x =>
      <a href={`/movie/${x.id}`} className="poster-card glass" key={x.id}>
        {x.poster_path ? <img src={`https://image.tmdb.org/t/p/w342${x.poster_path}`} alt="" /> : <div className="no-poster">🌸</div>}
        <b>{x.title}</b><span>★ {(x.vote_average||0).toFixed(1)}</span>
      </a>
    )}</div> : <PlaceholderCards text="Загружаем аниме..." />}
  </Section>
}

function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [libraryStatus, setLibraryStatus] = useState('planned')
  const [libraryRating, setLibraryRating] = useState('')
  const [libraryReview, setLibraryReview] = useState('')
  const [libraryFavorite, setLibraryFavorite] = useState(false)
  const [libraryMessage, setLibraryMessage] = useState('')
  const [siteRating, setSiteRating] = useState({ average: 0, count: 0 })
  const [reviews, setReviews] = useState([])
  const [collections, setCollections] = useState([])
  const [newCollection, setNewCollection] = useState('')
  const [collectionMessage, setCollectionMessage] = useState('')

  async function search() {
    if (!query.trim()) return
    setLoading(true)
    const res = await fetch(`/api/tmdb/search?query=${encodeURIComponent(query)}`)
    const data = await res.json()
    setResults(data.results || [])
    setLoading(false)
  }

  async function openItem(item) {
    if (item.media_type !== 'movie') return
    const res = await fetch(`/api/tmdb/movie/${item.id}`)
    const movie = await res.json()
    setSelected(movie)
    setLibraryMessage('')
    setLibraryStatus('planned')
    setLibraryRating('')
    setLibraryReview('')
    setLibraryFavorite(false)
    setSiteRating({ average: 0, count: 0 })
    setReviews([])
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user && movie?.id) {
      const { data: movieRow } = await supabase
        .from('movies')
        .select('id')
        .eq('tmdb_id', movie.id)
        .maybeSingle()

      const { data: myCollections } = await supabase
        .from('collections')
        .select('id,name,description,is_public')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setCollections(myCollections || [])

      if (movieRow) {
        const { data: allMedia } = await supabase
          .from('user_media')
          .select('rating,review,updated_at,user_id,profiles(username,display_name,avatar_url)')
          .eq('movie_id', movieRow.id)
          .not('rating', 'is', null)
          .order('updated_at', { ascending: false })

        const ratings = allMedia || []
        const values = ratings.map(x => Number(x.rating)).filter(Number.isFinite)
        setSiteRating({
          average: values.length ? values.reduce((a,b) => a+b, 0) / values.length : 0,
          count: values.length
        })
        setReviews(ratings.filter(x => x.review).slice(0, 10))
      }

      const { data } = await supabase
        .from('movies')
        .select('id')
        .eq('tmdb_id', movie.id)
        .maybeSingle()
      if (data) {
        const { data: saved } = await supabase
          .from('user_media')
          .select('status,rating,review,is_favorite')
          .eq('user_id', user.id)
          .eq('movie_id', data.id)
          .maybeSingle()
        if (saved) {
          setLibraryStatus(saved.status)
          setLibraryRating(saved.rating ?? '')
          setLibraryReview(saved.review ?? '')
          setLibraryFavorite(saved.is_favorite ?? false)
        }
      }
    }
  }

  async function addToCollection(collectionId) {
    if (!selected) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: movie } = await supabase
      .from('movies')
      .select('id')
      .eq('tmdb_id', selected.id)
      .maybeSingle()
    if (!movie) {
      setCollectionMessage('Сначала сохрани фильм в библиотеку.')
      return
    }
    const { error } = await supabase.from('collection_items').upsert({
      collection_id: collectionId,
      movie_id: movie.id
    }, { onConflict: 'collection_id,movie_id' })
    setCollectionMessage(error ? error.message : 'Добавлено в коллекцию.')
  }

  async function createCollection() {
    if (!newCollection.trim()) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase.from('collections').insert({
      user_id: user.id,
      name: newCollection.trim(),
      is_public: true
    }).select('id,name,description,is_public').single()
    if (error) setCollectionMessage(error.message)
    else {
      setCollections([data, ...collections])
      setNewCollection('')
      setCollectionMessage('Коллекция создана.')
    }
  }

  async function saveToLibrary() {
    if (!selected) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLibraryMessage('Сначала войдите в аккаунт.')
      return
    }

    const movieRow = {
      tmdb_id: selected.id,
      media_type: 'movie',
      title: selected.title || 'Без названия',
      original_title: selected.original_title,
      overview: selected.overview,
      poster_path: selected.poster_path,
      backdrop_path: selected.backdrop_path,
      release_date: selected.release_date || null,
      genres: selected.genres || [],
      runtime_minutes: selected.runtime || null,
      external_rating: selected.vote_average || null,
      updated_at: new Date().toISOString()
    }

    const { data: movie, error: movieError } = await supabase
      .from('movies')
      .upsert(movieRow, { onConflict: 'tmdb_id' })
      .select('id')
      .single()

    if (movieError) {
      setLibraryMessage(movieError.message)
      return
    }

    const { error } = await supabase
      .from('user_media')
      .upsert({
        user_id: user.id,
        movie_id: movie.id,
        status: libraryStatus,
        rating: libraryRating === '' ? null : Number(libraryRating),
        review: libraryReview || null,
        is_favorite: libraryFavorite,
        watched_at: libraryStatus === 'watched' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,movie_id' })

    if (!error) {
      await supabase.from('activity').insert({
        user_id: user.id,
        action: libraryReview ? 'reviewed_movie' : (libraryRating !== '' ? 'rated_movie' : 'changed_status'),
        movie_id: movie.id,
        metadata: { status: libraryStatus }
      })
    }
    setLibraryMessage(error ? error.message : 'Фильм сохранён в твою библиотеку.')
  }

  return <section className="search-area">
    <div className="topbar glass">
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && search()}
        placeholder="Поиск фильмов, сериалов и людей..."
      />
      <button className="primary" onClick={search}>{loading ? '...' : 'Поиск'}</button>
    </div>

    {results.length > 0 && <div className="search-results">
      {results.filter(x => x.media_type !== 'person').slice(0, 12).map(item =>
        <button className="movie-card glass" key={`${item.media_type}-${item.id}`} onClick={() => openItem(item)}>
          {item.poster_path
            ? <img src={`https://image.tmdb.org/t/p/w342${item.poster_path}`} alt="" />
            : <div className="no-poster">🎬</div>}
          <div className="movie-info">
            <b>{item.title || item.name}</b>
            <span>{(item.release_date || item.first_air_date || '').slice(0,4)} · {item.media_type === 'tv' ? 'Сериал' : 'Фильм'}</span>
            <small>★ {(item.vote_average || 0).toFixed(1)}</small>
          </div>
        </button>
      )}
    </div>}

    {selected && <div className="modal-backdrop" onClick={() => setSelected(null)}>
      <article className="movie-modal glass" onClick={e => e.stopPropagation()}>
        <button className="close" onClick={() => setSelected(null)}>×</button>
        <div className="movie-detail">
          {selected.poster_path && <img src={`https://image.tmdb.org/t/p/w500${selected.poster_path}`} alt="" />}
          <div>
            <span className="eyebrow">ФИЛЬМ</span>
            <h1>{selected.title}</h1>
            <p className="muted">{selected.release_date?.slice(0,4)} · TMDB ★ {selected.vote_average?.toFixed(1)} · Film ★ {siteRating.count ? siteRating.average.toFixed(1) : '—'} ({siteRating.count}) · {selected.runtime || '—'} мин.</p>
            <div className="chips">{(selected.genres || []).map(g => <span key={g.id}>{g.name}</span>)}</div>
            <p>{selected.overview || 'Описание отсутствует.'}</p>
            <div className="library-form">
              <label>Мой статус</label>
              <select value={libraryStatus} onChange={e => setLibraryStatus(e.target.value)}>
                <option value="planned">🔖 В планах</option>
                <option value="watching">👀 Смотрю</option>
                <option value="watched">✅ Просмотрено</option>
                <option value="on_hold">⏸ Отложено</option>
                <option value="dropped">⛔ Брошено</option>
              </select>
              <label>Моя оценка: {libraryRating || '—'}/10</label>
              <input type="range" min="0" max="10" step="0.5" value={libraryRating || 0} onChange={e => setLibraryRating(e.target.value)} />
              <label>Мой отзыв</label>
              <textarea value={libraryReview} onChange={e => setLibraryReview(e.target.value)} placeholder="Что думаешь о фильме?" />
              <label className="favorite-check">
                <input type="checkbox" checked={libraryFavorite} onChange={e => setLibraryFavorite(e.target.checked)} />
                ❤️ Добавить в избранное
              </label>
              <button className="primary" onClick={saveToLibrary}>＋ Сохранить в библиотеку</button>
              {libraryMessage && <div className="notice">{libraryMessage}</div>}
            </div>
            <div className="collection-box">
              <h3>📚 Добавить в коллекцию</h3>
              <div className="collection-create">
                <input value={newCollection} onChange={e => setNewCollection(e.target.value)} placeholder="Новая коллекция..." />
                <button onClick={createCollection}>Создать</button>
              </div>
              <div className="collection-list">
                {collections.map(c => <button key={c.id} onClick={() => addToCollection(c.id)}>＋ {c.name}</button>)}
              </div>
              {collectionMessage && <div className="notice">{collectionMessage}</div>}
            </div>
            <div className="reviews">
              <h3>Отзывы пользователей</h3>
              {reviews.length ? reviews.map((r, i) =>
                <article className="review glass" key={`${r.user_id}-${i}`}>
                  <div><b>{r.profiles?.display_name || r.profiles?.username || 'Пользователь'}</b><span> · ⭐ {Number(r.rating).toFixed(1)}</span></div>
                  <p>{r.review}</p>
                </article>
              ) : <p className="muted">Пока нет отзывов. Стань первым.</p>}
            </div>
          </div>
        </div>
      </article>
    </div>}
  </section>
}

function Home({ profile }) {
  return <section>
    <div className="hero">
      <span className="eyebrow">FILM 3.0</span>
      <h1>Привет, {profile?.display_name || profile?.username || 'киноман'} 👋</h1>
      <p>Персональная лента, активность друзей и рекомендации.</p>
    </div>
    <FriendFeed />
    <Recommendations />
    <Trending />
    <Section title="🆕 Новинки">
      <PlaceholderCards text="Подключим календарь релизов TMDB следующим модулем." />
    </Section>
  </section>
}

function FriendFeed() {
  const [feed, setFeed] = useState([])
  useState(() => {
    ;(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: friends } = await supabase.from('friendships')
        .select('requester_id,addressee_id')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status','accepted')
      const ids = (friends || []).map(f => f.requester_id === user.id ? f.addressee_id : f.requester_id)
      if (!ids.length) return
      const { data } = await supabase.from('activity')
        .select('action,metadata,created_at,user_id,movies(title,poster_path),collections(name),profiles(username,display_name)')
        .in('user_id', ids)
        .order('created_at',{ascending:false})
        .limit(12)
      setFeed(data || [])
    })()
  })
  return <Section title="📰 От друзей" subtitle="Что смотрят и оценивают твои друзья">
    {feed.length ? <div className="feed-list">{feed.map((a,i) =>
      <div className="feed-row glass" key={`${a.created_at}-${i}`}>
        <div className="avatar small">{(a.profiles?.display_name || a.profiles?.username || '?')[0]?.toUpperCase()}</div>
        <div className="feed-main">
          <b>{a.profiles?.display_name || a.profiles?.username || 'Пользователь'}</b>
          <span>{activityLabel(a.action)} {a.movies?.title ? `«${a.movies.title}»` : a.collections?.name ? `«${a.collections.name}»` : ''}</span>
        </div>
        <small>{new Date(a.created_at).toLocaleDateString('ru-RU')}</small>
      </div>
    )}</div> : <div className="empty glass">👥<br/><br/>Добавь друзей — здесь появится их активность.</div>}
  </Section>
}

function Recommendations() {
  const [items, setItems] = useState([])
  const [reason, setReason] = useState('')

  useState(() => {
    ;(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: media } = await supabase.from('user_media')
        .select('rating,status,movies(genres)')
        .eq('user_id', user.id)
        .not('rating','is',null)
        .order('rating',{ascending:false})
        .limit(10)
      const genres = {}
      ;(media || []).forEach(x => (x.movies?.genres || []).forEach(g => {
        const name = typeof g === 'string' ? g : g.name
        if (name) genres[name] = (genres[name] || 0) + Number(x.rating || 0)
      }))
      const top = Object.entries(genres).sort((a,b)=>b[1]-a[1])[0]?.[0]
      if (!top) {
        setReason('Поставь несколько оценок — и рекомендации станут персональными.')
        return
      }
      setReason(`Потому что тебе нравится жанр «${top}»`)
      const res = await fetch(`/api/tmdb/discover?genre=${encodeURIComponent(top)}`)
      const data = await res.json()
      setItems((data.results || []).slice(0,8))
    })()
  })

  return <Section title="🎯 Для вас" subtitle={reason}>
    {items.length ? <div className="movie-grid">{items.map(x =>
      <a href={`/movie/${x.id}`} className="poster-card glass" key={x.id}>
        {x.poster_path ? <img src={`https://image.tmdb.org/t/p/w342${x.poster_path}`} alt="" /> : <div className="no-poster">🎬</div>}
        <b>{x.title}</b><span>★ {(x.vote_average || 0).toFixed(1)}</span>
      </a>
    )}</div> : <PlaceholderCards text={reason || 'Подбираем фильмы...'} />}
  </Section>
}


function Browse() {
  const [collections, setCollections] = useState([])
  useState(() => {
    createClient().from('collections').select('id,name,description,user_id,profiles(username,display_name)').eq('is_public',true).order('created_at',{ascending:false}).limit(18).then(({data}) => setCollections(data || []))
  })
  return <section>
    <div className="hero"><span className="eyebrow">ОБЗОР</span><h1>Найди что посмотреть</h1><p>Популярное, лучшие оценки, коллекции и случайный фильм.</p></div>
    <div className="feature-grid">
      <button className="feature glass"><strong>🔥 Популярное</strong><span>Тренды TMDB</span></button>
      <button className="feature glass"><strong>⭐ Лучшие оценки</strong><span>Высоко оценённые фильмы</span></button>
      <RandomMovie />
      <button className="feature glass"><strong>📚 Коллекции</strong><span>Подборки пользователей</span></button>
      <button className="feature glass"><strong>🎭 По жанрам</strong><span>Фильмы по любимым жанрам</span></button>
      <button className="feature glass"><strong>🌸 Аниме</strong><span>Анимация и японские тайтлы</span></button>
    </div>
    <Upcoming />
    <Anime />
    <Section title="📚 Коллекции пользователей" subtitle="Публичные подборки">
      {collections.length ? <div className="collection-grid">
        {collections.map(c => <div className="collection-card glass" key={c.id}>
          <b>{c.name}</b><span>{c.description || 'Подборка фильмов'}</span><small>Автор: @{c.profiles?.username || 'user'}</small>
        </div>)}
      </div> : <PlaceholderCards text="Публичных коллекций пока нет." />}
    </Section>
  </section>
}

function Bookmarks() {
  const [counts, setCounts] = useState({favorite:0,watching:0,planned:0,watched:0,on_hold:0,dropped:0})
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useState(() => {
    ;(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('user_media')
        .select('status,rating,is_favorite,movie_id,movies(title,poster_path,release_date)')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      const rows = data || []
      setCounts({
        favorite: rows.filter(x => x.is_favorite).length,
        watching: rows.filter(x => x.status === 'watching').length,
        planned: rows.filter(x => x.status === 'planned').length,
        watched: rows.filter(x => x.status === 'watched').length,
        on_hold: rows.filter(x => x.status === 'on_hold').length,
        dropped: rows.filter(x => x.status === 'dropped').length
      })
      setItems(rows.slice(0, 12))
      setLoading(false)
    })()
  })

  return <section>
    <div className="hero"><span className="eyebrow">ЗАКЛАДКИ</span><h1>Моя библиотека</h1><p>Статусы, история, избранное и личные коллекции.</p></div>
    <div className="stats">
      {[
        ['❤️ Избранное',counts.favorite],['👀 Смотрю',counts.watching],['🔖 В планах',counts.planned],
        ['✅ Просмотрено',counts.watched],['⏸ Отложено',counts.on_hold],['⛔ Брошено',counts.dropped]
      ].map(([x,n]) => <div className="stat glass" key={x}><b>{n}</b><span>{x}</span></div>)}
    </div>
    <Section title="Последние добавления">
      {loading ? <PlaceholderCards text="Загружаем библиотеку..." /> :
        items.length ? <div className="library-list">{items.map(x =>
          <div className="library-row glass" key={x.movie_id}>
            {x.movies?.poster_path ? <img src={`https://image.tmdb.org/t/p/w185${x.movies.poster_path}`} alt="" /> : <div className="mini-poster">🎬</div>}
            <div><b>{x.movies?.title}</b><span>{x.status} · {x.rating ?? '—'}/10 {x.is_favorite ? ' · ❤️' : ''}</span></div>
          </div>
        )}</div> : <PlaceholderCards text="Библиотека пока пустая. Найди фильм и добавь его." />}
    </Section>
  </section>
}

function Friends() {
  const [users, setUsers] = useState([])
  const [friends, setFriends] = useState([])
  const [incoming, setIncoming] = useState([])
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState('')

  async function loadSocial() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: rows } = await supabase
      .from('friendships')
      .select('id,status,requester_id,addressee_id,requester:profiles!friendships_requester_id_fkey(id,username,display_name,avatar_url),addressee:profiles!friendships_addressee_id_fkey(id,username,display_name,avatar_url)')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    const all = rows || []
    setFriends(all.filter(x => x.status === 'accepted').map(x => x.requester_id === user.id ? x.addressee : x.requester))
    setIncoming(all.filter(x => x.status === 'pending' && x.addressee_id === user.id))
  }

  useState(() => { loadSocial() })

  async function findUsers() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    let q = supabase.from('profiles').select('id,username,display_name,avatar_url,bio').neq('id', user.id).limit(12)
    if (query.trim()) q = q.or(`username.ilike.%${query.trim()}%,display_name.ilike.%${query.trim()}%`)
    const { data, error } = await q
    if (error) setMessage(error.message)
    else setUsers(data || [])
  }

  async function addFriend(targetId) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('friendships').upsert({
      requester_id: user.id, addressee_id: targetId, status: 'pending'
    }, { onConflict: 'requester_id,addressee_id' })
    setMessage(error ? error.message : 'Запрос отправлен.')
    loadSocial()
  }

  async function answerRequest(id, status) {
    const supabase = createClient()
    const { error } = await supabase.from('friendships').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    setMessage(error ? error.message : (status === 'accepted' ? 'Теперь вы друзья.' : 'Заявка отклонена.'))
    loadSocial()
  }

  async function removeFriend(otherId) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('friendships').delete()
      .or(`and(requester_id.eq.${user.id},addressee_id.eq.${otherId}),and(requester_id.eq.${otherId},addressee_id.eq.${user.id})`)
    loadSocial()
  }

  return <section>
    <div className="hero"><span className="eyebrow">СОЦИАЛЬНОЕ</span><h1>Друзья</h1><p>Находи пользователей, принимай заявки и управляй друзьями.</p></div>
    {message && <div className="notice">{message}</div>}

    {incoming.length > 0 && <Section title="📨 Входящие заявки">
      <div className="user-grid">
        {incoming.map(x => <div className="user-card glass" key={x.id}>
          <div className="avatar small">{(x.requester?.display_name || x.requester?.username || '?')[0]?.toUpperCase()}</div>
          <div><b>{x.requester?.display_name || x.requester?.username}</b><span>@{x.requester?.username}</span></div>
          <button onClick={() => answerRequest(x.id, 'accepted')}>✓</button>
          <button onClick={() => answerRequest(x.id, 'declined')}>×</button>
        </div>)}
      </div>
    </Section>}

    <Section title="👥 Мои друзья">
      {friends.length ? <div className="user-grid">
        {friends.map(u => <div className="user-card glass" key={u.id}>
          <div className="avatar small">{(u.display_name || u.username || '?')[0]?.toUpperCase()}</div>
          <div><b>{u.display_name || u.username}</b><span>@{u.username}</span></div>
          <button onClick={() => removeFriend(u.id)}>Удалить</button>
        </div>)}
      </div> : <div className="empty glass">👥<br/><br/>Пока нет друзей.</div>}
    </Section>

    <Section title="🔎 Найти людей">
      <div className="topbar glass">
        <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && findUsers()} placeholder="Никнейм или имя..." />
        <button className="primary" onClick={findUsers}>Найти</button>
      </div>
      <div className="user-grid">
        {users.map(u => <div className="user-card glass" key={u.id}>
          <div className="avatar small">{(u.display_name || u.username || '?')[0]?.toUpperCase()}</div>
          <div><b>{u.display_name || u.username}</b><span>@{u.username}</span></div>
          <button onClick={() => addFriend(u.id)}>＋ Друг</button>
        </div>)}
      </div>
    </Section>
  </section>
}


function Profile({ profile, user, username, displayName, setUsername, setDisplayName, saveProfile, message }) {
  const [stats, setStats] = useState({ watched:0, watching:0, planned:0, on_hold:0, dropped:0, favorite:0, collections:0, friends:0, avg:0, ratings:0 })
  const [activity, setActivity] = useState([])
  const [collections, setCollections] = useState([])

  async function loadProfile() {
    const supabase = createClient()
    const { data: media } = await supabase.from('user_media').select('status,rating,is_favorite').eq('user_id', user.id)
    const rows = media || []
    const { count: collectionCount } = await supabase.from('collections').select('*', { count:'exact', head:true }).eq('user_id', user.id)
    const { data: cols } = await supabase.from('collections').select('id,name,description,is_public').eq('user_id', user.id).order('created_at',{ascending:false})
    const { count: friends } = await supabase.from('friendships').select('*', { count:'exact', head:true }).or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`).eq('status','accepted')
    const ratings = rows.map(x => Number(x.rating)).filter(Number.isFinite)
    setStats({
      watched: rows.filter(x=>x.status==='watched').length,
      watching: rows.filter(x=>x.status==='watching').length,
      planned: rows.filter(x=>x.status==='planned').length,
      on_hold: rows.filter(x=>x.status==='on_hold').length,
      dropped: rows.filter(x=>x.status==='dropped').length,
      favorite: rows.filter(x=>x.is_favorite).length,
      collections: collectionCount || 0,
      friends: friends || 0,
      avg: ratings.length ? ratings.reduce((a,b)=>a+b,0)/ratings.length : 0,
      ratings: ratings.length
    })
    setCollections(cols || [])
    const { data: act } = await supabase.from('activity').select('action,metadata,created_at,movies(title),collections(name)').eq('user_id',user.id).order('created_at',{ascending:false}).limit(8)
    setActivity(act || [])
  }

  useState(() => { loadProfile() })

  async function toggleCollectionVisibility(id, value) {
    const supabase = createClient()
    await supabase.from('collections').update({is_public:value,updated_at:new Date().toISOString()}).eq('id',id).eq('user_id',user.id)
    loadProfile()
  }

  return <section>
    <div className="profile-head glass">
      <div className="avatar">{(displayName || username || '?')[0]?.toUpperCase()}</div>
      <div><span className="eyebrow">ПРОФИЛЬ</span><h1>{displayName || username}</h1><p className="muted">@{username}</p></div>
    </div>
    <div className="stats">
      <div className="stat glass"><b>{stats.watched}</b><span>🎬 Просмотрено</span></div>
      <div className="stat glass"><b>{stats.watching}</b><span>👀 Смотрю</span></div>
      <div className="stat glass"><b>{stats.planned}</b><span>🔖 В планах</span></div>
      <div className="stat glass"><b>{stats.collections}</b><span>📚 Коллекций</span></div>
      <div className="stat glass"><b>{stats.friends}</b><span>👥 Друзей</span></div>
      <div className="stat glass"><b>{stats.avg.toFixed(1)}</b><span>⭐ Средняя оценка ({stats.ratings})</span></div>
    </div>

    <Section title="📚 Мои коллекции">
      {collections.length ? <div className="collection-grid">
        {collections.map(c => <div className="collection-card glass" key={c.id}>
          <div><b>{c.name}</b><span>{c.description || 'Без описания'}</span></div>
          <label><input type="checkbox" checked={c.is_public} onChange={e => toggleCollectionVisibility(c.id,e.target.checked)} /> Публичная</label>
        </div>)}
      </div> : <div className="empty glass">📚<br/><br/>Создай первую коллекцию из страницы фильма.</div>}
    </Section>

    <Section title="📊 Моя статистика">
      <div className="stats">
        <div className="stat glass"><b>{stats.favorite}</b><span>❤️ Избранное</span></div>
        <div className="stat glass"><b>{stats.on_hold}</b><span>⏸ Отложено</span></div>
        <div className="stat glass"><b>{stats.dropped}</b><span>⛔ Брошено</span></div>
      </div>
    </Section>

    <Section title="📈 Динамика просмотров" subtitle="По месяцам">
      <WatchDynamics userId={user.id} />
    </Section>

    <Section title="📰 Моя активность">
      {activity.length ? activity.map((a,i) =>
        <div className="activity-row glass" key={`${a.created_at}-${i}`}>
          <b>{activityLabel(a.action)}</b>
          <span>{a.movies?.title || a.collections?.name || ''}</span>
          <small>{new Date(a.created_at).toLocaleString('ru-RU')}</small>
        </div>
      ) : <div className="empty glass">Пока нет активности.</div>}
    </Section>

    <div className="panel glass">
      <h2>Настройки профиля</h2>
      <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Никнейм" />
      <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Имя" />
      <input value={user.email || ''} disabled />
      <button className="primary" onClick={saveProfile}>Сохранить</button>
      {message && <div className="notice">{message}</div>}
    </div>
  </section>
}

function WatchDynamics({ userId }) {
  const [mode, setMode] = useState('month')
  const [points, setPoints] = useState([])
  useState(() => {
    ;(async () => {
      const supabase = createClient()
      const { data } = await supabase.from('user_media').select('status,watched_at,updated_at').eq('user_id',userId).eq('status','watched')
      const rows = data || []
      const map = {}
      rows.forEach(x => {
        const date = new Date(x.watched_at || x.updated_at)
        const key = mode === 'week'
          ? date.toLocaleDateString('ru-RU',{weekday:'short'})
          : date.toLocaleDateString('ru-RU',{month:'short'})
        map[key] = (map[key] || 0) + 1
      })
      setPoints(Object.entries(map).slice(-8))
    })()
  })

  const max = Math.max(1, ...points.map(x=>x[1]))
  return <div className="chart glass">
    <div className="chart-switch">
      <button className={mode==='month'?'active':''} onClick={()=>setMode('month')}>Месяцы</button>
      <button className={mode==='week'?'active':''} onClick={()=>setMode('week')}>Неделя</button>
    </div>
    <div className="bars">
      {points.length ? points.map(([label,value]) =>
        <div className="bar-col" key={label}><div className="bar" style={{height:`${Math.max(8,value/max*150)}px`}}></div><span>{label}</span><b>{value}</b></div>
      ) : <div className="muted">Пока недостаточно истории просмотров.</div>}
    </div>
  </div>
}

function activityLabel(action) {
  const map = {
    added_to_library:'Добавил фильм в библиотеку',
    rated_movie:'Оценил фильм',
    reviewed_movie:'Оставил отзыв',
    changed_status:'Изменил статус фильма',
    created_collection:'Создал коллекцию',
    liked_collection:'Поставил лайк коллекции'
  }
  return map[action] || action
}


function Section({ title, subtitle, children }) {
  return <section className="section"><div className="section-head"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div></div>{children}</section>
}

function PlaceholderCards({ text }) {
  return <div className="empty glass">🎬<br/><br/>{text}</div>
}
