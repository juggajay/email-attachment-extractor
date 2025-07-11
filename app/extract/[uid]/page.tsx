import EmailDetail from '@/components/EmailDetail'

export default async function ExtractPage({ 
  params 
}: { 
  params: Promise<{ uid: string }> 
}) {
  const { uid } = await params
  
  return <EmailDetail uid={uid} />
}