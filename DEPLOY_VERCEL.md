# Film 3 — бесплатный деплой

## 1. Локальная проверка

```bash
npm install
npm run build
npm run dev
```

Если `npm run build` проходит без ошибок, проект готов к деплою.

## 2. GitHub

Создай новый репозиторий на GitHub и загрузи содержимое этой папки.

Не загружай `.env.local` с секретами.

## 3. Vercel

На Vercel выбери `Add New -> Project`, импортируй GitHub-репозиторий и оставь:
- Framework: Next.js
- Build Command: `npm run build`
- Install Command: `npm install`

В Environment Variables добавь:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `TMDB_ACCESS_TOKEN`

После Deploy Vercel выдаст бесплатный адрес `*.vercel.app`.

## 4. Supabase Auth

В Supabase открой Authentication -> URL Configuration и добавь Production URL сайта в Site URL / Redirect URLs.

## 5. TMDB

TMDB Access Token хранится только в серверной переменной `TMDB_ACCESS_TOKEN`.
Никогда не помещай этот токен в `NEXT_PUBLIC_*`.

## Важно

Перед публикацией проверь SQL/RLS политики таблиц:
- profiles
- movies
- user_media
- friendships
- collections
- collection_items
- activity

Фронтенд уже рассчитан на эти таблицы, но политики должны разрешать нужные операции для authenticated users.
