import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import TermosClient from './TermosClient'

export const dynamic = 'force-dynamic'

export default async function TermosPage() {
  const session = await getSession()
  if (!session?.userId || !session.empresaId || !session.empresaSlug) redirect('/login')
  if (session.primeiroAcesso) redirect('/primeiro-acesso')
  if (session.termosAceitos) redirect('/album')

  return <TermosClient nome={session.nome} ehAdmin={session.role !== 'PARTICIPANTE'} />
}
