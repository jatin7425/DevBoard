import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const { pin } = await req.json()
  if (pin === process.env.DEVBOARD_PIN) {
    return Response.json({ success: true })
  }
  return Response.json({ success: false, error: 'Wrong pin' }, { status: 401 })
}
