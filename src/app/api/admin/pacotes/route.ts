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

  // Para cada slot: 10% de chance de ser especial, senão normal
  const shuffled = [...normais].sort(() => Math.random() - 0.5)
  let normalIdx = 0
  const picks: { id: number }[] = []

  for (let i = 0; i < qtd; i++) {
    if (especiais.length > 0 && Math.random() < campanha.chanceEspecial) {
      picks.push(especiais[Math.floor(Math.random() * especiais.length)])
    } else {
      picks.push(shuffled[normalIdx % shuffled.length])
      normalIdx++
    }
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
