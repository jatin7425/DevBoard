export function validatePin(request: Request): boolean {
  const pin = request.headers.get('x-devboard-pin')
  return pin === process.env.DEVBOARD_PIN
}

export function unauthorizedResponse() {
  return Response.json({ error: 'Unauthorized' }, { status: 401 })
}
