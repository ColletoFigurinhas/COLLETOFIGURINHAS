'use server'

import { z }        from 'zod'
import bcrypt       from 'bcryptjs'
import { redirect } from 'next/navigation'
import { headers }  from 'next/headers'
import { db }       from '@/lib/db'
import { createSession, deleteSession, getSession } from '@/lib/session'
import { nivelarParticipante } from '@/lib/campanha'
import { enviarCodigoRecuperacao } from '@/lib/email'

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

  const empresa = await getEmpresaDoSlug()
  if (!empresa) return { error: 'Empresa não encontrada.' }

  const participante = await db.participante.findFirst({
    where: { matricula, empresaId: empresa.id },
  })
  if (!participante?.senha) return { error: 'Conta não encontrada.' }

  const ok = await bcrypt.compare(senha, participante.senha)
  if (!ok) return { error: 'Senha incorreta.' }

  await createSession({
    userId:      participante.id,
    matricula,
    nome:        participante.nome,
    role:        participante.role,
    empresaId:   empresa.id,
    empresaSlug: empresa.slug,
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
    data:  { email, senha: await bcrypt.hash(senha, 10) },
  })

  const campanha = await db.campanha.findFirst({
    where: { empresaId: empresa.id, status: 'ativo' },
  })
  if (campanha) await nivelarParticipante(db, campanha.id, participante.id)

  await createSession({
    userId:      participante.id,
    matricula,
    nome:        participante.nome,
    role:        participante.role,
    empresaId:   empresa.id,
    empresaSlug: empresa.slug,
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

  await db.participante.update({
    where: { id: session.userId },
    data:  { email, senha: await bcrypt.hash(senha, 10) },
  })

  await createSession({
    userId:      session.userId,
    matricula:   session.matricula!,
    nome:        session.nome,
    role:        session.role!,
    empresaId:   session.empresaId!,
    empresaSlug: session.empresaSlug!,
  })
  redirect('/album')
}

// ── Enviar código de recuperação ──────────────────────────────────
export async function enviarCodigoParaMatricula(
  matriculaRaw: string,
): Promise<{ ok: boolean; error?: string; codigoDebug?: string }> {
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
    console.error('[Email] Falha:', emailErro)
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

// ── Super admin login ─────────────────────────────────────────────
export async function superAdminLogin(
  email: string,
  senha: string,
): Promise<{ error: string } | void> {
  if (!email || !senha) return { error: 'Preencha todos os campos.' }

  const admin = await db.superAdmin.findUnique({ where: { email } })
  if (!admin) return { error: 'Credenciais inválidas.' }

  const ok = await bcrypt.compare(senha, admin.senhaHash)
  if (!ok) return { error: 'Credenciais inválidas.' }

  await createSession({
    superAdminId: admin.id,
    nome:         admin.nome,
    isSuperAdmin: true,
  })
  redirect('/super')
}

export async function superAdminLogout(): Promise<void> {
  await deleteSession()
  redirect('/super/login')
}
