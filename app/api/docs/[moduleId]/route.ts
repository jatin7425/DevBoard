import { NextRequest } from 'next/server'
import { validatePin, unauthorizedResponse } from '@/lib/auth'
import { readJSON, writeJSON } from '@/lib/data'
import { Doc } from '@/lib/types'
import { v4 as uuid } from 'uuid'

interface DocsData { docs: Doc[] }

export async function GET(req: NextRequest, { params }: { params: { moduleId: string } }) {
  if (!validatePin(req)) return unauthorizedResponse()
  const { docs } = await readJSON<DocsData>('docs')
  return Response.json({ docs: docs.filter(d => d.module_id === params.moduleId) })
}

export async function POST(req: NextRequest, { params }: { params: { moduleId: string } }) {
  if (!validatePin(req)) return unauthorizedResponse()
  const body = await req.json()
  const data = await readJSON<DocsData>('docs')
  const doc: Doc = {
    id: `doc_${uuid().slice(0, 8)}`,
    module_id: params.moduleId,
    title: body.title,
    content: body.content || `# ${body.title}\n\nStart writing here...`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  data.docs.push(doc)
  await writeJSON('docs', data)
  return Response.json({ doc }, { status: 201 })
}
