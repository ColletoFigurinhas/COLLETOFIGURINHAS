import 'server-only'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function getEmpresaSlug(): Promise<string | null> {
  const h = await headers()
  return h.get('x-empresa-slug')
}

export async function resolveEmpresa() {
  const slug = await getEmpresaSlug()
  if (!slug) notFound()
  const empresa = await db.empresa.findFirst({ where: { slug, ativo: true } })
  if (!empresa) notFound()
  return empresa
}

export async function getTenantId(): Promise<number> {
  const session = await getSession()
  if (session?.empresaId) return session.empresaId
  const slug = await getEmpresaSlug()
  if (!slug) throw new Error('Sem contexto de empresa')
  const empresa = await db.empresa.findFirst({ where: { slug, ativo: true } })
  if (!empresa) throw new Error(`Empresa '${slug}' não encontrada`)
  return empresa.id
}
