import { NextRequest } from 'next/server'
import { validatePin, unauthorizedResponse } from '@/lib/auth'
import { readJSON, writeJSON } from '@/lib/data'
import { Project } from '@/lib/types'
import { v4 as uuid } from 'uuid'

interface ProjectsData { projects: Project[] }

export async function GET(req: NextRequest) {
  if (!validatePin(req)) return unauthorizedResponse()
  const { projects } = await readJSON<ProjectsData>('projects')
  return Response.json({ projects })
}

export async function POST(req: NextRequest) {
  if (!validatePin(req)) return unauthorizedResponse()
  const body = await req.json()
  const data = await readJSON<ProjectsData>('projects')
  const project: Project = {
    id: `proj_${uuid().slice(0, 8)}`,
    name: body.name,
    description: body.description || '',
    color: body.color || '#6366f1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  data.projects.push(project)
  await writeJSON('projects', data)
  return Response.json({ project }, { status: 201 })
}
