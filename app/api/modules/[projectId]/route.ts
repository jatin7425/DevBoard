import { NextRequest } from 'next/server'
import { validatePin, unauthorizedResponse } from '@/lib/auth'
import { readJSON, writeJSON } from '@/lib/data'
import { Module } from '@/lib/types'
import { v4 as uuid } from 'uuid'

interface ModulesData { modules: Module[] }

export async function GET(req: NextRequest, { params }: { params: { projectId: string } }) {
  if (!validatePin(req)) return unauthorizedResponse()
  const { modules } = await readJSON<ModulesData>('modules')
  return Response.json({ modules: modules.filter(m => m.project_id === params.projectId) })
}

export async function POST(req: NextRequest, { params }: { params: { projectId: string } }) {
  if (!validatePin(req)) return unauthorizedResponse()
  const body = await req.json()
  const data = await readJSON<ModulesData>('modules')
  const existing = data.modules.filter(m => m.project_id === params.projectId)
  const module: Module = {
    id: `mod_${uuid().slice(0, 8)}`,
    project_id: params.projectId,
    name: body.name,
    description: body.description || '',
    order: existing.length,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  data.modules.push(module)
  await writeJSON('modules', data)
  return Response.json({ module }, { status: 201 })
}

export async function PUT(req: NextRequest, { params }: { params: { projectId: string } }) {
  if (!validatePin(req)) return unauthorizedResponse()
  const body = await req.json()
  const data = await readJSON<ModulesData>('modules')
  const idx = data.modules.findIndex(m => m.id === body.id && m.project_id === params.projectId)
  if (idx === -1) return Response.json({ error: 'Not found' }, { status: 404 })
  data.modules[idx] = { ...data.modules[idx], ...body, updated_at: new Date().toISOString() }
  await writeJSON('modules', data)
  return Response.json({ module: data.modules[idx] })
}

export async function DELETE(req: NextRequest, { params }: { params: { projectId: string } }) {
  if (!validatePin(req)) return unauthorizedResponse()
  const { moduleId } = await req.json()
  const data = await readJSON<ModulesData>('modules')
  data.modules = data.modules.filter(m => !(m.id === moduleId && m.project_id === params.projectId))
  await writeJSON('modules', data)
  return Response.json({ success: true })
}
