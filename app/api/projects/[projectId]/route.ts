import { NextRequest } from 'next/server'
import { validatePin, unauthorizedResponse } from '@/lib/auth'
import { readJSON, writeJSON } from '@/lib/data'
import { Project } from '@/lib/types'

interface ProjectsData { projects: Project[] }

export async function GET(req: NextRequest, { params }: { params: { projectId: string } }) {
  if (!validatePin(req)) return unauthorizedResponse()
  const { projects } = readJSON<ProjectsData>('projects')
  const project = projects.find(p => p.id === params.projectId)
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json({ project })
}

export async function PUT(req: NextRequest, { params }: { params: { projectId: string } }) {
  if (!validatePin(req)) return unauthorizedResponse()
  const body = await req.json()
  const data = readJSON<ProjectsData>('projects')
  const idx = data.projects.findIndex(p => p.id === params.projectId)
  if (idx === -1) return Response.json({ error: 'Not found' }, { status: 404 })
  data.projects[idx] = { ...data.projects[idx], ...body, updated_at: new Date().toISOString() }
  writeJSON('projects', data)
  return Response.json({ project: data.projects[idx] })
}

export async function DELETE(req: NextRequest, { params }: { params: { projectId: string } }) {
  if (!validatePin(req)) return unauthorizedResponse()
  const data = readJSON<ProjectsData>('projects')
  data.projects = data.projects.filter(p => p.id !== params.projectId)
  writeJSON('projects', data)
  return Response.json({ success: true })
}
