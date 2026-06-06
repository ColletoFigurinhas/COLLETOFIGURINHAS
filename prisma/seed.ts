import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const adapter = new PrismaMariaDb({
  host:     'localhost',
  port:     3306,
  user:     'root',
  password: 'root',
  database: 'album_supermedica',
})
const db = new PrismaClient({ adapter })

async function main() {
  // ── 1. Super Admin (equipe Colleto) ────────────────────────────
  const superHash = await bcrypt.hash('colleto@super2026', 10)
  const superAdmin = await db.superAdmin.upsert({
    where:  { email: 'raulmartinsagrivet1@gmail.com' },
    update: {},
    create: {
      email:     'raulmartinsagrivet1@gmail.com',
      nome:      'Raul Colleto',
      senhaHash: superHash,
    },
  })
  console.log('✓ SuperAdmin:', superAdmin.email)

  // ── 2. Empresa teste ────────────────────────────────────────────
  const empresa = await db.empresa.upsert({
    where:  { slug: 'supermedica' },
    update: {},
    create: {
      nome:        'Supermédica RH',
      slug:        'supermedica',
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
      email:     'admin@supermedica.com',
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
    where:  { empresaId_slug: { empresaId: empresa.id, slug: 'super-copa-2026' } },
    update: {},
    create: {
      empresaId:             empresa.id,
      nome:                  'Super Copa 2026',
      slug:                  'super-copa-2026',
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

  // ── 6. Figurinhas placeholder ──────────────────────────────────
  const grupos = ['GRUPO A', 'GRUPO B', 'GRUPO C', 'GRUPO D']
  let figCount = 0
  for (const grupo of grupos) {
    // 5 cartas FUNCIONARIO por grupo
    for (let i = 1; i <= 5; i++) {
      const existing = await db.figurinha.findFirst({ where: { campanhaId: campanha.id, classificacao: grupo, tipo: 'FUNCIONARIO' } })
      if (!existing) {
        await db.figurinha.create({ data: { campanhaId: campanha.id, classificacao: grupo, tipo: 'FUNCIONARIO', ativo: true } })
        figCount++
      }
    }
    // 1 carta GESTOR
    const gestor = await db.figurinha.findFirst({ where: { campanhaId: campanha.id, classificacao: grupo, tipo: 'GESTOR' } })
    if (!gestor) {
      await db.figurinha.create({ data: { campanhaId: campanha.id, classificacao: grupo, tipo: 'GESTOR', ativo: true } })
      figCount++
    }
  }
  // Especiais
  for (let i = 0; i < 3; i++) {
    const existing = await db.figurinha.findFirst({ where: { campanhaId: campanha.id, tipo: 'ESPECIAL' } })
    if (!existing) {
      await db.figurinha.create({ data: { campanhaId: campanha.id, classificacao: 'ESPECIAIS', tipo: 'ESPECIAL', ativo: true } })
      figCount++
    }
  }
  console.log(`✓ ${figCount} figurinhas criadas (sem imagem — cadastre via painel)`)

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Seed concluído!\n')
  console.log('Super Admin  → http://localhost:3001/super/login')
  console.log('  Email: raulmartinsagrivet1@gmail.com')
  console.log('  Senha: colleto@super2026\n')
  console.log('Admin Empresa → http://supermedica.localhost:3001/login')
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
