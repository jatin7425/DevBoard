import { NextRequest } from 'next/server'
import { validatePin, unauthorizedResponse } from '@/lib/auth'
import { readJSON, writeJSON } from '@/lib/data'
import { Project, Module, Task, Doc } from '@/lib/types'
import { v4 as uuid } from 'uuid'

interface ProjectsData { projects: Project[] }
interface ModulesData  { modules: Module[] }
interface TasksData    { tasks: Task[] }
interface DocsData     { docs: Doc[] }

function parseMarkdown(md: string) {
  const lines = md.split('\n').map(l => l.trim()).filter(Boolean)

  let projectName = ''
  let projectDesc = ''
  const modules: {
    name: string; description: string;
    tasks: { title: string; priority: string; status: string; tags: string[]; description: string }[];
    docs: { title: string; content: string }[];
  }[] = []

  let currentModule: typeof modules[0] | null = null
  let currentTask: typeof modules[0]['tasks'][0] | null = null
  let currentDoc: typeof modules[0]['docs'][0] | null = null

  const pushTask = () => {
    if (currentTask && currentModule) {
      currentModule.tasks.push(currentTask)
      currentTask = null
    }
  }
  const pushDoc = () => {
    if (currentDoc && currentModule) {
      currentModule.docs.push(currentDoc)
      currentDoc = null
    }
  }
  const pushModule = () => {
    pushTask(); pushDoc()
    if (currentModule) modules.push(currentModule)
    currentModule = null
  }

  for (const line of lines) {
    if (line.startsWith('# PROJECT:')) {
      projectName = line.replace('# PROJECT:', '').trim()
    } else if (!projectDesc && line.startsWith('DESCRIPTION:') && !currentModule) {
      projectDesc = line.replace('DESCRIPTION:', '').trim()
    } else if (line.startsWith('## MODULE:')) {
      pushModule()
      currentModule = { name: line.replace('## MODULE:', '').trim(), description: '', tasks: [], docs: [] }
    } else if (line.startsWith('DESCRIPTION:') && currentModule && !currentTask && !currentDoc) {
      currentModule.description = line.replace('DESCRIPTION:', '').trim()
    } else if (line.startsWith('### TASK:')) {
      pushTask(); pushDoc()
      currentTask = { title: line.replace('### TASK:', '').trim(), priority: 'MEDIUM', status: 'TODO', tags: [], description: '' }
    } else if (line.startsWith('### DOC:')) {
      pushTask(); pushDoc()
      currentDoc = { title: line.replace('### DOC:', '').trim(), content: '' }
    } else if (currentTask) {
      if (line.startsWith('PRIORITY:')) currentTask.priority = line.replace('PRIORITY:', '').trim()
      else if (line.startsWith('STATUS:'))   currentTask.status = line.replace('STATUS:', '').trim()
      else if (line.startsWith('TAGS:'))     currentTask.tags = line.replace('TAGS:', '').trim().split(',').map(t => t.trim()).filter(Boolean)
      else if (line.startsWith('DESCRIPTION:')) currentTask.description = line.replace('DESCRIPTION:', '').trim()
    } else if (currentDoc) {
      if (line.startsWith('CONTENT:')) currentDoc.content = `# ${currentDoc.title}\n\n${line.replace('CONTENT:', '').trim()}`
    }
  }
  pushModule()

  return { projectName, projectDesc, modules }
}

export async function POST(req: NextRequest) {
  if (!validatePin(req)) return unauthorizedResponse()

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return Response.json({ error: 'No file uploaded' }, { status: 400 })

  const text = await file.text()

  // Strip code fences if AI wrapped in ```markdown
  const stripped = text.replace(/^```(?:markdown)?\n?/m, '').replace(/\n?```\s*$/m, '').trim()

  const parsed = parseMarkdown(stripped)
  if (!parsed.projectName) return Response.json({ error: 'Could not parse project name from markdown' }, { status: 422 })

  const projectsData = readJSON<ProjectsData>('projects')
  const modulesData  = readJSON<ModulesData>('modules')
  const tasksData    = readJSON<TasksData>('tasks')
  const docsData     = readJSON<DocsData>('docs')

  const summary = { projectCreated: false, modulesCreated: 0, tasksCreated: 0, docsCreated: 0, projectName: parsed.projectName }

  // Find or create project
  let project = projectsData.projects.find(p => p.name.toLowerCase() === parsed.projectName.toLowerCase())
  if (!project) {
    project = {
      id: `proj_${uuid().slice(0, 8)}`,
      name: parsed.projectName,
      description: parsed.projectDesc || '',
      color: '#6366f1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    projectsData.projects.push(project)
    summary.projectCreated = true
  }

  for (const mod of parsed.modules) {
    // Find or create module
    let module = modulesData.modules.find(
      m => m.project_id === project!.id && m.name.toLowerCase() === mod.name.toLowerCase()
    )
    if (!module) {
      module = {
        id: `mod_${uuid().slice(0, 8)}`,
        project_id: project.id,
        name: mod.name,
        description: mod.description || '',
        order: modulesData.modules.filter(m => m.project_id === project!.id).length,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      modulesData.modules.push(module)
      summary.modulesCreated++
    }

    // Create tasks
    for (let i = 0; i < mod.tasks.length; i++) {
      const t = mod.tasks[i]
      const exists = tasksData.tasks.find(
        x => x.module_id === module!.id && x.title.toLowerCase() === t.title.toLowerCase()
      )
      if (!exists) {
        const validStatuses = ['TODO','IN_PROGRESS','IN_REVIEW','DONE']
        const validPriorities = ['LOW','MEDIUM','HIGH','CRITICAL']
        tasksData.tasks.push({
          id: `task_${uuid().slice(0, 8)}`,
          module_id: module.id,
          title: t.title,
          description: t.description || '',
          status: (validStatuses.includes(t.status) ? t.status : 'TODO') as Task['status'],
          priority: (validPriorities.includes(t.priority) ? t.priority : 'MEDIUM') as Task['priority'],
          tags: t.tags,
          order: i,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        summary.tasksCreated++
      }
    }

    // Create docs
    for (const d of mod.docs) {
      const exists = docsData.docs.find(
        x => x.module_id === module!.id && x.title.toLowerCase() === d.title.toLowerCase()
      )
      if (!exists) {
        docsData.docs.push({
          id: `doc_${uuid().slice(0, 8)}`,
          module_id: module.id,
          title: d.title,
          content: d.content || `# ${d.title}\n\nStart writing here...`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        summary.docsCreated++
      }
    }
  }

  writeJSON('projects', projectsData)
  writeJSON('modules',  modulesData)
  writeJSON('tasks',    tasksData)
  writeJSON('docs',     docsData)

  return Response.json({ success: true, summary })
}
