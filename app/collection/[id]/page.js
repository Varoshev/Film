import CollectionClient from './collection-client'
export default async function CollectionPage({params}) {
 const {id}=await params
 return <CollectionClient id={id}/>
}
