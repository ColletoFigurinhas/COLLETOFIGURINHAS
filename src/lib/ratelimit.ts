type Entry = { count: number; reset: number }
const store = new Map<string, Entry>()

// Limpa entradas expiradas a cada minuto
setInterval(() => {
  const now = Date.now()
  for (const [key, e] of store) {
    if (now > e.reset) store.delete(key)
  }
}, 60_000)

export function rateLimit(
  key:      string,
  limit:    number,
  windowMs: number,
): { allowed: boolean } {
  const now   = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.reset) {
    store.set(key, { count: 1, reset: now + windowMs })
    return { allowed: true }
  }

  if (entry.count >= limit) return { allowed: false }

  entry.count++
  return { allowed: true }
}
