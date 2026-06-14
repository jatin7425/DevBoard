import { NextRequest } from 'next/server'
import { validatePin, unauthorizedResponse } from '@/lib/auth'
import { readJSON, writeJSON } from '@/lib/data'
import { Task } from '@/lib/types'

interface TasksData { tasks: Task[] }

export async function PUT(req: NextRequest, { params }: { params: { moduleId: string; taskId: string } }) {
  if (!validatePin(req)) return unauthorizedResponse()
  const body = await req.json()
  const data = await readJSON<TasksData>('tasks')
  const idx = data.tasks.findIndex(t => t.id === params.taskId && t.module_id === params.moduleId)
  if (idx === -1) return Response.json({ error: 'Not found' }, { status: 404 })
  data.tasks[idx] = { ...data.tasks[idx], ...body, updated_at: new Date().toISOString() }
  await writeJSON('tasks', data)
  return Response.json({ task: data.tasks[idx] })
}

export async function DELETE(req: NextRequest, { params }: { params: { moduleId: string; taskId: string } }) {
  if (!validatePin(req)) return unauthorizedResponse()
  const data = await readJSON<TasksData>('tasks')
  data.tasks = data.tasks.filter(t => !(t.id === params.taskId && t.module_id === params.moduleId))
  await writeJSON('tasks', data)
  return Response.json({ success: true })
}
