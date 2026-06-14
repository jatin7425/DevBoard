import { NextRequest } from 'next/server'
import { validatePin, unauthorizedResponse } from '@/lib/auth'

export async function GET(req: NextRequest) {
  if (!validatePin(req)) return unauthorizedResponse()

  const apiBase = process.env.LITELLM_API_BASE
  if (!apiBase) {
    return Response.json({ error: 'LITELLM_API_BASE is not configured on the server' }, { status: 500 })
  }

  try {
    const res = await fetch(`${apiBase}/models`)
    if (!res.ok) {
      throw new Error(`LiteLLM returned status ${res.status}`)
    }
    const data = await res.json()
    return Response.json(data)
  } catch (e: any) {
    return Response.json({ error: e.message || String(e) }, { status: 500 })
  }
}
