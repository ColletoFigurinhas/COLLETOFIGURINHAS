'use server'

import { z }        from 'zod'
import bcrypt       from 'bcryptjs'
import { redirect } from 'next/navigation'
import { db }       from '@/lib/db'
import { createSession, deleteSession, getSession } from '@/lib/session'
import { validarMatriculaNoErp }                     from '@/lib/erp'
import { enviarCodigoRecuperacao }                    from '@/lib/email'

// ── Schemas ───────────────────────────────────────────────────────
const LoginSchema = z.object({
  matricula: z.string().min(1, 'Informe a matrícula').trim(),
  senha:     z.string().min(1, 'Informe a senha'),
})

const PrimeiroAcessoSchema = z.object({
  email:       z.string().email('E-mail inválido'),
  senha:       z.string().min(1, 'Informe uma senha'),
  confirmacao: z.string(),
}).refine(d => d.senha === d.confirmacao, { message: 'As senhas não conferem', path: ['confirmacao'] })

const RecuperarSchema = z.object({
  matricula: z.string().min(1, 'Informe a matrícula').trim(),
})

const VerificarCodigoSchema = z.object({
  matricula:   z.string().min(1).trim(),
  codigo:      z.string().length(6, 'O código tem 6 dígitos'),
  senha:       z.string().min(1, 'Informe uma senha'),
  confirmacao: z.string(),
}).refine(d => d.senha === d.confirmacao, { message: 'As senhas não conferem', path: ['confirmacao'] })

// ── Tipos ─────────────────────────────────────────────────────────
type LoginErrors          = { matricula?: string[]; senha?: string[]; geral?: string[] }
type PrimeiroAcessoErrors = { email?: string[]; senha?: string[]; confirmacao?: string[]; geral?: string[] }
type RecuperarErrors      = { matricula?: string[]; geral?: string[] }
type CodigoErrors         = { codigo?: string[]; senha?: string[]; confirmacao?: string[]; geral?: string[] }

export type LoginState          = { errors?: LoginErrors }                          | undefined
export type PrimeiroAcessoState = { errors?: PrimeiroAcessoErrors }                 | undefined
export type RecuperarState      = { errors?: RecuperarErrors; codigoEnviado?: true; codigoDebug?: string; emailFalhou?: boolean } | undefined
export type CodigoState         = { errors?: CodigoErrors; ok?: true }              | undefined

// ── Login ─────────────────────────────────────────────────────────
export async function login(_state: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    matricula: formData.get('matricula'),
    senha:     formData.get('senha'),
  })
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors as LoginErrors }

  const { senha } = parsed.data
  // Normaliza: remove espaços e preenche com zeros à esquerda até 5 dígitos
  // Aceita "931", "00931", " 931 " → todos viram "00931"
  const matricula = parsed.data.matricula.replace(/\D/g, '').padStart(5, '0')

  const validacao = await validarMatriculaNoErp(matricula)
  if (!validacao.ok) {
    const msg: Record<string, string> = {
      nao_encontrado: 'Matrícula não encontrada. Verifique com o RH.',
      suspenso:       'Seu acesso está suspenso. Contate o RH.',
      inativo:        'Seu vínculo com a empresa está encerrado.',
      erro_api:       'Não foi possível validar. Tente novamente.',
    }
    return { errors: { geral: [msg[validacao.motivo]] } }
  }

  let participante = await db.participante.findFirst({ where: { matricula } })

  if (!participante) {
    participante = await db.participante.create({
      data: { matricula, nome: validacao.funcionario.nome },
    })
  } else if (!participante.ativo) {
    return { errors: { geral: ['Sua participação na campanha foi encerrada.'] } }
  }

  // Primeiro acesso
  if (!participante.senha) {
    await createSession({ userId: participante.id, matricula, nome: participante.nome, role: participante.role, primeiroAcesso: true })
    redirect('/primeiro-acesso')
  }

  const ok = await bcrypt.compare(senha, participante.senha)
  if (!ok) return { errors: { geral: ['Senha incorreta.'] } }

  await createSession({ userId: participante.id, matricula, nome: participante.nome, role: participante.role })
  redirect('/album')
}

// ── Primeiro acesso ───────────────────────────────────────────────
export async function definirSenha(_state: PrimeiroAcessoState, formData: FormData): Promise<PrimeiroAcessoState> {
  const session = await getSession()
  if (!session?.userId || !session.primeiroAcesso) redirect('/login')

  const parsed = PrimeiroAcessoSchema.safeParse({
    email:       formData.get('email'),
    senha:       formData.get('senha'),
    confirmacao: formData.get('confirmacao'),
  })
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors as PrimeiroAcessoErrors }

  await db.participante.update({
    where: { id: session.userId },
    data:  { email: parsed.data.email, senha: await bcrypt.hash(parsed.data.senha, 10) },
  })

  await createSession({ userId: session.userId, matricula: session.matricula, nome: session.nome, role: session.role })
  redirect('/album')
}

// ── Enviar código de recuperação ──────────────────────────────────
export async function enviarCodigo(_state: RecuperarState, formData: FormData): Promise<RecuperarState> {
  const parsed = RecuperarSchema.safeParse({ matricula: formData.get('matricula') })
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors as RecuperarErrors }

  const matricula = parsed.data.matricula.replace(/\D/g, '').padStart(5, '0')
  const participante = await db.participante.findFirst({ where: { matricula } })

  // Não revela se matrícula existe
  if (!participante?.email) return { codigoEnviado: true }

  const codigo = Math.floor(100000 + Math.random() * 900000).toString()
  const expiry  = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

  await db.participante.update({
    where: { id: participante.id },
    data:  { resetToken: codigo, resetTokenExpiry: expiry },
  })

  let emailEnviado = false
  try {
    await enviarCodigoRecuperacao(participante.email, participante.matricula, codigo)
    emailEnviado = true
  } catch (err) {
    console.error('[Email] Falha ao enviar:', err)
    console.log(`[Dev] Código de recuperação para ${participante.matricula}: ${codigo}`)
  }

  // Em desenvolvimento, devolve o código quando o email falha
  const isDev = process.env.NODE_ENV !== 'production'
  return {
    codigoEnviado: true,
    ...(isDev && !emailEnviado ? { codigoDebug: codigo, emailFalhou: true } : {}),
  }
}

// ── Verificar código e redefinir senha ────────────────────────────
export async function verificarCodigo(_state: CodigoState, formData: FormData): Promise<CodigoState> {
  const parsed = VerificarCodigoSchema.safeParse({
    matricula:   formData.get('matricula'),
    codigo:      formData.get('codigo'),
    senha:       formData.get('senha'),
    confirmacao: formData.get('confirmacao'),
  })
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors as CodigoErrors }

  const { matricula, codigo, senha } = parsed.data

  const participante = await db.participante.findFirst({ where: { matricula } })

  if (
    !participante ||
    participante.resetToken !== codigo ||
    !participante.resetTokenExpiry ||
    participante.resetTokenExpiry < new Date()
  ) {
    return { errors: { codigo: ['Código inválido ou expirado.'] } }
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
