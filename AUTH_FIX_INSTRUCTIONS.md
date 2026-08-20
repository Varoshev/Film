# Film 3.0 authentication fix

This version uses the standard Supabase confirmation email and the browser-side PKCE callback.

## Supabase settings

Authentication -> URL Configuration:

- Site URL: https://film-lime-seven.vercel.app
- Redirect URL: https://film-lime-seven.vercel.app/auth/callback
- Local Redirect URL: http://localhost:3000/auth/callback

Do not configure custom SMTP or replace the default confirmation email template.

## Flow

1. `signUp()` sends the standard Supabase confirmation email.
2. The email verifies the signup with Supabase.
3. Supabase redirects to `/auth/callback?code=...`.
4. The browser callback calls `exchangeCodeForSession(code)` using the PKCE verifier stored by the browser client.
5. The user is redirected to `/` with an active session.
