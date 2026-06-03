export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { mkdir, chmod } = await import('fs/promises')
    const path = await import('path')

    const dirs = ['Especiais', 'VERDE', 'AMARELO', 'Premio']
    for (const folder of dirs) {
      const dir = path.join(process.cwd(), 'public', 'figuras', folder)
      try {
        await mkdir(dir, { recursive: true })
        await chmod(dir, 0o755)
      } catch {
        // ignora se já existe ou sem permissão (log via upload route)
      }
    }
  }
}
