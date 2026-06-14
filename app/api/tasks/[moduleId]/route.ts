import { NextRequest } from 'next/server'
import { validatePin, unauthorizedResponse } from '@/lib/auth'
import { readJSON, writeJSON } from '@/lib/data'
import { Task } from '@/lib/types'
import { v4 as uuid } from 'uuid'

interface TasksData { tasks: Task[] }

export async function GET(req: NextRequest, { params }: { params: { moduleId: string } }) {
  if (!validatePin(req)) return unauthorizedResponse()
  const { tasks } = readJSON<TasksData>('tasks')
  return Response.json({ tasks: tasks.filter(t => t.module_id === params.moduleId) })
}

export async function POST(req: NextRequest, { params }: { params: { moduleId: string } }) {
  if (!validatePin(req)) return unauthorizedResponse()
  const body = await req.json()
  const data = readJSON<TasksData>('tasks')
  const existing = data.tasks.filter(t => t.module_id === params.moduleId && t.status === (body.status || 'TODO'))
  const task: Task = {
    id: `task_${uuid().slice(0, 8)}`,
    module_id: params.moduleId,
    title: body.title,
    description: body.description || '',
    status: body.status || 'TODO',
    priority: body.priority || 'MEDIUM',
    tags: body.tags || [],
    order: existing.length,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  data.tasks.push(task)
  writeJSON('tasks', data)
  return Response.json({ task }, { status: 201 })
}
