'use server'

import { z }        from 'zod'
import bcrypt       from 'bcryptjs'
import { redirect } from 'next/navigation'
import { headers }  from 'next/headers'
import { db }       from '@/lib/db'
import { createSession, deleteSession, getSession } from '@/lib/session'
import { nivelarParticipante } from '@/server/services/campanha'
import { enviarCodigoRecuperacao } from '@/lib/email'
import { rateLimit } from '@/lib/ratelimit'
import { log } from '@/lib/logger'

async function getClientIp(): Promise<string> {
  const h = await headers()
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}

// ── Helpers ───────────────────────────────────────────────────────
async function getEmpresaDoSlug() {
  const h = await headers()
  const slug = h.get('x-empresa-slug')
  if (!slug) return null
  return db.empresa.findFirst({ where: { slug, ativo: true } })
}

// ── Verificar matrícula (step 1 do login) ─────────────────────────
export async function verificarMatricula(matriculaRaw: string): Promise<
  { ok: false; error: string } |
  { ok: true; temSenha: boolean; nome: string; isNovo: boolean }
> {
  const matricula = matriculaRaw.trim()
  if (!matricula) return { ok: false, error: 'Informe a matrícula.' }

  const empresa = await getEmpresaDoSlug()
  if (!empresa) return { ok: false, error: 'Empresa não encontrada.' }

  const participante = await db.participante.findFirst({
    where: { matricula, empresaId: empresa.id },
  })

  if (participante && !participante.ativo) {
    return { ok: false, error: 'Sua participação foi encerrada.' }
  }

  return {
    ok: true,
    temSenha: !!(participante?.senha),
    nome:     participante?.nome ?? '',
    isNovo:   !participante,
  }
}

// ── Login com senha (step 2a) ─────────────────────────────────────
export async function loginComSenha(matriculaRaw: string, senha: string): Promise<{ error: string } | void> {
  if (!senha) return { error: 'Informe a senha.' }
  const matricula = matriculaRaw.trim()

  const ip = await getClientIp()
  if (!rateLimit(`login:${ip}`, 10, 60_000).allowed)
    return { error: 'Muitas tentativas. Aguarde 1 minuto.' }

  const empresa = await getEmpresaDoSlug()
  if (!empresa) return { error: 'Empresa não encontrada.' }

  const participante = await db.participante.findFirst({
    where: { matricula, empresaId: empresa.id },
  })
  if (!participante?.senha) return { error: 'Conta não encontrada.' }

  const ok = await bcrypt.compare(senha, participante.senha)
  if (!ok) return { error: 'Senha incorreta.' }

  await db.participante.update({ where: { id: participante.id }, data: { ultimoAcessoEm: new Date() } })

  await createSession({
    userId:        participante.id,
    matricula,
    nome:          participante.nome,
    role:          participante.role,
    empresaId:     empresa.id,
    empresaSlug:   empresa.slug,
    termosAceitos: !!participante.termosAceitosEm,
  })
  redirect('/album')
}

// ── Cadastrar (novo usuário ou primeiro acesso) ───────────────────
export async function cadastrar(
  matriculaRaw: string,
  nome:         string,
  email:        string,
  senha:        string,
): Promise<{ error: string } | void> {
  if (!email || !senha) return { error: 'Preencha todos os campos.' }
  if (!nome?.trim())    return { error: 'Informe seu nome.' }
  const matricula = matriculaRaw.trim()

  const empresa = await getEmpresaDoSlug()
  if (!empresa) return { error: 'Empresa não encontrada.' }

  let participante = await db.participante.findFirst({
    where: { matricula, empresaId: empresa.id },
  })

  if (!participante) {
    participante = await db.participante.create({
      data: { matricula, nome: nome.trim(), empresaId: empresa.id },
    })
  }

  await db.participante.update({
    where: { id: participante.id },
    data:  { email, senha: await bcrypt.hash(senha, 10), ultimoAcessoEm: new Date() },
  })

  const campanha = await db.campanha.findFirst({
    where: { empresaId: empresa.id, status: 'ativo' },
  })
  if (campanha) await nivelarParticipante(db, campanha.id, participante.id)

  await createSession({
    userId:        participante.id,
    matricula,
    nome:          participante.nome,
    role:          participante.role,
    empresaId:     empresa.id,
    empresaSlug:   empresa.slug,
    termosAceitos: !!participante.termosAceitosEm,
  })
  redirect('/album')
}

// ── Definir senha (primeiro acesso via session) ───────────────────
export async function definirSenha(
  _state: { errors?: Record<string, string[]> } | undefined,
  formData: FormData,
): Promise<{ errors?: Record<string, string[]> } | undefined> {
  const session = await getSession()
  if (!session?.userId || !session.primeiroAcesso) redirect('/login')

  const email       = String(formData.get('email') ?? '')
  const senha       = String(formData.get('senha') ?? '')
  const confirmacao = String(formData.get('confirmacao') ?? '')

  if (!email || !z.string().email().safeParse(email).success)
    return { errors: { email: ['E-mail inválido'] } }
  if (!senha)
    return { errors: { senha: ['Informe uma senha'] } }
  if (senha !== confirmacao)
    return { errors: { confirmacao: ['As senhas não conferem'] } }

  const p = await db.participante.update({
    where: { id: session.userId },
    data:  { email, senha: await bcrypt.hash(senha, 10), ultimoAcessoEm: new Date() },
  })

  await createSession({
    userId:        session.userId,
    matricula:     session.matricula!,
    nome:          session.nome,
    role:          session.role!,
    empresaId:     session.empresaId!,
    empresaSlug:   session.empresaSlug!,
    termosAceitos: !!p.termosAceitosEm,
  })
  redirect('/album')
}

// ── Aceitar termos (gate de 1º acesso) ────────────────────────────
export async function aceitarTermos(): Promise<{ error: string } | void> {
  const session = await getSession()
  if (!session?.userId || !session.empresaId || !session.empresaSlug) redirect('/login')

  await db.participante.update({
    where: { id: session.userId },
    data:  { termosAceitosEm: new Date() },
  })

  await createSession({
    userId:        session.userId,
    matricula:     session.matricula!,
    nome:          session.nome,
    role:          session.role!,
    empresaId:     session.empresaId,
    empresaSlug:   session.empresaSlug,
    termosAceitos: true,
  })
  redirect('/album')
}

// ── Enviar código de recuperação ──────────────────────────────────
export async function enviarCodigoParaMatricula(
  matriculaRaw: string,
): Promise<{ ok: boolean; error?: string; codigoDebug?: string }> {
  const ip = await getClientIp()
  if (!rateLimit(`recuperar:${ip}`, 5, 60_000).allowed)
    return { ok: false, error: 'Muitas tentativas. Aguarde 1 minuto.' }

  const matricula = matriculaRaw.trim()

  const empresa = await getEmpresaDoSlug()
  if (!empresa) return { ok: false, error: 'Empresa não encontrada.' }

  const participante = await db.participante.findFirst({
    where: { matricula, empresaId: empresa.id },
  })
  if (!participante?.email) return { ok: true }

  const codigo = Math.floor(100_000 + Math.random() * 900_000).toString()
  const expiry  = new Date(Date.now() + 60 * 60 * 1000)

  await db.participante.update({
    where: { id: participante.id },
    data:  { resetToken: codigo, resetTokenExpiry: expiry },
  })

  let emailEnviado = false
  let emailErro    = ''
  try {
    await enviarCodigoRecuperacao(participante.email, matricula, codigo)
    emailEnviado = true
  } catch (err: any) {
    emailErro = err?.message ?? String(err)
    log.error('Falha ao enviar email de recuperação', { error: emailErro, matricula })
  }

  if (!emailEnviado) {
    if (process.env.NODE_ENV !== 'production') return { ok: true, codigoDebug: codigo }
    return { ok: false, error: `Falha ao enviar e-mail: ${emailErro}` }
  }

  return { ok: true }
}

// ── Redefinir senha ───────────────────────────────────────────────
export async function redefinirSenha(
  matriculaRaw: string,
  codigo:       string,
  senha:        string,
): Promise<{ ok: boolean; error?: string }> {
  if (!codigo || !senha || senha.length < 6) return { ok: false, error: 'Preencha todos os campos.' }

  const matricula = matriculaRaw.trim()

  const empresa = await getEmpresaDoSlug()
  if (!empresa) return { ok: false, error: 'Empresa não encontrada.' }

  const participante = await db.participante.findFirst({
    where: { matricula, empresaId: empresa.id },
  })

  if (
    !participante ||
    participante.resetToken !== codigo ||
    !participante.resetTokenExpiry ||
    participante.resetTokenExpiry < new Date()
  ) {
    return { ok: false, error: 'Código inválido ou expirado.' }
  }

  await db.participante.update({
    where: { id: participante.id },
    data:  { senha: await bcrypt.hash(senha, 10), resetToken: null, resetTokenExpiry: null },
  })

  return { ok: true }
}

// ── Logout ────────────────────────────────────────────────────────
export async function logout(): Promise<void> {
  await deleteSession()
  redirect('/login')
}

// ── Owner login (equipe Colleto) ──────────────────────────────────
export async function ownerLogin(
  email: string,
  senha: string,
): Promise<{ error: string } | void> {
  if (!email || !senha) return { error: 'Preencha todos os campos.' }

  const owner = await db.owner.findUnique({ where: { email } })
  if (!owner) return { error: 'Credenciais inválidas.' }

  const ok = await bcrypt.compare(senha, owner.senhaHash)
  if (!ok) return { error: 'Credenciais inválidas.' }

  await createSession({
    ownerId: owner.id,
    nome:    owner.nome,
    isOwner: true,
  })
  redirect('/owner')
}

export async function ownerLogout(): Promise<void> {
  await deleteSession()
  redirect('/owner/login')
}
