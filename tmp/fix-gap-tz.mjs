/**
 * Corrige registros criados no gap entre o primeiro fix de timezone e o deploy.
 * Intervalo UTC: 2026-06-01 20:17:55 → 2026-06-01 21:06:25
 */
import * as mariadb from 'mariadb'

const conn = await mariadb.createConnection({
  host: '127.0.0.1', port: 3306,
  user: process.env.DB_USER     || 'album_user',
  password: process.env.DB_PASSWORD || 'Album@2026Secure!',
  database: 'album_supermedica',
})

const INICIO = '2026-06-01 20:17:55'
const FIM    = '2026-06-01 21:16:00'

const tabelas = [
  { t: 'participantes',            cols: ['data_entrada', 'created_at', 'updated_at'] },
  { t: 'pacotes',                  cols: ['created_at', 'aberto_em'] },
  { t: 'album_itens',             cols: ['primeira_vez_em'] },
  { t: 'logs_distribuicao_manual', cols: ['criado_em'] },
]

for (const { t, cols } of tabelas) {
  for (const col of cols) {
    const [{ n }] = await conn.query(
      `SELECT COUNT(*) as n FROM \`${t}\` WHERE \`${col}\` BETWEEN ? AND ?`,
      [INICIO, FIM]
    )
    if (!n) continue
    console.log(`🔄 ${t}.${col}: ${n} registros`)
    await conn.query(
      `UPDATE \`${t}\` SET \`${col}\` = DATE_SUB(\`${col}\`, INTERVAL 3 HOUR)
       WHERE \`${col}\` BETWEEN ? AND ?`,
      [INICIO, FIM]
    )
  }
}

await conn.end()
console.log('\n✅ Gap corrigido.')
