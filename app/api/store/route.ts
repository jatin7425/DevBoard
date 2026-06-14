import { NextRequest } from 'next/server'
import { validatePin, unauthorizedResponse } from '@/lib/auth'
import { readJSON, writeJSON } from '@/lib/data'

interface ProjectsData { projects: any[] }
interface ModulesData { modules: any[] }
interface TasksData { tasks: any[] }
interface DocsData { docs: any[] }
interface SprintsData { sprints: any[] }
interface ActivityData { activity: any[] }
interface MetaData { meta: any[] }

export async function GET(req: NextRequest) {
  if (!validatePin(req)) return unauthorizedResponse()

  const [
    projectsRes,
    modulesRes,
    tasksRes,
    docsRes,
    sprintsRes,
    activityRes,
    metaRes,
  ] = await Promise.all([
    readJSON<ProjectsData>('projects'),
    readJSON<ModulesData>('modules'),
    readJSON<TasksData>('tasks'),
    readJSON<DocsData>('docs'),
    readJSON<SprintsData>('sprints'),
    readJSON<ActivityData>('activity'),
    readJSON<MetaData>('meta'),
  ])

  const projects = projectsRes.projects || []
  const modules = modulesRes.modules || []
  const tasks = tasksRes.tasks || []
  const docs = docsRes.docs || []
  const sprints = sprintsRes.sprints || []
  const activity = activityRes.activity || []
  const meta = (metaRes.meta && metaRes.meta.length > 0) ? metaRes.meta[0] : null

  return Response.json({
    meta,
    projects,
    modules,
    tasks,
    docs,
    sprints,
    activity,
  })
}

export async function POST(req: NextRequest) {
  if (!validatePin(req)) return unauthorizedResponse()

  const body = await req.json()
  const { projects, modules, tasks, docs, sprints, activity, meta } = body

  await Promise.all([
    writeJSON('projects', { projects: projects || [] }),
    writeJSON('modules', { modules: modules || [] }),
    writeJSON('tasks', { tasks: tasks || [] }),
    writeJSON('docs', { docs: docs || [] }),
    writeJSON('sprints', { sprints: sprints || [] }),
    writeJSON('activity', { activity: activity || [] }),
    writeJSON('meta', { meta: meta ? [meta] : [] }),
  ])

  return Response.json({ success: true })
}
