import { NextRequest } from 'next/server'
import { validatePin, unauthorizedResponse } from '@/lib/auth'
import { readJSON, writeJSON } from '@/lib/data'
import { Doc } from '@/lib/types'

interface DocsData { docs: Doc[] }

export async function GET(req: NextRequest, { params }: { params: { moduleId: string; docId: string } }) {
  if (!validatePin(req)) return unauthorizedResponse()
  const { docs } = readJSON<DocsData>('docs')
  const doc = docs.find(d => d.id === params.docId && d.module_id === params.moduleId)
  if (!doc) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json({ doc })
}

export async function PUT(req: NextRequest, { params }: { params: { moduleId: string; docId: string } }) {
  if (!validatePin(req)) return unauthorizedResponse()
  const body = await req.json()
  const data = readJSON<DocsData>('docs')
  const idx = data.docs.findIndex(d => d.id === params.docId && d.module_id === params.moduleId)
  if (idx === -1) return Response.json({ error: 'Not found' }, { status: 404 })
  data.docs[idx] = { ...data.docs[idx], ...body, updated_at: new Date().toISOString() }
  writeJSON('docs', data)
  return Response.json({ doc: data.docs[idx] })
}

export async function DELETE(req: NextRequest, { params }: { params: { moduleId: string; docId: string } }) {
  if (!validatePin(req)) return unauthorizedResponse()
  const data = readJSON<DocsData>('docs')
  data.docs = data.docs.filter(d => !(d.id === params.docId && d.module_id === params.moduleId))
  writeJSON('docs', data)
  return Response.json({ success: true })
}
