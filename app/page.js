import { createClient } from '../lib/supabase/server'
import HomeClient from './home-client'

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('username, display_name, avatar_url, bio')
      .eq('id', user.id)
      .maybeSingle()
    profile = data
  }

  return <HomeClient user={user} profile={profile} />
}
