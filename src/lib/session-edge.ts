import { jwtVerify } from 'jose'
import type { SessionPayload } from './session'

export async function decryptEdge(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null
  const key = new TextEncoder().encode(process.env.SESSION_SECRET ?? '')
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] })
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}
