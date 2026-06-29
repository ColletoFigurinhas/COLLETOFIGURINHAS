import { config } from 'dotenv'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

config({ path: '.env.local' })

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})
const db = new PrismaClient({ adapter })

async function main() {
  // ── 1. Owner (equipe Colleto) ───────────────────────────────────
  const ownerHash = await bcrypt.hash('colleto@owner2026', 10)
  const owner = await db.owner.upsert({
    where:  { email: 'raulmartinsagrivet1@gmail.com' },
    update: {},
    create: {
      email:     'raulmartinsagrivet1@gmail.com',
      nome:      'Raul Colleto',
      senhaHash: ownerHash,
    },
  })
  console.log('✓ Owner:', owner.email)

  // ── 2. Empresa teste ────────────────────────────────────────────
  const empresa = await db.empresa.upsert({
    where:  { slug: 'samsung' },
    update: {},
    create: {
      nome:        'Samsung',
      slug:        'samsung',
      cnpj:        '00.000.000/0001-00',
      corPrimaria: '#1d4ed8',
      plano:       'basico',
      ativo:       true,
    },
  })
  console.log('✓ Empresa:', empresa.nome, `(id=${empresa.id})`)

  // ── 3. Admin da empresa ─────────────────────────────────────────
  const adminHash = await bcrypt.hash('admin123', 10)
  const adminUser = await db.participante.upsert({
    where:  { empresaId_matricula: { empresaId: empresa.id, matricula: 'admin' } },
    update: {},
    create: {
      empresaId: empresa.id,
      matricula: 'admin',
      nome:      'Administrador',
      email:     'admin@samsung.com',
      senha:     adminHash,
      role:      'ADMIN',
      ativo:     true,
    },
  })
  console.log('✓ Admin participante:', adminUser.matricula, '— senha: admin123')

  // ── 4. Participantes de teste ──────────────────────────────────
  const participantes = [
    { matricula: '00001', nome: 'Ana Silva',     email: 'ana@test.com'  },
    { matricula: '00002', nome: 'Bruno Costa',   email: 'bruno@test.com' },
    { matricula: '00003', nome: 'Carla Mendes',  email: null             },
    { matricula: '00004', nome: 'Diego Rocha',   email: null             },
    { matricula: '00005', nome: 'Elena Torres',  email: 'elena@test.com' },
  ]
  const senhaHash = await bcrypt.hash('senha123', 10)
  for (const p of participantes) {
    await db.participante.upsert({
      where:  { empresaId_matricula: { empresaId: empresa.id, matricula: p.matricula } },
      update: {},
      create: { empresaId: empresa.id, ...p, senha: senhaHash, role: 'PARTICIPANTE', ativo: true },
    })
  }
  console.log(`✓ ${participantes.length} participantes de teste (senha: senha123)`)

  // ── 5. Campanha ────────────────────────────────────────────────
  const campanha = await db.campanha.upsert({
    where:  { empresaId_slug: { empresaId: empresa.id, slug: 'copa-samsung-2026' } },
    update: {},
    create: {
      empresaId:             empresa.id,
      nome:                  'Copa Samsung 2026',
      slug:                  'copa-samsung-2026',
      dataInicio:            new Date('2026-06-01T00:00:00'),
      dataFim:               new Date('2026-09-30T23:59:59'),
      stickersPorDiaPadrao:  14,
      stickersPorDiaPlus:    15,
      stickersPorDiaPremium: 15,
      chanceEspecial:        0.10,
      horarioCorteAcoes:     '18:00',
      status:                'ativo',
    },
  })
  console.log('✓ Campanha:', campanha.nome, `(id=${campanha.id})`)

  // ── 6. Figurinhas demo (3 departamentos com imagens reais) ────────
  // Distribuição: VENDAS 3+gestor | ALMOXARIFADO 2+gestor | COMPRAS 2+gestor
  // Imagens em Material/ copiadas para public/figuras/{dept}/ + VERDE/ + AMARELO/
  const demoFigs = [
    { classificacao: 'VENDAS',       tipo: 'FUNCIONARIO', imagemUrl: '/figuras/vendas/Figura-201.png' },
    { classificacao: 'VENDAS',       tipo: 'FUNCIONARIO', imagemUrl: '/figuras/vendas/Figura-202.png' },
    { classificacao: 'VENDAS',       tipo: 'FUNCIONARIO', imagemUrl: '/figuras/vendas/Figura-203.png' },
    { classificacao: 'VENDAS',       tipo: 'GESTOR',      imagemUrl: '/figuras/vendas/Figura-204.png' },
    { classificacao: 'ALMOXARIFADO', tipo: 'FUNCIONARIO', imagemUrl: '/figuras/almoxarifado/Figura-205.png' },
    { classificacao: 'ALMOXARIFADO', tipo: 'FUNCIONARIO', imagemUrl: '/figuras/almoxarifado/Figura-206.png' },
    { classificacao: 'ALMOXARIFADO', tipo: 'GESTOR',      imagemUrl: '/figuras/almoxarifado/Figura-207.png' },
    { classificacao: 'COMPRAS',      tipo: 'FUNCIONARIO', imagemUrl: '/figuras/compras/Figura-208.png' },
    { classificacao: 'COMPRAS',      tipo: 'FUNCIONARIO', imagemUrl: '/figuras/compras/Figura-209.png' },
    { classificacao: 'COMPRAS',      tipo: 'GESTOR',      imagemUrl: '/figuras/compras/Figura-210.png' },
  ]
  let figCount = 0
  for (const fig of demoFigs) {
    const existing = await db.figurinha.findFirst({ where: { campanhaId: campanha.id, imagemUrl: fig.imagemUrl } })
    if (!existing) {
      await db.figurinha.create({ data: { campanhaId: campanha.id, ...fig, ativo: true } })
      figCount++
    }
  }
  console.log(`✓ ${figCount} figurinhas demo criadas (VENDAS × 4 | ALMOXARIFADO × 3 | COMPRAS × 3)`)

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Seed concluído!\n')
  console.log('Owner        → http://localhost:3001/owner/login')
  console.log('  Email: raulmartinsagrivet1@gmail.com')
  console.log('  Senha: colleto@owner2026\n')
  console.log('Admin Empresa → http://samsung.localhost:3001/login')
  console.log('  Matrícula: admin')
  console.log('  Senha: admin123\n')
  console.log('Participante  → mesmo endereço')
  console.log('  Matrícula: 00001 a 00005')
  console.log('  Senha: senha123')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
