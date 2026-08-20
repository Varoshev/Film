import PublicUserClient from './public-user-client'
export default async function UserPage({params}) {
  const {username}=await params
  return <PublicUserClient username={username}/>
}
