import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

const ROLES_PERMITIDOS = ['MARKETING', 'TI', 'ADMIN'] as const

export async function POST(request: Request) {
  const s = await getSession()
  if (!s?.userId || !ROLES_PERMITIDOS.includes(s.role as any))
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { participanteId, tipo, descricaoPremio } = await request.json()

  if (!participanteId || !['PLUS', 'PREMIUM'].includes(tipo))
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

  if (tipo === 'PREMIUM' && !descricaoPremio?.trim())
    return NextResponse.json({ error: 'Informe o prêmio físico para pacote Ouro.' }, { status: 400 })

  const campanha = await db.campanha.findFirstOrThrow({ where: { slug: 'super-copa-2026' } })
  const qtd = tipo === 'PLUS' ? campanha.stickersPorDiaPlus : campanha.stickersPorDiaPremium

  // Pool de figurinhas normais
  const normais = await db.figurinha.findMany({
    where:  { campanhaId: campanha.id, ativo: true, classificacao: { not: 'ESPECIAIS' } },
    select: { id: true },
  })

  // Especiais (chance configurável na campanha)
  const especiais = await db.figurinha.findMany({
    where:  { campanhaId: campanha.id, ativo: true, classificacao: 'ESPECIAIS' },
    select: { id: true },
  })

  // Embaralha e seleciona figurinhas normais
  const shuffled = [...normais].sort(() => Math.random() - 0.5)
  let picks = shuffled.slice(0, qtd)

  // Chance de incluir 1 especial (substitui a última normal)
  if (especiais.length > 0 && Math.random() < campanha.chanceEspecial) {
    const esp = especiais[Math.floor(Math.random() * especiais.length)]
    picks = [...picks.slice(0, qtd - 1), esp]
  }

  const pacote = await db.pacote.create({
    data: {
      campanhaId:    campanha.id,
      participanteId,
      tipo,
      dataReferencia: new Date(),
      status:         'DISPONIVEL',
      figurinhas: {
        create: picks.map(f => ({ figurinhaId: f.id, revelada: false })),
      },
      ...(tipo === 'PREMIUM' ? {
        premio: {
          create: {
            descricao:    descricaoPremio.trim(),
            registradoPor: s.nome,
          },
        },
      } : {}),
    },
  })

  return NextResponse.json({ ok: true, pacoteId: pacote.id })
}
